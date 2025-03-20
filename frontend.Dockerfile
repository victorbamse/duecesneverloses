FROM node:18-alpine

WORKDIR /app

# Kopiera package.json och package-lock.json
COPY package*.json ./

# Installera dependencies
RUN npm install

# Kopiera resten av frontend-koden
COPY . .

# Bygg frontend
RUN npm run build

# Installera en enkel server för att servera statiska filer
RUN npm install -g serve

EXPOSE 3000

# Starta serve med den byggda frontend-koden
CMD ["serve", "-s", "dist", "-l", "3000"] 