import * as SecureStore from 'expo-secure-store';
import { fetch as expoFetch } from 'expo/fetch';
import { router } from 'expo-router';
import { Alert } from 'react-native';

const originalFetch = fetch;
const authKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID}-jwt`;

// Endpoints where 401 means "wrong credentials", not "session expired"
const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register'];

const isAuthEndpoint = (url: string) => {
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

const handleUnauthorized = async (url: string) => {
  // Don't auto-logout on login/register failures
  if (isAuthEndpoint(url)) {
    return;
  }

  // Clear stored auth
  await SecureStore.deleteItemAsync(authKey);

  // Show alert and redirect to login
  Alert.alert(
    'Session Expired',
    'Your session has expired. Please sign in again.',
    [
      {
        text: 'OK',
        onPress: () => router.replace('/login'),
      },
    ]
  );
};

const getURLFromArgs = (...args: Parameters<typeof fetch>) => {
  const [urlArg] = args;
  let url: string | null;
  if (typeof urlArg === 'string') {
    url = urlArg;
  } else if (typeof urlArg === 'object' && urlArg !== null) {
    url = urlArg.url;
  } else {
    url = null;
  }
  return url;
};

const isFileURL = (url: string) => {
  return url.startsWith('file://') || url.startsWith('data:');
};

const isFirstPartyURL = (url: string) => {
  return (
    url.startsWith('/') ||
    (process.env.EXPO_PUBLIC_BASE_URL && url.startsWith(process.env.EXPO_PUBLIC_BASE_URL))
  );
};

const isSecondPartyURL = (url: string) => {
  return url.startsWith('/_create/');
};

type Params = Parameters<typeof expoFetch>;
const fetchToWeb = async function fetchWithHeaders(...args: Params) {
  const firstPartyURL = process.env.EXPO_PUBLIC_BASE_URL;
  const secondPartyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
  const [input, init] = args;
  const url = getURLFromArgs(input, init);
  if (!url) {
    return expoFetch(input, init);
  }

  if (isFileURL(url)) {
    return originalFetch(input, init);
  }

  const isExternalFetch = !isFirstPartyURL(url);
  // we should not add headers to requests that don't go to our own server
  if (isExternalFetch) {
    return expoFetch(input, init);
  }

  let finalInput = input;
  const baseURL = isSecondPartyURL(url) ? secondPartyURL : firstPartyURL;
  if (typeof input === 'string') {
    finalInput = input.startsWith('/') ? `${baseURL}${input}` : input;
  } else {
    return expoFetch(input, init);
  }

  const initHeaders = init?.headers ?? {};
  const finalHeaders = new Headers(initHeaders);

  const headers = {
    'x-createxyz-project-group-id': process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
    host: process.env.EXPO_PUBLIC_HOST,
    'x-forwarded-host': process.env.EXPO_PUBLIC_HOST,
    'x-createxyz-host': process.env.EXPO_PUBLIC_HOST,
  };

  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      finalHeaders.set(key, value);
    }
  }

  const auth = await SecureStore.getItemAsync(authKey)
    .then((auth) => {
      return auth ? JSON.parse(auth) : null;
    })
    .catch(() => {
      return null;
    });

  if (auth) {
    finalHeaders.set('authorization', `Bearer ${auth.jwt}`);
  }

  const response = await expoFetch(finalInput, {
    ...init,
    headers: finalHeaders,
  });

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    await handleUnauthorized(url);
  }

  return response;
};

export default fetchToWeb;
