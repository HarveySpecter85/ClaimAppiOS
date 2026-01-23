import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect } from 'react';
import { useAuthStore, authKey } from './store';

/**
 * This hook provides authentication functionality.
 * Use signOut to log the user out. For login, redirect to /login screen.
 */
export const useAuth = () => {
  const { isReady, auth, setAuth } = useAuthStore();

  const initiate = useCallback(() => {
    SecureStore.getItemAsync(authKey).then((auth) => {
      useAuthStore.setState({
        auth: auth ? JSON.parse(auth) : null,
        isReady: true,
      });
    });
  }, []);

  const signOut = useCallback(() => {
    setAuth(null);
    router.replace('/login');
  }, [setAuth]);

  return {
    isReady,
    isAuthenticated: isReady ? !!auth : null,
    signOut,
    auth,
    setAuth,
    initiate,
  };
};

/**
 * This hook will redirect to login if the user is not authenticated.
 */
export const useRequireAuth = () => {
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && isReady) {
      router.replace('/login');
    }
  }, [isAuthenticated, isReady]);
};

export default useAuth;