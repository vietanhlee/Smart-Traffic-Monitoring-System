FROM node:20-alpine AS build

WORKDIR /frontend

# pnpm
RUN npm install -g pnpm@9.14.4

# copy dependency first (cache tốt)
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# copy full source
COPY . .

# build
RUN pnpm run build


# --- Runtime ---
FROM nginx:1.27-alpine
    
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]