<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>Kayit Ol</h2>

      <input v-model="username" placeholder="Kullanici adi" />
      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Sifre" />

      <button @click="register">Kayit Ol</button>

      <p v-if="error" class="error">{{ error }}</p>

      <p class="helper">
Zaten hesabin var mi?
<span @click="router.push('/')" class="link">
Giris yap
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

    // kayıt oldu → otomatik login
    userStore.setUser(res.data);

    socket.connect();
    socket.emit("user-online", res.data._id);

    router.push("/friends");

  } catch (err) {
    console.error(err);
    error.value = "Kayıt başarısız (email veya kullanıcı adı kullanılıyor olabilir)";
  }
};
</script>
<style scoped> .auth-page {   min-height: 100vh;   display: grid;   place-items: center;   padding: 40px 16px;   background: var(--bg);   color: var(--text); }  .auth-card {   width: min(420px, 92vw);   background: var(--bg-elev);   border: 1px solid var(--border);   border-radius: 16px;   padding: 22px;   box-shadow: 0 18px 30px rgba(0,0,0,0.4);   display: grid;   gap: 12px; }  h2 {   margin: 0 0 6px 0;   color: var(--accent);   font-weight: 700; }  input {   background: var(--input-bg);   border: 1px solid var(--border-strong);   border-radius: 10px;   padding: 10px 12px;   color: var(--text); }  button {   background: linear-gradient(145deg, var(--accent-strong), var(--accent));   color: var(--accent-dark);   border: none;   border-radius: 10px;   padding: 10px 14px;   cursor: pointer;   font-weight: 700; }  .error {   color: var(--accent-strong);   margin: 0; }  .helper {   margin: 0;   color: var(--text-muted);   font-size: 13px; }  .helper .link {   cursor: pointer;   color: var(--accent);   font-weight: 600; } </style>

