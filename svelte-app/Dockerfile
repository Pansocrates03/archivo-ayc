# /svelte-app/Dockerfile

# Etapa 1: Compilación
FROM node:22-alpine AS build

WORKDIR /app

# Copia los archivos de configuración
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm install

# Copia el código fuente
COPY . .

# Compila la aplicación
RUN npm run build

# Etapa 2: Servir la aplicación
FROM nginx:alpine

# Copia la aplicación compilada a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expón el puerto
EXPOSE 80

# Comando para iniciar Nginx (ya es el default)
CMD ["nginx", "-g", "daemon off;"]