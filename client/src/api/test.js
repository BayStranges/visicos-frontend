import axios from "axios";

export const testProtected = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:3001/api/test/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Backend Hatası:", err.response?.data || err);
    throw err;
  }
};
