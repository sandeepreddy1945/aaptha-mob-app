const PRODUCTION_API_BASE_URL = 'https://location-backend-mup5.onrender.com';
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');

export const API_BASE_URL = configuredApiBaseUrl || (__DEV__ ? PRODUCTION_API_BASE_URL : '');

const configuredLocationEndpoint = process.env.EXPO_PUBLIC_LOCATION_ENDPOINT?.trim();
export const LOCATION_ENDPOINT =
  configuredLocationEndpoint || (API_BASE_URL ? `${API_BASE_URL}/locations` : '');
