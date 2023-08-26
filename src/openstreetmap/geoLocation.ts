import axios, { AxiosResponse } from 'axios';

interface LocationDetails {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: {
    house_number: string;
    road: string;
    suburb: string;
    borough: string;
    city: string;
    "ISO3166-2-lvl4": string;
    postcode: string;
    country: string;
    country_code: string;
  };
  boundingbox: [string, string, string, string];
}

interface ErrorResponse {
  error: {
    code: number;
    message: string;
  } | string;
}

class GeoLocation {
  getLocationDetails(lat: number, lon: number): Promise<LocationDetails | ErrorResponse> {
    const baseUrl = 'https://nominatim.openstreetmap.org/reverse';
    const format = 'json';
    const apiUrl = `${baseUrl}?format=${format}&lat=${lat}&lon=${lon}`;

    return axios.get(apiUrl)
      .then((response: AxiosResponse<LocationDetails>) => {
        const data = response.data;

        if (data && data.address) {
          return data;
        } else {
          throw new Error('No results found');
        }
      })
      .catch((error: any) => {
        const errorMessage = typeof error.response?.data === 'object'
          ? error.response.data.message
          : error.response?.data || 'Unknown error';

        throw new Error(`Error fetching location details: ${errorMessage}`);
      });
  }
}

export default GeoLocation;
