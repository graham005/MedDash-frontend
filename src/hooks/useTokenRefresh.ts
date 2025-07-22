import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshAuthToken, clearAuthTokens } from '@/api/auth';
import { shouldRefreshToken } from '@/utils/tokenUtils';

export const useTokenRefresh = () => {
  const queryClient = useQueryClient();

  const checkAndRefreshToken = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) return;

    if (shouldRefreshToken(token)) {
      try {
        console.log('Proactively refreshing token...');
        const newToken = await refreshAuthToken();
        localStorage.setItem('accessToken', newToken);
        
        // Invalidate queries to refetch with new token
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearAuthTokens();
        queryClient.clear();
        window.location.href = '/login';
      }
    }
  }, [queryClient]);

  useEffect(() => {
    // Check token on mount
    checkAndRefreshToken();

    // Set up interval to check token every 2 minutes
    const interval = setInterval(checkAndRefreshToken, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAndRefreshToken]);

  return { checkAndRefreshToken };
};