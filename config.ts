import * as fs from 'fs';

interface ApplicationConfig {
  logLevel: string;
  hideLogo: boolean;
}

interface WebServerConfig {
  port: number;
  httpPath: string;
  wsPath: string;
}

interface TraccarConfig {
  apiToken: string;
  apiBaseUrl: string;
  websocketUrl: string;
  deviceUniqueId: string;
  fetchInterval: number;
}

interface OpenStreetMapConfig {
  language: string;
}

interface OpenWeatherMapConfig {
  apiKey: string;
  fetchInterval: number;
}

interface Config {
  application: ApplicationConfig;
  webServer: WebServerConfig;
  traccar: TraccarConfig;
  openweathermap: OpenWeatherMapConfig;
  openstreetmap: OpenStreetMapConfig;
}

const config: Config = JSON.parse(fs.readFileSync('./data/config.json', 'utf8'));

config.application.logLevel = process.env.APP_LOG_LEVEL || config.application.logLevel;
config.application.hideLogo = process.env.APP_HIDE_LOGO ? JSON.parse(process.env.APP_HIDE_LOGO) : config.application.hideLogo;

config.webServer.port = parseInt(process.env.WEBSERVER_PORT || '', 10) || config.webServer.port;
config.webServer.httpPath = process.env.WEBSERVER_HTTP_PATH || config.webServer.httpPath;
config.webServer.wsPath = process.env.WEBSERVER_WS_PATH || config.webServer.wsPath;

config.traccar.apiToken = process.env.TRACCAR_API_TOKEN || config.traccar.apiToken;
config.traccar.apiBaseUrl = process.env.TRACCAR_API_BASE_URL || config.traccar.apiBaseUrl;
config.traccar.websocketUrl = process.env.TRACCAR_WEBSOCKET_URL || config.traccar.websocketUrl;
config.traccar.deviceUniqueId = process.env.TRACCAR_DEVICE_UNIQUEID || config.traccar.deviceUniqueId;
config.traccar.fetchInterval = parseInt(process.env.TRACCAR_FETCH_INTERVAL || '', 10) || config.traccar.fetchInterval;

config.openweathermap.apiKey = process.env.OPENWEATHERMAP_API_KEY || config.openweathermap.apiKey;
config.openweathermap.fetchInterval = parseInt(process.env.OPENWEATHERMAP_FETCH_INTERVAL || '', 10) || config.openweathermap.fetchInterval;

config.openstreetmap.language = process.env.OPENSTREETMAP_LANGUAGE || config.openstreetmap.language;

export default config;
