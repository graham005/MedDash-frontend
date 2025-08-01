import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
  [key: string]: any;
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    return payload.exp * 1000 < Date.now() + 5000; // Expired if within 5 seconds of now
  } catch (e) {
    return true; // Malformed token is effectively expired
  }
};

export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    console.log(payload)
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error parsing token expiration:', error);
    return null;
  }
};

export const shouldRefreshToken = (token: string): boolean => {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    const expiryTime = payload.exp * 1000;
    const now = Date.now();
    const refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes before actual expiry

    return expiryTime - now < refreshThreshold;
  } catch (e) {
    return true; // Malformed token should trigger refresh (or re-login)
  }
};