import axios from "axios";

export const backendClient = axios.create({
  baseURL: process.env.BACKEND_URL,
  timeout: 15000,
  withCredentials: true,
});
