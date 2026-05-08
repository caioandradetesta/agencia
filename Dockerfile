# Estágio 1: Build do Frontend
FROM node:22-alpine as frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Setup do Servidor e Execução
FROM node:22-alpine
WORKDIR /app

# Copiar arquivos do servidor
COPY server/package*.json ./server/
RUN cd server && npm install --production

COPY server ./server
COPY --from=frontend-builder /app/dist ./dist

# Variáveis de ambiente
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/index.js"]
