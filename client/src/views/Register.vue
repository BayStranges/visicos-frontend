<template>
  <div class="auth-page register-page">
    <div class="auth-card">
      <h2>Kayit Ol</h2>
      <p class="subtitle">Nexora topluluguna katil.</p>

      <input v-model="username" placeholder="Kullanici adi" />
      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Sifre" />

      <button @click="register">Kayit Ol</button>

      <p v-if="error" class="error">{{ error }}</p>

      <p class="helper">
        Zaten hesabin var mi?
        <span @click="router.push('/login')" class="link">Giris yap</span>
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

const username = ref("");
const email = ref("");
const password = ref("");
const error = ref("");

const router = useRouter();
const userStore = useUserStore();

const register = async () => {
  error.value = "";

  try {
    const res = await axios.post("/api/auth/register", {
      username: username.value,
      email: email.value,
      password: password.value
    });

    userStore.setUser(res.data, res.data?.token);
    socket.connect();
    socket.emit("user-online", res.data._id);

    router.push("/friends");
  } catch (err) {
    console.error(err);
    error.value = "Kayit basarisiz (email veya kullanici adi kullanimda olabilir)";
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

.register-page .auth-card {
  border-color: rgba(120, 174, 228, 0.36);
}

.auth-card {
  width: min(440px, 92vw);
  background: linear-gradient(160deg, rgba(16, 30, 44, 0.95), rgba(11, 24, 37, 0.93));
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
  background: rgba(11, 21, 33, 0.92);
  border: 1px solid rgba(98, 135, 185, 0.5);
  border-radius: 12px;
  padding: 11px 12px;
  color: var(--text);
}

button {
  background: linear-gradient(135deg, #7fc7ff, #348dff);
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
