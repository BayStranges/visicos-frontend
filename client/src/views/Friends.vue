<template>
  <div class="layout">
    <!-- LEFT: Servers (Discord-like) -->
    <aside class="servers">
      <div class="logo">V</div>
      <div class="server-pill add">+</div>
    </aside>

    <!-- MIDDLE: DMs list -->
    <section class="dm-list">
      <div class="dm-header">Mesajlar</div>
      <div
        v-for="dm in dms"
        :key="dm._id"
        class="dm-row"
        @click="goDm(dm._id)"
      >
        <div class="dm-avatar">
          <img v-if="getOtherUser(dm)?.avatar" :src="fullAvatar(getOtherUser(dm)?.avatar)" />
          <span v-else>{{ getOtherUser(dm)?.username?.[0] || "?" }}</span>
        </div>
        <div class="dm-meta">
          <div class="dm-name">{{ getOtherUser(dm)?.username || "Kullanıcı" }}</div>
          <div class="dm-last">{{ dm.lastMessage?.content || "Henüz mesaj yok" }}</div>
        </div>
        <div v-if="dm.unreadCount > 0" class="badge">{{ dm.unreadCount }}</div>
      </div>
      <div v-if="dms.length === 0" class="empty">DM yok</div>

      <div class="dm-footer">
        <div class="dm-profile" @click="goProfile">
          <div class="dm-avatar">
            <img v-if="userStore.user?.avatar" :src="fullAvatar(userStore.user.avatar)" />
            <span v-else>{{ (userStore.user?.username || "U").slice(0,1).toUpperCase() }}</span>
          </div>
          <div class="dm-meta">
            <div class="dm-name">{{ userStore.user?.username }}</div>
            <div class="dm-last">{{ userStore.user?.email }}</div>
          </div>
          <span class="link-text">Profil</span>
        </div>

        <div class="voice-controls">
          <button
            class="voice-btn"
            :class="{ off: micMuted }"
            @click="toggleMic"
          >
            <svg class="voice-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
              <path d="M5 12a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V21a1 1 0 1 1-2 0v-2.08A7 7 0 0 1 5 12Z" />
            </svg>
          </button>
          <button
            class="voice-btn"
            :class="{ off: headphoneMuted }"
            @click="toggleHeadphones"
          >
            <svg class="voice-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a9 9 0 0 0-9 9v5a3 3 0 0 0 3 3h1v-7H6a1 1 0 0 0-1 1v-2a7 7 0 1 1 14 0v2a1 1 0 0 0-1-1h-1v7h1a3 3 0 0 0 3-3v-5a9 9 0 0 0-9-9Z" />
            </svg>
          </button>
          <button class="voice-btn settings" @click="goProfile">
            <svg class="voice-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.5 3.5a6.7 6.7 0 0 0-.09-1l2.05-1.6-2-3.46-2.5 1a7.8 7.8 0 0 0-1.73-1l-.38-2.7H9.15l-.38 2.7c-.6.22-1.18.56-1.73 1l-2.5-1-2 3.46 2.05 1.6a6.7 6.7 0 0 0 0 2l-2.05 1.6 2 3.46 2.5-1c.55.44 1.13.78 1.73 1l.38 2.7h5.7l.38-2.7c.6-.22 1.18-.56 1.73-1l2.5 1 2-3.46-2.05-1.6c.06-.33.09-.66.09-1Z" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- RIGHT: Friends / add / requests -->
    <section class="friends">
      <div class="panel">
        <div class="panel-title">Arkadaş Ekle</div>
        <div class="add-row">
          <input v-model="username" placeholder="Kullanıcı adı" />
          <button @click="sendRequest">Gönder</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Bekleyen İstekler</div>
        <div v-if="requests.length === 0" class="empty">İstek yok</div>
        <div v-for="req in requests" :key="req._id" class="request-row">
          <span>{{ req.sender.username }}</span>
          <button @click="accept(req._id)">Kabul Et</button>
        </div>
      </div>
    </section>

    <!-- FAR RIGHT: Activity -->
    <section class="activity">
      <div class="panel">
        <div class="panel-title">Şimdi Aktif</div>
        <div v-if="activeUsers.length === 0" class="empty">Kimse yok</div>
        <div
          v-for="u in activeUsers"
          :key="u._id"
          class="activity-row"
        >
          <div class="dm-avatar sm">
            <img v-if="u.avatar" :src="fullAvatar(u.avatar)" />
            <span v-else>{{ u.username?.[0] || "?" }}</span>
          </div>
          <div class="activity-meta">
            <div class="dm-name">{{ u.username }}</div>
            <div class="dm-last">DM için tıkla</div>
          </div>
          <button class="link-btn" @click="goDm(u.roomId)">Git</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/user";
import socket from "../socket";
import { setGlobalMute, setGlobalDeafen } from "../webrtc/voice";

const router = useRouter();
const userStore = useUserStore();

if (!userStore.user) {
  router.push("/login");
}

const userId = userStore.user?._id;

const username = ref("");
const requests = ref([]);
const dms = ref([]);
const onlineUsers = ref([]);
const micMuted = ref(false);
const headphoneMuted = ref(false);

const loadAudioPrefs = () => {
  micMuted.value = localStorage.getItem("visicos_mic_muted") === "1";
  headphoneMuted.value = localStorage.getItem("visicos_headphone_muted") === "1";
  setGlobalMute(micMuted.value);
  setGlobalDeafen(headphoneMuted.value);
};

