FROM node:22-alpine

WORKDIR /app

ARG NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
ENV NPM_CONFIG_REGISTRY=$NPM_CONFIG_REGISTRY \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_timeout=300000

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY index.html ./
COPY eslint.config.js ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY src ./src

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
