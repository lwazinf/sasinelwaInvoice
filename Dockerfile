FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY public ./public

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
