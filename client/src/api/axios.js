import axios from "axios"; // en üstte

const api = axios.create({
  baseURL: "https://visicos-backend.onrender.com/api/",
});

// 🔥 HER İSTEKTE TOKEN EKLE
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
