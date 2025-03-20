FROM node:18-alpine

WORKDIR /app

# Kopiera hela server-mappen
COPY server ./

# Installera alla dependencies inklusive devDependencies
RUN npm install

# Bygg projektet
RUN npm run build

# Ta bort devDependencies
RUN npm prune --production

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "start"] 