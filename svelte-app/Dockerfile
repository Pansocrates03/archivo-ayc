# /svelte-app/Dockerfile

# Etapa 1: Compilación
FROM node:22-alpine AS build
WORKDIR /app

# Copia los archivos de configuración
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm install

# Copia el resto del cdigo fuente
COPY . .

# Permitir inyectar la variable VITE_POCKETBASE_URL en tiempo de build
# Railway (u otros proveedores) pueden pasar este valor como build arg / env var.
ARG VITE_POCKETBASE_URL
RUN echo "VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}" > .env

# Compila la aplicacin (Vite leer .env durante el build)
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