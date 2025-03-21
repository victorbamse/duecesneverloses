FROM node:18-alpine as build

WORKDIR /app

# Kopiera frontend package.json
COPY package*.json ./

# Installera dependencies
RUN npm install

# Kopiera frontend-koden
COPY . .

# Bygg frontend
RUN npm run build

# Produktionssteg
FROM node:18-alpine

WORKDIR /app

# Installera serve globalt
RUN npm install -g serve

# Kopiera byggda filer från build-steget
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Starta serve med den byggda frontend-koden
CMD ["serve", "-s", "dist", "-l", "3000"] 