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

const goDm = (id) => {
  router.push(`/dm/${id}`);
};

const goProfile = () => router.push("/profile");

const fullAvatar = (url) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `http://localhost:3001${url}`;
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
  background: #0b0b0b;
  color: #f6f0d5;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}

.servers {
  background: #0f0f0f;
  border-right: 1px solid #1b0b0b;
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
  background: linear-gradient(145deg, #c31432, #f7c948);
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
  background: #1a0d0d;
  display: grid;
  place-items: center;
  color: #f7c948;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.server-pill:hover {
  background: #2b1313;
  transform: translateY(-2px);
}

.server-pill.add {
  background: #1f1f1f;
  color: #f7c948;
  border: 1px dashed #3d1a1a;
}

.dm-list {
  background: #0e0e0e;
  border-right: 1px solid #1b0b0b;
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
  border-bottom: 1px solid #1b0b0b;
}

.dm-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid #1a0d0d;
  transition: background 0.12s ease;
}

.dm-row:hover {
  background: #191313;
}

.dm-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #221111;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #f7c948;
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
  color: #c7bfa4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  background: #c31432;
  color: #fff7d6;
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
  background: #121212;
  border: 1px solid #1b0b0b;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
}

.panel-title {
  font-weight: 700;
  margin-bottom: 12px;
}

.link-text {
  color: #f7c948;
  font-weight: 600;
  font-size: 12px;
}

.link-btn {
  background: linear-gradient(145deg, #c31432, #f7c948);
  color: #1a0d0d;
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
  background: #0d0d0d;
  border: 1px solid #2b1313;
  border-radius: 10px;
  padding: 10px 12px;
  color: #f6f0d5;
}

.add-row button {
  background: linear-gradient(145deg, #c31432, #f7c948);
  color: #1a0d0d;
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
  background: #c31432;
  color: #fdf5d9;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}

.empty {
  color: #c7bfa4;
  font-size: 13px;
  padding: 10px 0;
}

.dm-profile {
  position: sticky;
  bottom: 0;
  background: #0f0f0f;
  border-top: 1px solid #1b0b0b;
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 10px;
  align-items: center;
  cursor: pointer;
}

.activity {
  padding: 20px;
  border-left: 1px solid #1b0b0b;
  overflow-y: auto;
  background: #0f0f0f;
}

.activity-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #1a0d0d;
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
