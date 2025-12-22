<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Giris</h2>

      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Sifre" />

      <button @click="login">Giris Yap</button>

      <p v-if="error" class="error">{{ error }}</p>

      <p class="helper">
Hesabin yok mu?
<span @click="router.push('/register')" class="link">
Kayit ol
</span>
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

    // 🔐 kullanıcıyı kaydet
    userStore.setUser(res.data);

    // 🔌 socket bağla (autoConnect:false olduğu için)
    socket.connect();
    socket.emit("user-online", res.data._id);

    router.push("/friends");

  } catch (err) {
    console.error(err);

    if (err.response) {
      error.value = "Email veya şifre hatalı";
    } else {
      error.value = "Sunucuya bağlanılamıyor";
    }
  }
};
</script>
<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap");

.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 16px;
  background:
    radial-gradient(1000px 480px at 10% -10%, rgba(47, 210, 180, 0.2), transparent 60%),
    radial-gradient(900px 620px at 90% 10%, rgba(255, 190, 118, 0.18), transparent 60%),
    #0b0f14;
  color: var(--text);
  font-family: "Space Grotesk", "Segoe UI", system-ui, sans-serif;
  --bg: #0b0f14;
  --bg-elev: #121826;
  --text: #e9edf5;
  --text-muted: #a8b3c7;
  --border: rgba(255, 255, 255, 0.08);
  --accent: #2fd2b4;
  --accent-strong: #4ff0cf;
  --accent-dark: #04211e;
  --shadow-soft: 0 24px 48px rgba(6, 10, 16, 0.55);
}

.auth-page::before {
  content: "";
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 13, 20, 0.6), rgba(10, 13, 20, 0.9));
  pointer-events: none;
}

.auth-card {
  position: relative;
  z-index: 1;
  width: min(420px, 92vw);
  background: rgba(19, 27, 41, 0.95);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 24px;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 12px;
  animation: rise 0.5s ease both;
}

h2 {
  margin: 0 0 6px 0;
  color: var(--text);
  font-weight: 700;
  font-family: "Fraunces", "Space Grotesk", sans-serif;
  letter-spacing: 0.2px;
}

input {
  background: rgba(19, 27, 41, 0.85);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  color: var(--text);
}

button {
  background: linear-gradient(120deg, var(--accent), #7fe7d4);
  color: var(--accent-dark);
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 14px 26px rgba(47, 210, 180, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 30px rgba(47, 210, 180, 0.3);
}

.error {
  color: #ffb1b1;
  margin: 0;
}

.helper {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.helper .link {
  cursor: pointer;
  color: var(--accent-strong);
  font-weight: 600;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
