import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import CircleManager from '../life360/circleManager';
import GeoLocation from '../openstreetmap/geoLocation';
import config from '../../config';
import Weather from '../openweathermap/weather';
import logger from '../utils/logger';

class ServerManager {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocket.Server;

  private circleManager: CircleManager;
  private geoLocation: GeoLocation;
  private weather: Weather;
  private lastData: any;

  constructor() {
    this.circleManager = new CircleManager(config.life360.clientToken);
    this.geoLocation = new GeoLocation();
    this.weather = new Weather(config.openweathermap.apiKey);
    this.lastData = null;

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
        ws.send(this.lastData);
      }
    });
  }

  public sendToClients(data: any): void {
    const formattedData = JSON.stringify(data);

    if (formattedData !== this.lastData) {
      this.lastData = formattedData;
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(formattedData);
        }
      });
    }
  }

  private async fetchData() {
    try {
      // Authenticate
      logger.info('[Life360] Authenticating');
      await this.circleManager.authorize(config.life360.username, config.life360.password);

      // Fetch Data
      logger.info('[Life360] Fetching circles');
      await this.circleManager.fetchCircles();

      // Fetch user position from Life360
      logger.info('[Life360] Fetching user');
      const userPosition = this.circleManager.getMemberDataByName(
        config.life360.circle,
        config.life360.member
      );

      if (userPosition) {
        const latitude = parseFloat(userPosition.location.latitude);
        const longitude = parseFloat(userPosition.location.longitude);

        // Fetch geolocation data
        logger.info('[OpenStreetMap] Fetching user location details');
        const locationDetails = await this.geoLocation.getLocationDetails(latitude, longitude);

        // Fetch weather data
        logger.info('[OpenWeatherMap] Fetching user weather details');
        const weatherData = await this.weather.fetchWeather(latitude, longitude);

        // Build the final object
        const finalObject = {
          userPosition,
          locationDetails,
          weatherData,
        };

        this.sendToClients(finalObject);

        logger.info('User information updated.')
      } else {
        logger.error('User position not found.');
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
    }, config.application.fetchInterval);

  }
}

export default ServerManager;
