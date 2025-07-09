import axios from "axios";

// Use proxy in development, direct URL in production
export const API_URL = 'http://localhost:4000/videlca/api/v1';

export const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});