import * as fs from 'fs';

interface ApplicationConfig {
  logLevel: string;
  hideLogo: boolean;
  fetchInterval: number;
}

interface WebServerConfig {
  port: number;
  httpPath: string;
  wsPath: string;
}

interface Life360Config {
  clientToken: string;
  username: string;
  password: string;
  circle: string;
  member: string;
}

interface OpenStreetMapConfig {
  language: string;
}

interface OpenWeatherMapConfig {
  apiKey: string;
}

interface Config {
  application: ApplicationConfig;
  webServer: WebServerConfig;
  life360: Life360Config;
  openweathermap: OpenWeatherMapConfig;
  openstreetmap: OpenStreetMapConfig;
}

const config: Config = JSON.parse(fs.readFileSync('./data/config.json', 'utf8'));

config.application.logLevel = process.env.APP_LOG_LEVEL || config.application.logLevel;
config.application.hideLogo = process.env.APP_HIDE_LOGO ? JSON.parse(process.env.APP_HIDE_LOGO) : config.application.hideLogo;
config.application.fetchInterval = parseInt(process.env.APP_FETCH_INTERVAL || '', 10) || config.application.fetchInterval;
config.webServer.port = parseInt(process.env.WEBSERVER_PORT || '', 10) || config.webServer.port;
config.webServer.httpPath = process.env.WEBSERVER_HTTP_PATH || config.webServer.httpPath;
config.webServer.wsPath = process.env.WEBSERVER_WS_PATH || config.webServer.wsPath;
config.life360.clientToken = process.env.LIFE360_CLIENT_TOKEN || config.life360.clientToken;
config.life360.username = process.env.LIFE360_USERNAME || config.life360.username;
config.life360.password = process.env.LIFE360_PASSWORD || config.life360.password;
config.life360.circle = process.env.LIFE360_CIRCLE || config.life360.circle;
config.life360.member = process.env.LIFE360_MEMBER || config.life360.member;
config.openweathermap.apiKey = process.env.OPENWEATHERMAP_API_KEY || config.openweathermap.apiKey;
config.openstreetmap.language = process.env.OPENSTREETMAP_LANGUAGE || config.openstreetmap.language;

export default config;
