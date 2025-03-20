FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
COPY server/dist ./dist

RUN npm install --production

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "start"] 