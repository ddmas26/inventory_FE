# Build Stage: compile the Vite/React bundle
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first so the (slow) install layer is reused when only source changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and produce the static bundle in /app/dist
COPY . .
RUN npm run build

# Serve Stage: nginx serves the static files and proxies the API
FROM nginx:alpine

# SPA routing + reverse proxy for /api and /uploads
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vite's default output directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Keep nginx in the foreground so it stays PID 1
CMD ["nginx", "-g", "daemon off;"]
