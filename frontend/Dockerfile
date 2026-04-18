
# Specify Node and PNPM versions, fallback to latest pnpm if not set
ARG NODE_VERSION=20.17.0

# --- Build Stage ---
ARG NODE_VERSION=20.17.0
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /frontend

# Install pnpm globally (avoid corepack signature issues)
RUN npm install -g pnpm@9.14.4

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# --- Runtime Stage ---
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /frontend/dist /usr/share/nginx/html
COPY --from=build /frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
