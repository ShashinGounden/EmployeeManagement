FROM node:18-alpine as builder
WORKDIR /app
COPY package.json package-lock.json .
RUN npm i
COPY . .
RUN npm run build

FROM nginx:1.25.2
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/build .
ENTRYPOINT ["nginx", "-g", "daemon off;"]