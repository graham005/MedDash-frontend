import { API_URL } from '@/api/url';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
}

class TokenManager {
  private refreshPromise: Promise<string> | null = null;
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly TOKEN_EXPIRES_KEY = 'tokenExpiresAt';

  /**
   * Store tokens and calculate expiration time
   */
  setTokens(accessToken: string, refreshToken: string): void {
    try {
      // Decode JWT to get expiration
      const payload = this.decodeJWT(accessToken);
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(this.TOKEN_EXPIRES_KEY, expiresAt.toString());
    } catch (error) {
      console.error('Error storing tokens:', error);
      this.clearTokens();
    }
  }

  /**
   * Get access token if valid, otherwise refresh it
   */
  async getValidAccessToken(): Promise<string | null> {
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (!accessToken || !refreshToken) {
      return null;
    }

    // Check if access token is still valid
    if (this.isTokenValid(accessToken)) {
      return accessToken;
    }

    // Check if refresh token is valid
    if (!this.isTokenValid(refreshToken)) {
      this.clearTokens();
      return null;
    }

    // Refresh the access token
    return await this.refreshAccessToken();
  }

  /**
   * Check if a token is valid (not expired)
   */
  private isTokenValid(token: string): boolean {
    try {
      const payload = this.decodeJWT(token);
      const currentTime = Date.now() / 1000;
      // Add 30 seconds buffer to account for network delay
      return payload.exp > (currentTime + 30);
    } catch (error) {
      return false;
    }
  }

  /**
   * Decode JWT token payload
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh API call
   */
  private async performTokenRefresh(): Promise<string> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);

    if (!refreshToken || !accessToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Extract user ID from current access token
      const payload = this.decodeJWT(accessToken);
      const userId = payload.sub;

      if (!userId) {
        throw new Error('User ID not found in token');
      }

      const response = await fetch(
        `${API_URL}/auth/refresh?id=${userId}&refreshToken=${refreshToken}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${refreshToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.accessToken) {
        throw new Error('No access token received from refresh endpoint');
      }

      // Update stored tokens
      this.setTokens(data.accessToken, refreshToken);
      
      return data.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Get current access token without validation/refresh
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidAccessToken();
    return token !== null;
  }

  /**
   * Check if tokens exist (synchronous check)
   */
  hasTokens(): boolean {
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    return !!(accessToken && refreshToken);
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRES_KEY);
  }

  /**
   * Get user role from token
   */
  getUserRole(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = this.decodeJWT(token);
      return payload.role || payload.userRole || null;
    } catch {
      return null;
    }
  }

  /**
   * Get user ID from token
   */
  getUserId(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = this.decodeJWT(token);
      return payload.sub || payload.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(): Date | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = this.decodeJWT(token);
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  willExpireSoon(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = this.decodeJWT(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      return timeUntilExpiry < 300; // 5 minutes
    } catch {
      return true;
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
