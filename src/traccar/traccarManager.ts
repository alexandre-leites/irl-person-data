import axios, { AxiosResponse } from 'axios';
import WebSocket from 'ws';
import logger from '../utils/logger';

interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string;
}

interface TraccarPosition {
  id: number;
  deviceId: number;
  serverTime: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  accuracy: number;
}

class TraccarManager {
  private apiBaseUrl: string;
  private websocketUrl: string;
  private apiToken: string;
  private sessionCookie: string | null = null;
  private ws: WebSocket | null = null;

  private devices: TraccarDevice[] = [];
  private positions: TraccarPosition[] = [];

  constructor(apiBaseUrl: string, websocketUrl: string, apiToken: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.websocketUrl = websocketUrl;
    this.apiToken = apiToken;
  }

  private async fetchSession(): Promise<void> {
    const response: AxiosResponse = await axios.get(this.apiBaseUrl + '/session', {
      params: { token: this.apiToken },
    });

    // Extract JSESSIONID cookie from the response headers
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const cookies = setCookieHeader[0].split(';');
      const jsessionidCookie = cookies.find(cookie => cookie.startsWith('JSESSIONID'));
      if (jsessionidCookie) {
        this.sessionCookie = jsessionidCookie.split('=')[1];
      }
    }
  }

  public async connect(): Promise<void> {
    if (!this.sessionCookie) {
      await this.fetchSession();
    }

    // Create WebSocket connection using the retrieved session cookie
    this.ws = new WebSocket(this.websocketUrl, {
      headers: {
        Cookie: `JSESSIONID=${this.sessionCookie}`,
      },
    });

    this.ws.on('open', () => {
      logger.info('[Traccar WebSocket API] WebSocket connection opened');
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data);
    });

    this.ws.on('close', () => {
      logger.error('[Traccar WebSocket API] WebSocket connection closed. Attempting to reconnect on the next update.');
    });

    this.ws.on('error', (error) => {
      logger.error(`[Traccar WebSocket API] WebSocket error: ${error}`);
    });
  }

  public async checkConnection(): Promise<void> {
    if (!this.sessionCookie || !this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.sessionCookie = null;
      this.ws = null;
    }
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      if (message.devices) {
        this.devices = message.devices;
        logger.info(`[Traccar WebSocket API] Received device information: ${this.devices}`);
      }

      if (message.positions) {
        this.positions = message.positions;
        logger.info(`[Traccar WebSocket API] Received position information: ${this.positions}`);
      }
    } catch (error) {
      console.error('[Traccar WebSocket API] Error parsing message:', error);
    }
  }

  public async getPositionByUniqueId(uniqueId: string): Promise<TraccarPosition | null> {
    logger.info(`[Traccar WebSocket API] Searching for device with uniqueId: ${uniqueId}, devices: ${this.devices}`);
    const device = this.devices.find(device => device.uniqueId === uniqueId);
    if (!device) {
      return null; // Device not found
    }

    logger.info(`[Traccar WebSocket API] Searching for position with deviceId: ${device.id}, devices: ${this.positions}`);
    const position = this.positions.find(position => position.deviceId === device.id);
    if (!position) {
      return null; // Device has no position
    }

    return position;
  }
}

export default TraccarManager;
