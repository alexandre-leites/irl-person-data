import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const LIFE360_API_BASE_URL = "https://api-cloudfront.life360.com/v3/";
const LIFE360_API_TOKEN_URL = LIFE360_API_BASE_URL + "oauth2/token.json";

interface Circle {
  id: string;
  name: string;
  members: Member[];
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  location: Location;
}

interface Location {
  latitude: string;
  longitude: string;
  accuracy: string;
  name: string;
  address1: string;
}

class CircleManager {
  private apiBaseUrl: string;
  private apiClientToken: string;
  private authorization: string | null;
  private circleData: Circle[];

  constructor(clientToken: string) {
    this.apiBaseUrl = LIFE360_API_BASE_URL;
    this.apiClientToken = clientToken;
    this.authorization = null;
    this.circleData = [];
  }

  async authorize(username: string, password: string): Promise<string> {
    try {
      const authHeader = `Basic ${this.apiClientToken}`;
      const requestData = new URLSearchParams({
        "grant_type": "password",
        "username": username,
        "password": password
      }).toString();
  
      const config: AxiosRequestConfig = {
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };

      const response: AxiosResponse = await axios.post(LIFE360_API_TOKEN_URL, requestData, config);
      const respJson = response.data;
      this.authorization = `${respJson.token_type} ${respJson.access_token}`;
      return this.authorization;
    } catch (error: any) {
      throw new Error(`Error getting authorization token: ${error}`);
    }
  }  

  async fetchCircles(): Promise<Circle[]> {
    const circlesUrl = this.apiBaseUrl + "circles";
  
    const config: AxiosRequestConfig = {
      headers: {
        "Authorization": this.authorization!,
        "Accept": "application/json"
      },
    };
  
    try {
      const response: AxiosResponse = await axios.get(circlesUrl, config);
      const jsonData = response.data;
  
      this.circleData = jsonData.circles;
  
      await Promise.all(this.circleData.map(circle => this.fetchCircleMembers(circle.name)));
      return this.circleData;
    } catch (error: any) {
      throw new Error(`Error fetching circles: ${error}`);
    }
  }  

  async fetchCircleMembers(circleName: string): Promise<void> {
    try {
      const targetCircle = this.circleData.find(circle => circle.name === circleName);
      if (!targetCircle) {
        throw new Error(`Circle not found: ${circleName}`);
      }
  
      const membersUrl = this.apiBaseUrl + `circles/${targetCircle.id}/members`;
      const config: AxiosRequestConfig = {
        headers: {
          "Authorization": this.authorization!,
          "Accept": "application/json"
        },
      };
  
      const response: AxiosResponse = await axios.get(membersUrl, config);
      const membersData = response.data;
  
      targetCircle.members = membersData.members.map((member: any) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        location: {
          latitude: member.location.latitude,
          longitude: member.location.longitude,
          accuracy: member.location.accuracy,
          name: member.location.name,
          address1: member.location.address1,
        },
      }));
    } catch (error: any) {
      throw new Error(`Error fetching members for circle ${circleName}: ${error}`);
    }
  }  

  getMemberDataByName(circleName: string, memberName: string): Member | undefined {
    const targetCircle = this.circleData.find(circle => circle.name === circleName);
    if (!targetCircle) {
      throw new Error(`Circle not found: ${circleName}`);
    }

    const targetMember = targetCircle.members.find(member => {
      const fullName = `${member.firstName} ${member.lastName}`;
      return fullName === memberName;
    });

    return targetMember;
  }
}

export default CircleManager;
