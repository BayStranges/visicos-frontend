<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Giris</h2>
      <p class="subtitle">Nexora hesabinla devam et.</p>

      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Sifre" />

      <button @click="login">Giris Yap</button>

      <p v-if="error" class="error">{{ error }}</p>

      <p class="helper">
        Hesabin yok mu?
        <span @click="router.push('/register')" class="link">Kayit ol</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/user";
import socket from "../socket";

const email = ref("");
const password = ref("");
const error = ref("");

const router = useRouter();
const userStore = useUserStore();

const login = async () => {
  error.value = "";

  try {
    const res = await axios.post("/api/auth/login", {
      email: email.value,
      password: password.value
    });

    const user = res.data?.user || res.data;
    const token = res.data?.token;
    const userId = user?._id || user?.id;

    userStore.setUser(user, token);
    socket.connect();
    if (userId) socket.emit("user-online", userId);

    router.push("/friends");
  } catch (err) {
    console.error(err);

    if (err.response) {
      error.value = "Email veya sifre hatali";
    } else {
      error.value = "Sunucuya baglanilamiyor";
    }
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 16px;
  color: var(--text);
}

.auth-card {
  width: min(430px, 92vw);
  background: linear-gradient(160deg, rgba(20, 32, 47, 0.95), rgba(16, 25, 37, 0.92));
  border: 1px solid rgba(106, 152, 214, 0.3);
  border-radius: 22px;
  padding: 26px;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(14px);
  display: grid;
  gap: 12px;
}

h2 {
  margin: 0;
  color: var(--text-strong);
  font-weight: 800;
  font-size: 30px;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: -4px 0 8px;
  color: var(--text-muted);
  font-size: 14px;
}

input {
  background: rgba(12, 20, 31, 0.92);
  border: 1px solid rgba(98, 135, 185, 0.5);
  border-radius: 12px;
  padding: 11px 12px;
  color: var(--text);
}

button {
  background: linear-gradient(135deg, #60b6ff, #2e80ff);
  color: #f8fbff;
  border: none;
  border-radius: 12px;
  padding: 11px 14px;
  cursor: pointer;
  font-weight: 700;
  margin-top: 4px;
}

.error {
  color: #ff8d8d;
  margin: 2px 0;
  font-size: 13px;
}

.helper {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.helper .link {
  cursor: pointer;
  color: #8cc8ff;
  font-weight: 700;
}
</style>
