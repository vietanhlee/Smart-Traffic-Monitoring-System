ARG NODE_VERSION=20.17.0
ARG PNPM_VERSION=9.14.4

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=development

RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /frontend

RUN pnpm install

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
