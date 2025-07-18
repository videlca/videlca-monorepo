import axios from "axios";

// Use proxy in development, direct URL in production
export const API_URL = import.meta.env.VITE_API_URL;

export const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});