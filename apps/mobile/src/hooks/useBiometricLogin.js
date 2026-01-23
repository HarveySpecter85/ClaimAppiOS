import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CREDENTIALS_KEY = 'biometric-credentials';

/**
 * Hook for managing biometric authentication (FaceID/TouchID).
 * Stores credentials securely and uses biometrics to unlock them.
 */
export const useBiometricLogin = () => {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if biometrics are available on this device
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        setIsBiometricAvailable(hasHardware && isEnrolled);

        if (hasHardware && isEnrolled) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('FaceID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('TouchID');
          }
        }

        // Check if we have stored credentials
        const storedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
        setHasStoredCredentials(!!storedCredentials);
      } catch (error) {
        console.error('Error checking biometric availability:', error);
        setIsBiometricAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkBiometricAvailability();
  }, []);

  /**
   * Store credentials for biometric login.
   * Call this after a successful password login.
   */
  const saveCredentials = useCallback(async (email, password) => {
    try {
      const credentials = JSON.stringify({ email, password });
      await SecureStore.setItemAsync(CREDENTIALS_KEY, credentials, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      setHasStoredCredentials(true);
      return true;
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  }, []);

  /**
   * Remove stored credentials (e.g., on logout or disable biometrics).
   */
  const clearCredentials = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
      setHasStoredCredentials(false);
      return true;
    } catch (error) {
      console.error('Error clearing credentials:', error);
      return false;
    }
  }, []);

  /**
   * Authenticate with biometrics and retrieve stored credentials.
   * Returns { success: true, credentials: { email, password } } or { success: false, error: string }
   */
  const authenticateAndGetCredentials = useCallback(async () => {
    if (!isBiometricAvailable) {
      return { success: false, error: 'Biometrics not available' };
    }

    if (!hasStoredCredentials) {
      return { success: false, error: 'No stored credentials' };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Sign in with ${biometricType || 'biometrics'}`,
        cancelLabel: 'Use Password',
        disableDeviceFallback: false, // Allow passcode fallback
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error === 'user_cancel' ? 'cancelled' : result.error
        };
      }

      // Biometric auth succeeded, retrieve credentials
      const storedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
      if (!storedCredentials) {
        return { success: false, error: 'Credentials not found' };
      }

      const credentials = JSON.parse(storedCredentials);
      return { success: true, credentials };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: error.message };
    }
  }, [isBiometricAvailable, hasStoredCredentials, biometricType]);

  /**
   * Get the display name for the biometric type (e.g., "Face ID", "Touch ID")
   */
  const getBiometricDisplayName = useCallback(() => {
    if (Platform.OS === 'ios') {
      return biometricType === 'FaceID' ? 'Face ID' : 'Touch ID';
    }
    return 'Fingerprint';
  }, [biometricType]);

  return {
    isBiometricAvailable,
    biometricType,
    hasStoredCredentials,
    isLoading,
    saveCredentials,
    clearCredentials,
    authenticateAndGetCredentials,
    getBiometricDisplayName,
  };
};

export default useBiometricLogin;
