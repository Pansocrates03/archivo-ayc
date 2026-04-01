export function timestampToDate(ts: string) {
    const date = new Date(ts);
    date.setDate(date.getDate() + 1);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-MX', options);
  }