import axios from "axios";

export const testProtected = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("https://visicos-backend.onrender.com/api/test/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Backend Hatası:", err.response?.data || err);
    throw err;
  }
};
