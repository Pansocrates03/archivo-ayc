# Archivo de Arte y Cultura del Tec de Monterrey
Este proyecto busca preservar los proyectos profesionales realizados por el tecnológico de monterrey.

## Quickstart

### Clone the app
```
git clone https://github.com/Pansocrates03/archivo-ayc
cd archivo-ayc
```

### Add the environment variables
```
# archivo-ayc/svelte-app/.env
# Si es local asegurate de que sea:http://127.0.0.1:8090
# Si es producción asegúrate de usar la IP del servidor
VITE_POCKETBASE_URL=http://0.0.0.0:8090
```

### Frontend
```
cd svelte-app
npm install
npm run dev
```

### Backend
```
cd pocketbase
./pocketbase serve
```

Accede a [localhost:](http://localhost:5173/)

## Inicia la app en una VM
Prerequisitos:
- Docker
- git
- nodejs version 22

```
git clone https://github.com/Pansocrates03/archivo-ayc
cd archivo-ayc
nano .env #añade las variables
docker-compose -d up
```
