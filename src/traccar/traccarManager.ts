import axios, { AxiosResponse } from 'axios';
import WebSocket from 'ws';

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

    if (this.sessionCookie) {
      // Create WebSocket connection using the retrieved session cookie
      if(!this.ws) {
        this.ws = new WebSocket(this.websocketUrl, {
          headers: {
            Cookie: `JSESSIONID=${this.sessionCookie}`,
          },
        });
      }

      if (this.ws) {
        this.ws.on('message', (data) => {
          this.handleMessage(data);
        });
      } else {
        this.sessionCookie = null;
        throw new Error(`Failed to connect with the Traccar WebSocket API`);
      }
    } else {
      throw new Error(`Failed to obtain session cookies`);
    }
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      if (message.devices) {
        this.devices = message.devices;
        console.log('[Traccar WebSocket API] Received device information: ', this.devices);
      }

      if (message.positions) {
        this.positions = message.positions;
        console.log('[Traccar WebSocket API] Received position information: ', this.positions);
      }
    } catch (error) {
      console.error('[Traccar WebSocket API] Error parsing message:', error);
    }
  }

  public async getPositionByUniqueId(uniqueId: string): Promise<TraccarPosition | null> {
    const device = this.devices.find(device => device.uniqueId === uniqueId);
    if (!device) {
      return null; // Device not found
    }

    const position = this.positions.find(position => position.deviceId === device.id);
    if (!position) {
      return null; // Device has no position
    }

    return position;
  }
}

export default TraccarManager;
