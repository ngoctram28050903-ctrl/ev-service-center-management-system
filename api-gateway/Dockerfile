# api-gateway/Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# copy package manifests first to leverage docker cache
COPY package.json package-lock.json* ./

RUN npm ci --only=production

# copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "index.js"]
