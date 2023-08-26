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
ENV APP_FETCH_INTERVAL=60000
ENV WEBSERVER_PORT=9081
ENV WEBSERVER_HTTP_PATH=/
ENV WEBSERVER_WS_PATH=/ws
ENV LIFE360_CLIENT_TOKEN=MyToken
ENV LIFE360_USERNAME=test
ENV LIFE360_PASSWORD=test
ENV LIFE360_CIRCLE=circle
ENV LIFE360_MEMBER=My Name
ENV OPENWEATHERMAP_API_KEY=ApiKey

CMD ["node", "dist/app.js"]
