export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://visicos-backend.onrender.com";

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

export const ASSET_BASE_URL =
  import.meta.env.VITE_ASSET_BASE_URL || API_BASE_URL;
