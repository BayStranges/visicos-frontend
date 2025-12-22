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
<style scoped> .auth-page {   min-height: 100vh;   display: grid;   place-items: center;   padding: 40px 16px;   background: var(--bg);   color: var(--text); }  .auth-card {   width: min(420px, 92vw);   background: var(--bg-elev);   border: 1px solid var(--border);   border-radius: 16px;   padding: 22px;   box-shadow: 0 18px 30px rgba(0,0,0,0.4);   display: grid;   gap: 12px; }  h2 {   margin: 0 0 6px 0;   color: var(--accent);   font-weight: 700; }  input {   background: var(--input-bg);   border: 1px solid var(--border-strong);   border-radius: 10px;   padding: 10px 12px;   color: var(--text); }  button {   background: linear-gradient(145deg, var(--accent-strong), var(--accent));   color: var(--accent-dark);   border: none;   border-radius: 10px;   padding: 10px 14px;   cursor: pointer;   font-weight: 700; }  .error {   color: var(--accent-strong);   margin: 0; }  .helper {   margin: 0;   color: var(--text-muted);   font-size: 13px; }  .helper .link {   cursor: pointer;   color: var(--accent);   font-weight: 600; } </style>

