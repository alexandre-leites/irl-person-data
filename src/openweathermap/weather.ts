import axios, { AxiosResponse } from 'axios';
import { WEATHER_TRANSLATIONS } from './weatherMap';

class Weather {
  private apiKey: string;
  private weatherDictionary: { [key: string]: any };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.weatherDictionary = WEATHER_TRANSLATIONS;
  }

  fetchWeather(latitude: number, longitude: number): Promise<any> {
    const apiUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.apiKey}`;

    return axios.get(apiUrl)
      .then((response: AxiosResponse) => {
        const data = response.data;

        const currentWeather = data.current;
        const weatherConditions = currentWeather.weather[0].description;
        const weatherIconId = currentWeather.weather[0].id;
        const weatherObject = this.weatherDictionary[weatherIconId] || `${this.weatherDictionary["000"]} (${weatherIconId})`;

        const currentTemperature = Math.round(data.current.temp);
        const feelsLikeTemperature = Math.round(data.current.feels_like);
        const visibility = Math.round(data.current.visibility / 1000);
        const chanceOfPrecipitation = Math.round(data.hourly[0].pop * 100);
        const currentWindSpeed = data.current.wind_speed;
        const currentTimeAtLocation = new Date(data.current.dt * 1000);
        const sunriseTimeAtLocation = new Date(data.current.sunrise * 1000);
        const sunsetTimeAtLocation = new Date(data.current.sunset * 1000);
        const timezoneAtLocation = data.timezone;

        return {
          ...weatherObject,
          currentTemperature,
          feelsLikeTemperature,
          visibility,
          chanceOfPrecipitation,
          currentWindSpeed,
          currentTimeAtLocation,
          sunriseTimeAtLocation,
          sunsetTimeAtLocation,
          timezoneAtLocation,
        };
      })
      .catch((error: any) => {
        throw new Error(`Error fetching weather data: ${error.message}`);
      });
  }
}

export default Weather;
