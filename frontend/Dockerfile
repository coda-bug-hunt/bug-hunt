# Stage 1 — build the static files. Node and the sources stay here.
FROM node:24-alpine AS build

WORKDIR /app

# Install from the lockfile before the sources, so this layer stays cached
# when only the game code changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines these at build time. .env.development is for `npm run dev`
# only, and .dockerignore keeps every .env file out of the image.
# The stand build must call the real API at /api (nginx forwards it).
ENV VITE_API_MODE=http
ENV VITE_API_URL=/api

RUN npm run build

# Stage 2 — serve dist/ only. The final image has no Node and no source.
FROM nginx:1.28-alpine

# The official image runs envsubst on /etc/nginx/templates/*.template
# and writes the result into /etc/nginx/conf.d/ when the container starts.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Address of the API on the stand's Docker network. Override it in Compose.
ENV API_UPSTREAM=http://php:8080

EXPOSE 80
