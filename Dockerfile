FROM node:20-alpine

WORKDIR /app

# Install deps (better caching: copy package files first)
COPY package*.json ./
RUN npm install --omit=dev

# App source
COPY server.js index.html ./

# Where persisted data lives. Mount a volume here in production.
ENV DATA_DIR=/data
RUN mkdir -p /data
VOLUME ["/data"]

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
