# Programas de mano históricos del Tec de Monterrey
Este proyecto busca preservar los proyectos profesionales realizados por el tecnológico de monterrey.

![alt text](image-1.png)
![alt text](image-2.png)
![alt text](image.png)

## Inicio Rápido
Para iniciar este proyecto de forma local es necesario que tengas instalado:

- Bun
- Docker

En caso de no hacer uso de docker necesitarás una instancia de postgreSQL y una servidor S3.

### 1. Clone the app
```shell
git clone https://github.com/Pansocrates03/archivo-ayc
cd archivo-ayc
```

### 2. Run the docker containers
For this app to run you need a postgress database and a minio s3
```shell
docker compose up
```

### 3. Add the environment variables
Crea un archivo llamado `.env` en la carpeta `app` con las siguientes variables de entorno:
```yaml
DATABASE_URL="postgres://admin:secret@localhost:5432/actec_db"

S3_ENDPOINT="http://localhost:9000"
S3_REGION="us-east-1"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="actec-bucket"
S3_FORCE_PATH_STYLE=true
```

### 4. Run the app
```
bun --hot run .\src\index.ts
```