const loadRequests = async () => {
  const res = await axios.get(`/api/friends/requests/${userId}`);
  requests.value = res.data;
};

const loadDms = async () => {
  const res = await axios.get(`/api/dm/list/${userId}`);
  dms.value = res.data;
};

const getOtherUser = (dm) => {
  return dm.users.find(u => u._id !== userId);
};

const sendRequest = async () => {
  if (!username.value) return;

  await axios.post("/api/friends/request", {
    senderId: userId,
    username: username.value
  });

  username.value = "";
  loadRequests();
};

const accept = async (requestId) => {
  const res = await axios.post("/api/friends/accept", { requestId });
  await loadDms();
  loadRequests();
  router.push(`/dm/${res.data.dmRoomId}`);
};

const toggleMic = () => {
  micMuted.value = !micMuted.value;
  localStorage.setItem("visicos_mic_muted", micMuted.value ? "1" : "0");
  setGlobalMute(micMuted.value);
};

const toggleHeadphones = () => {
  headphoneMuted.value = !headphoneMuted.value;
  localStorage.setItem("visicos_headphone_muted", headphoneMuted.value ? "1" : "0");
  setGlobalDeafen(headphoneMuted.value);
};

const goDm = (id) => {
  router.push(`/dm/${id}`);
};

const goProfile = () => router.push("/profile");

const fullAvatar = (url) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://visicos-backend.onrender.com${url}`;
};

const activeUsers = computed(() => {
  const list = [];
  onlineUsers.value.forEach((id) => {
    const room = dms.value.find(dm => dm.users.some(u => u._id === id));
    const user = room?.users.find(u => u._id === id);
    if (room && user && id !== userId) {
      list.push({ ...user, roomId: room._id });
    }
  });
  return list;
});

onMounted(() => {
  if (!userStore.user) {
    router.push("/login");
    return;
  }

  loadAudioPrefs();

  loadRequests();
  loadDms();

  socket.on("new-message", () => {
    loadDms(); // yeni mesaj -> liste guncelle
  });

  socket.on("messages-read", () => {
    loadDms(); // DM acildi -> unread sifirla
  });

  socket.on("online-users", (users) => {
    onlineUsers.value = users;
  });
});

onBeforeUnmount(() => {
  socket.off("new-message");
  socket.off("messages-read");
  socket.off("online-users");
});
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 80px 260px 1fr 260px;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}

.servers {
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 12px;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 20px;
  color: #fff;
  box-shadow: 0 8px 18px rgba(0,0,0,0.35);
}

.server-pill {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent-dark);
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.server-pill:hover {
  background: var(--border-strong);
  transform: translateY(-2px);
}

.server-pill.add {
  background: #1f1f1f;
  color: var(--accent);
  border: 1px dashed var(--border-soft);
}

.dm-list {
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  padding-bottom: 90px;
}

.dm-header {
  padding: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--border);
}

.dm-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--accent-dark);
  transition: background 0.12s ease;
}

.dm-row:hover {
  background: #191313;
}

.dm-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--chip);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: var(--accent);
  overflow: hidden;
}

.dm-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dm-avatar.sm {
  width: 40px;
  height: 40px;
}

.dm-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dm-name {
  font-weight: 600;
}

.dm-last {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  background: var(--accent-strong);
  color: var(--text-strong);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  min-width: 20px;
  text-align: center;
}

.friends {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  position: relative;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
}

.panel-title {
  font-weight: 700;
  margin-bottom: 12px;
}

.link-text {
  color: var(--accent);
  font-weight: 600;
  font-size: 12px;
}

.link-btn {
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  color: var(--accent-dark);
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
}

.add-row {
  display: flex;
  gap: 10px;
}

.add-row input {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
}

.add-row button {
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  color: var(--accent-dark);
  border: none;
  border-radius: 10px;
  padding: 0 16px;
  cursor: pointer;
  font-weight: 600;
}

.request-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #161b25;
}

.request-row:last-child {
  border-bottom: none;
}

.request-row button {
  background: var(--accent-strong);
  color: #fdf5d9;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}

.empty {
  color: var(--text-muted);
  font-size: 13px;
  padding: 10px 0;
}

.dm-footer {
  position: sticky;
  bottom: 0;
  background: var(--bg-elev);
  border-top: 1px solid var(--border);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dm-profile {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 10px;
  align-items: center;
  cursor: pointer;
}

.voice-controls {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
}

.voice-btn {
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  color: var(--accent-dark);
  border: none;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.voice-btn.off {
  background: var(--input-bg);
  color: var(--text-muted);
  border: 1px solid var(--border-strong);
}

.voice-btn.settings {
  background: var(--bg-elev-2);
  color: var(--text);
  border: 1px solid var(--border-strong);
}

.voice-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  display: inline-block;
}

.activity {
  padding: 20px;
  border-left: 1px solid var(--border);
  overflow-y: auto;
  background: var(--bg-elev);
}

.activity-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--accent-dark);
}

.activity-row:last-child {
  border-bottom: none;
}

.activity-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.activity .link-btn {
  padding: 6px 10px;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 70px 1.1fr 1.3fr;
  }
}
@media (max-width: 700px) {
  .layout {
    grid-template-columns: 70px 1fr;
  }
  .friends {
    grid-column: span 2;
  }
  .dm-list {
    max-height: 40vh;
  }
  .activity {
    display: none;
  }
}
</style>
