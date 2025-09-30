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


------

------

# How to run Svelte + Pocketbase on a VPS using Docker.
In this tutorial, you will learn to deploy an app to a production environment using only a VPS or virtual machine terminal. This is perfect for people who hire small vps to do small jobs, such as hosting an app using svelte and pocketbase without expecting to get a too much trafic.

## Why Svelte and Pocketbase
Svelte is known for being the most developer friendly frontend (and fullstack including Sveltekit) web framework. Pocketbase, at the same time, is the easiest database to self host using SQLite. It is not advisable to use Pocketbase if you are willing to scale.

## Getting Started
For this tutorial we will be using a monorepo that looks like this:
```
├─ my-project/
    ├─ pocketbase/
    │    ├─ pb_data/
    │    ├─ pb_migrations/
    │    ├─ .gitignore
    │    ├─ CHANGELOG.md
    │    ├─ LICENSE.md
    │    ├─ pocketbase.exe
    ├─ svelte-app/
        ├─ .svelte-kit/
        ├─ .vscode/
        ├─ node_modules/
        ├─ public/
        ├─ src/
        ├─ .env
        ├─ .gitignore
        ├─ Dockerfile
        ├─ index.html
        ├─ other files...
```
Make sure there is a file `.gitignore` inside the pocketbase folder. The only thing you must ignore are the `backups`.

## Step 1. Getting started with Docker
Create a file called `docker-compose.yml` in the root folder, and pase this code:

```yml
version: '3.8'

services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase
    container_name: pocketbase
    restart: always
    ports:
      - "8090:8090"
    volumes:
      - /root/archivo-ayc/pocketbase/pb_data:/pb/data  # Ruta ABSOLUTA
    user: "0:0"

  svelte-frontend:
    build:
      context: ./svelte-app
      dockerfile: Dockerfile
    container_name: svelte-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - pocketbase
```

Now create the `Dockerfile` inside the `svelte-app` folder, and paste this code:

```yml
# /svelte-app/Dockerfile

# Etapa 1: Compilación
FROM node:22-alpine AS build
WORKDIR /app

# Copia los archivos de configuración
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm install

# Copia el archivo .env antes de compilar
COPY .env .

# Copia el resto del código fuente
COPY . .

# Compila la aplicación
RUN npm run build

# Etapa 2: Servir la aplicación
FROM nginx:alpine

# Copia la aplicación compilada a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la configuración personalizada de nginx
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Expón el puerto
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
```

Therefore, your path should look like this:

```
├─ my-project/
    ├─ pocketbase/
    ├─ svelte-app/
        ├─ Dockerfile
    ├─ docker-compose.yml

```

Make sure to push all changes to your github repository.

## Step 2. Running the virtual machine
Start your virtual machine and connect via SSH. You must make sure you have installed these:

1. Docker & Docker Compose
2. Node (In this tutorial we'll be using node 22.14.11)
3. Git 
4. Ngnix

Now that you are sure al dependencies are installed, we will clone our github repo. Note this command will clone a test repository if you don't have one yet.
```shell
$git clone https://github.com/Pansocrates03/archivo-ayc
```

Enter the folder of the project
```
cd archivo-ayc
```
Install all of the svelte app dependencies
```
cd svelte-app
npm install 
```

## Step 3: Run Docker containers
To run the docker containers for your project, move to the root of your project and type this command:
```
docker-compose up -d
```


