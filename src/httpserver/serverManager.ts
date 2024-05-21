import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import TraccarManager from '../traccar/traccarManager';
import GeoLocation from '../openstreetmap/geoLocation';
import config from '../../config';
import Weather from '../openweathermap/weather';
import logger from '../utils/logger';

interface UserData {
  userPosition: any;
  locationDetails: any;
  weatherData: any;
}

class ServerManager {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocket.Server;

  private traccarManager: TraccarManager;
  private geoLocation: GeoLocation;
  private weather: Weather;

  private lastPositionFetch: number;
  private lastWeatherFetch: number;
  private lastData: UserData;

  constructor() {
    this.traccarManager = new TraccarManager(config.traccar.apiBaseUrl, config.traccar.websocketUrl, config.traccar.apiToken);
    this.geoLocation = new GeoLocation();
    this.weather = new Weather(config.openweathermap.apiKey);

    this.lastPositionFetch = 0;
    this.lastWeatherFetch = 0;
    this.lastData = {
      userPosition: null,
      locationDetails: null,
      weatherData: null
    };

    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
  }

  private setupWebSocketConnection(): void {
    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      const clientPort = req.socket.remotePort;
      logger.info(`WebSocket client connected from ${clientIp}:${clientPort}`);

      if (this.lastData) {
        const jsonData = JSON.stringify(this.lastData);
        ws.send(jsonData);
      }
    });
  }

  public sendToClients(data: any): void {
    const jsonData = JSON.stringify(data);

    if (jsonData !== data) {
      this.lastData = data;
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(jsonData);
        }
      });
    }
  }

  private async updatePositionData() {
    // Authenticate
    logger.info('[Traccar] Connect');
    await this.traccarManager.connect();

    // Fetch Data
    logger.info('[Traccar] Fetching Position');
    const userPosition = await this.traccarManager.getPositionByUniqueId(config.traccar.deviceUniqueId);

    this.lastData.userPosition = userPosition;
    return userPosition;
  }

  private async updateLocationDetails() {
    if (!this.lastData.userPosition) {
      logger.info('[OpenStreetMap] Missing location details. Skipping...');
      return this.lastData.locationDetails;
    }

    const latitude = parseFloat(this.lastData.userPosition.latitude);
    const longitude = parseFloat(this.lastData.userPosition.longitude);

    // Fetch geolocation data
    logger.info('[OpenStreetMap] Fetching user location details');
    const locationDetails = await this.geoLocation.getLocationDetails(latitude, longitude);
    this.lastData.locationDetails = locationDetails;

    return locationDetails;
  }

  private async updateWeatherDetails() {
    if (!this.lastData.userPosition) {
      logger.info('[OpenWeatherMap] Missing location details. Skipping...');
      return this.lastData.weatherData;
    }

    logger.info('[OpenWeatherMap] Fetching user weather details');
    const weatherData = await this.weather.fetchWeather(this.lastData.userPosition.latitude, this.lastData.userPosition.longitude);
    this.lastData.weatherData = weatherData;

    return weatherData;
  }

  private async fetchData() {
    try {
      const currentTime = Date.now();
      var shouldUpdate = false;
      
      // Verify if we need to update position data
      if (currentTime - this.lastPositionFetch >= (config.traccar.fetchInterval * 1000)) {
        this.lastPositionFetch = currentTime;
        shouldUpdate = true;

        // Update Location
        await this.updatePositionData();

        // Update Location Details
        await this.updateLocationDetails();
      }

      // Verify if we need to update weather data
      if (this.lastData.userPosition && (currentTime - this.lastWeatherFetch) >= (config.openweathermap.fetchInterval * 1000)) {
        this.lastWeatherFetch = currentTime;
        shouldUpdate = true;
        
        // Update Weather Details
        await this.updateWeatherDetails();
      }

      if (shouldUpdate) {
        this.sendToClients(this.lastData);
        logger.info('User information updated.');
      }
    } catch (error) {
      logger.error('Error fetching and building data:', error);
    }
  }

  private handleHttpGet(req: express.Request, res: express.Response): void {
    res.send(this.lastData);
  }

  startServer(port: number): void {
    this.server.listen(port, () => {
      logger.info(`HTTP server listening on port ${port}`);
    });

    this.setupWebSocketConnection();

    // Explicitly bind the route handler function to the current instance
    this.app.get('/', this.handleHttpGet.bind(this));

    // Fetch initial data
    this.fetchData();

    // Set update interval
    setInterval(() => {
      this.fetchData();
    }, 1000);

  }
}

export default ServerManager;
