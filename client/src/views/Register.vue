<template>
  <div style="padding: 40px">
    <h2>Kayıt Ol</h2>

    <input v-model="username" placeholder="Kullanıcı adı" />
    <input v-model="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Şifre" />

    <button @click="register">Kayıt Ol</button>

    <p v-if="error" style="color:red">{{ error }}</p>
    <p>
      Zaten hesabın var mı?
      <span @click="router.push('/')" style="cursor:pointer;color:blue">
        Giriş yap
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
