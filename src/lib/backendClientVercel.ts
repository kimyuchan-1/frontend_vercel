import axios from "axios";
import { serverEnv } from "./env";

export const backendClient = axios.create({
  baseURL: serverEnv.BACKEND_URL,
  timeout: 15000,
  withCredentials: true,
});

// Add request interceptor for debugging (development only)
if (serverEnv.NODE_ENV === 'development') {
  backendClient.interceptors.request.use(
    (config) => {
      console.log(`[Backend Client] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => Promise.reject(error)
  );
}

// Add response interceptor for error handling
backendClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`[Backend Client] Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('[Backend Client] No response received:', error.message);
    } else {
      console.error('[Backend Client] Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);
