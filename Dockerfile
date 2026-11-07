FROM node:22-slim AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY app/package.json ./app/package.json
RUN npm ci
COPY app ./app
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /workspace/app/dist /app/dist
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
