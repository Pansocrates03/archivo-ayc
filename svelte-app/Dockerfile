# /svelte-app/Dockerfile

# Etapa 1: Compilación
FROM node:22-alpine AS build
WORKDIR /app

# Copia los archivos de configuración
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm install

# Copia el archivo .env antes de compilar
#COPY .env . # Se elimina esta linea para railway

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