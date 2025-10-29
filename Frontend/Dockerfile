ARG NODE_VERSION=20.17.0
ARG PNPM_VERSION=9.14.4

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=development

# Install pnpm globally
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /frontend

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install

# Copy rest of the application
COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
