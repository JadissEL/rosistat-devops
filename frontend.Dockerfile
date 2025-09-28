FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
ENV VITE_API_BASE=http://localhost:8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
