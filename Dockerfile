# Phase 1: Build
FROM node:14 AS build
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install
RUN npx tsc

# Phase 2: Final Image
FROM node:14
WORKDIR /opt/app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY data /opt/app/data

RUN npm install

ENV APP_LOG_LEVEL=info
ENV APP_HIDE_LOGO=true

ENV WEBSERVER_PORT=9082
ENV WEBSERVER_HTTP_PATH=/
ENV WEBSERVER_WS_PATH=/ws

ENV TRACCAR_API_TOKEN=MyToken
ENV TRACCAR_API_BASE_URL="http://127.0.0.1:8082/api"
ENV TRACCAR_WEBSOCKET_URL="ws://127.0.0.1:8082/api/socket"
ENV TRACCAR_DEVICE_UNIQUEID="12345678"
ENV TRACCAR_FETCH_INTERVAL=30

ENV OPENWEATHERMAP_API_KEY=ApiKey
ENV OPENWEATHERMAP_FETCH_INTERVAL=300

ENV OPENSTREETMAP_LANGUAGE=en-us

CMD ["node", "dist/app.js"]
