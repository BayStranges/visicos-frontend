<template>
  <div style="padding: 40px">
    <h2>Giriş</h2>

    <input v-model="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Şifre" />

    <button @click="login">Giriş Yap</button>
    

    <p v-if="error" style="color:red">{{ error }}</p>
    
    <p>
  Hesabın yok mu?
  <span @click="router.push('/register')" style="cursor:pointer;color:blue">
    Kayıt ol
  </span>
</p>
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
