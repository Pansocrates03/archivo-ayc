"""
Script: update_personas_genero.py

Connects to a PocketBase instance and updates every record in the
`personas` collection that has no `genero` set, assigning the value
"femenino".

Usage examples (PowerShell):

  # Using admin email/password (recommended for local testing):
  $env:POCKETBASE_URL = 'http://127.0.0.1:8090'
  $env:POCKETBASE_ADMIN_EMAIL = 'admin@example.com'
  $env:POCKETBASE_ADMIN_PASSWORD = 'secret'
  python python.py

  # Using an existing auth token (if you already have one):
  $env:POCKETBASE_URL = 'https://pb.example.com'
  $env:POCKETBASE_ADMIN_TOKEN = 'your_admin_token_here'
  python python.py --dry-run

Notes:
 - Requires the `requests` package. Install with: pip install requests python-dotenv
 - The script is cautious: it supports --dry-run (no writes) and logs progress.
 - It will attempt admin auth via /api/admins/auth-with-password if email/password are provided.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from typing import Any, Dict, List, Optional

import requests


def get_env(name: str, default: Optional[str] = None) -> Optional[str]:
	return os.environ.get(name, default)


class PocketBaseClient:
	def __init__(self, base_url: str, token: Optional[str] = None) -> None:
		self.base_url = base_url.rstrip('/')
		self.session = requests.Session()
		self.token = token
		if token:
			# add both common headers to maximize compatibility
			self.session.headers.update({
				'Authorization': f'Bearer {token}',
				'X-Auth-Token': token,
				'Content-Type': 'application/json',
			})

	def admin_login(self, email: str, password: str) -> str:
		url = f"{self.base_url}/api/admins/auth-with-password"
		payload = {'identity': email, 'password': password}
		resp = self.session.post(url, json=payload, timeout=30)
		resp.raise_for_status()
		data = resp.json()
		# PocketBase returns a token string in the 'token' key (client SDKs rely on that)
		token = data.get('token') or data.get('meta', {}).get('token')
		if not token:
			# Some older/newer PB versions might nest differently; try to find any key containing 'token'
			for k, v in data.items():
				if 'token' in k and isinstance(v, str):
					token = v
					break
		if not token:
			raise RuntimeError(f"Could not extract token from admin auth response: {data}")

		# update session headers
		self.token = token
		self.session.headers.update({'Authorization': f'Bearer {token}', 'X-Auth-Token': token})
		return token

	def list_records(self, collection: str, per_page: int = 100) -> List[Dict[str, Any]]:
		page = 1
		all_items: List[Dict[str, Any]] = []
		while True:
			url = f"{self.base_url}/api/collections/{collection}/records"
			params = {'page': page, 'perPage': per_page}
			resp = self.session.get(url, params=params, timeout=30)
			resp.raise_for_status()
			data = resp.json()
			items = data.get('items') or data.get('data') or data.get('records') or []
			if not items:
				break
			all_items.extend(items)
			# stop if fewer than requested per_page
			if len(items) < per_page:
				break
			page += 1
			time.sleep(0.05)
		return all_items

	def update_record(self, collection: str, record_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
		url = f"{self.base_url}/api/collections/{collection}/records/{record_id}"
		resp = self.session.patch(url, json=payload, timeout=30)
		resp.raise_for_status()
		return resp.json()


def main() -> int:
	parser = argparse.ArgumentParser(description='Set genero="femenino" for personas without genero')
	parser.add_argument('--dry-run', action='store_true', help='Do not perform writes, just report')
	parser.add_argument('--collection', default='personas', help='Collection name (default: personas)')
	args = parser.parse_args()

	base_url = get_env('PUBLIC_POCKETBASE_URL', 'http://127.0.0.1:8090')
	#admin_token = get_env('POCKETBASE_ADMIN_TOKEN')
	#admin_email = get_env('POCKETBASE_ADMIN_EMAIL')
	#admin_password = get_env('POCKETBASE_ADMIN_PASSWORD')
	admin_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc1OTEyMjcxNywiaWQiOiJ2dmw1bjBzdWZ2Zm9rMDMiLCJyZWZyZXNoYWJsZSI6ZmFsc2UsInR5cGUiOiJhdXRoIn0.Cxykt9NfBglXzugWm6olqauJyHux0b_t8EmBkJo7ciw"
	admin_email = "e.s.baccio@gmail.com"
	admin_password = "essibaPOCKETBASE03*"

	client = PocketBaseClient(base_url, token=admin_token)

	try:
		if not client.token and admin_email and admin_password:
			print('Authenticating as admin using email/password...')
			token = client.admin_login(admin_email, admin_password)
			print('Authenticated. Token length:', len(token))
		elif not client.token:
			print('No admin token or credentials provided. Proceeding unauthenticated (may fail for writes).')

		print(f'Listing records in collection "{args.collection}"...')
		records = client.list_records(args.collection)
		print(f'Found {len(records)} records.')

		to_update = []
		for r in records:
			# assume record fields are at top-level or inside 'record' key depending on API
			record_data = r.get('record') if isinstance(r, dict) and 'record' in r else r
			genero = record_data.get('genero') if isinstance(record_data, dict) else None
			# treat empty string or None or missing as unset
			if genero is None or (isinstance(genero, str) and genero.strip() == ''):
				rec_id = record_data.get('id') or record_data.get('_id') or r.get('id')
				if not rec_id:
					print('Skipping record with no id:', r)
					continue
				to_update.append(rec_id)

		print(f'{len(to_update)} records will be updated to genero="femenino".')

		if args.dry_run:
			print('Dry run enabled - exiting without making changes.')
			return 0

		updated = 0
		for rec_id in to_update:
			try:
				payload = {'genero': 'femenino'}
				client.update_record(args.collection, rec_id, payload)
				updated += 1
				print(f'Updated {rec_id}')
			except Exception as e:
				print(f'Failed to update {rec_id}: {e}', file=sys.stderr)

		print(f'Done. Updated {updated} records.')
		return 0

	except Exception as exc:
		print('Error:', exc, file=sys.stderr)
		return 2


if __name__ == '__main__':
	raise SystemExit(main())

