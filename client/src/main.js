import { createApp } from "vue";
import axios from "axios";
import App from "./App.vue";
import "./style.css";
import router from "./router";
import socket from "./socket";
import { createPinia } from "pinia";
import { useUserStore } from "./store/user";
import { useDmStore } from "./store/dm";

axios.defaults.baseURL = "https://visicos-backend.onrender.com";

const app = createApp(App);

app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  const userStore = useUserStore();
  const dmStore = useDmStore();

  if (userStore.user?._id) {
    socket.connect();
    socket.emit("user-online", userStore.user._id);

    dmStore.initSocket(userStore.user._id);
    dmStore.loadDms(userStore.user._id);
  }

  app.mount("#app");
});

