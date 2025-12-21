<template>
  <div class="dm-wrapper" :class="darkMode">

    <!-- HEADER -->
    <div class="dm-header">
      <div class="profile-head">
        <div class="ph-avatar">
          <img v-if="otherUserAvatar" :src="fullAvatar(otherUserAvatar)" />
          <span v-else>{{ otherUser?.[0]?.toUpperCase() || "?" }}</span>
        </div>
        <div class="ph-meta">
          <div class="ph-name">{{ otherUser }}</div>
          <div class="status" :class="isOnline ? 'online' : 'offline'">
            {{ typingUser ? 'yazıyor...' : isOnline ? 'online' : 'offline' }}
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="theme-btn" @click="toggleTheme">🌓</button>
        <button class="call-btn" @click="startCall" :disabled="inCall">🔊 Sesli Ara</button>
        <button class="call-btn danger" @click="hangUp" v-if="inCall">📴</button>
        <button class="call-btn" @click="toggleMute" v-if="inCall">
          {{ muted ? "🎤" : "🔇" }}
        </button>
      </div>
    </div>

    <!-- CALL BAR -->
    <div v-if="inCall || ringing || callStatus !== 'hazır'" class="call-bar">
      <div class="call-left">
        <div class="call-avatar">
          <img v-if="otherUserAvatar" :src="fullAvatar(otherUserAvatar)" />
          <span v-else>{{ otherUser?.[0]?.toUpperCase() || "?" }}</span>
        </div>
        <div class="call-meta">
          <div class="call-title">{{ otherUser }} ile arama</div>
          <div class="call-sub">
            <span class="call-dot" :class="callStatusClass"></span>
            <span class="call-text">{{ callStatusLabel }}</span>
          </div>
        </div>
      </div>
      <div class="call-controls" v-if="ringing">
        <button class="call-btn ok" @click="acceptCall">Kabul Et</button>
        <button class="call-btn danger" @click="rejectCall">Reddet</button>
      </div>
      <div class="call-controls" v-else>
        <button class="call-icon" @click="toggleMute" :title="muted ? 'Mikrofonu aç' : 'Mikrofonu kapat'">
          {{ muted ? "🎤" : "🔇" }}
        </button>
        <button class="call-icon end" @click="hangUp" title="Aramayı bitir">📴</button>
        <button
          class="call-btn"
          v-if="callStatus === 'koptu' || callStatus === 'başarısız'"
          @click="reconnect"
        >
          Yeniden Bağlan
        </button>
      </div>
    </div>

    <!-- CONTEXT MENU -->
    <div
  v-if="contextMenu.visible"
  class="context-menu"
  :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
>
  <div class="cm-reactions">
    <span @click="react(contextMenu.msg._id, '👍')">👍</span>
    <span @click="react(contextMenu.msg._id, '❤️')">❤️</span>
    <span @click="react(contextMenu.msg._id, '😄')">😄</span>
    <span @click="react(contextMenu.msg._id, '🔥')">🔥</span>
  </div>

  <!-- REPLY -->
  <div @click="setReply(contextMenu.msg); closeMenu()">
    💬 Yanıtla
  </div>

  <div
    v-if="contextMenu.msg.sender._id === userId"
    @click="startEdit(contextMenu.msg); closeMenu()"
  >
    ✏️ Düzenle
  </div>

  <div
    v-if="contextMenu.msg.sender._id === userId"
    @click="deleteMessage(contextMenu.msg._id); closeMenu()"
  >
    🗑️ Sil
  </div>
</div>


    <!-- MESSAGES -->
    <div class="dm-messages" ref="list">
      <button
        v-if="hasNewMessage"
        class="new-message-btn"
        @click="scrollToBottom"
      >
        ⬇ Yeni mesaj
      </button>

      <div
  v-for="msg in messages.filter(m => !m.deleted)"
  :key="msg._id"
  class="message"
  :data-msg-id="msg._id"
  :class="{ mine: msg.sender._id === userId }"
  @contextmenu.prevent="openMenu($event, msg)"
  @touchstart="onTouchStart"
  @touchend="(e) => onTouchEndReply(e, msg)"
>

        <div class="msg-avatar" :class="{ mine: msg.sender._id === userId }">
          <img v-if="msg.sender.avatar" :src="fullAvatar(msg.sender.avatar)" />
          <span v-else>{{ msg.sender.username?.[0] || "?" }}</span>
        </div>

        <div class="bubble">
          <div class="sender">{{ msg.sender.username }}</div>

          <div class="content">

            <!-- REPLY -->
            <div
              v-if="msg.replyTo"
              class="reply-bubble"
              @mouseenter="highlightMessage(msg.replyTo._id)"
  @mouseleave="clearHighlight(msg.replyTo._id)"
              @click="scrollToMessage(msg.replyTo._id)"
            >
              <b>{{ msg.replyTo.username }}</b>
              <span>{{ msg.replyTo.content }}</span>
            </div>

            <!-- IMAGE -->
            <img
              v-if="isImage(msg.content)"
              :src="extractImageUrl(msg.content)"
              class="image-preview"
              @click="openImage(extractImageUrl(msg.content))"
            />

            <!-- FILE -->
            <div
              v-else-if="isFile(msg.content)"
              class="file-card"
              @click="openFile(msg.content)"
            >
              <div class="file-icon">{{ fileIcon(msg.content) }}</div>
              <div class="file-info">
                <div class="file-name">{{ extractFileName(msg.content) }}</div>
                <div class="file-sub">Dosyayı aç</div>
              </div>
            </div>

            <!-- TEXT -->
            <span v-else>{{ msg.content }}</span>
          </div>

          <div class="meta">
            <span class="time">{{ formatTime(msg.createdAt) }}</span>
            <span v-if="msg.sender._id === userId" class="read">
              {{ (msg.readBy?.length || 0) > 1 ? "✓✓" : "✓" }}
            </span>
            <span v-if="msg.edited" class="edited">(düzenlendi)</span>
          </div>

          <div v-if="msg.reactions?.length" class="reactions">
            <span
              v-for="(r, i) in summarizeReactions(msg.reactions)"
              :key="i"
            >
              {{ r.emoji }} {{ r.count }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- TYPING -->
    <div v-if="typingUser" class="typing">
      {{ typingUser }} yazıyor...
    </div>

    <!-- REPLY PREVIEW -->
    <div v-if="replyTo" class="reply-preview">
      <div class="reply-left">
        <b>{{ replyTo.username }}</b>
        <span>{{ replyTo.content.slice(0, 60) }}</span>
      </div>
      <span class="reply-close" @click="replyTo = null">✖</span>
    </div>

    <!-- INPUT -->
    <div class="dm-input">
      <input
        v-model="text"
        placeholder="Mesaj yaz..."
        @input="handleTyping"
        @keyup.enter="submit"
      />

      <span class="emoji" @click="text += '😄'">🙂</span>

      <label class="file">
        📎
        <input type="file" hidden @change="uploadFile" />
      </label>

      <button @click="submit">
        {{ editingId ? "✓" : "➤" }}
      </button>
    </div>

    <!-- LIGHTBOX -->
    <div v-if="lightbox.open" class="lightbox" @click.self="closeLightbox">
      <img :src="lightbox.src" />
      <span class="close" @click="closeLightbox">✖</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import socket from "../socket";
import { useUserStore } from "../store/user";
import { initVoice, getPC, closeVoice } from "../webrtc/voice";

const logVoice = (...args) => {
  console.log("[dm-voice]", ...args);
};

/* ================= STATE ================= */
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const userId = userStore.user?._id;
const roomId = route.params.id;

const messages = ref([]);
const text = ref("");
const typingUser = ref("");
const otherUser = ref("DM");
const list = ref(null);
const isAtBottom = ref(true);
const hasNewMessage = ref(false);
const otherUserId = ref(null);
const replyTo = ref(null);
const editingId = ref(null);

/* ================= TOUCH ================= */
const touchStartTime = ref(0);
const onTouchStart = () => {
  touchStartTime.value = Date.now();
};
const onTouchEndReply = (_e, msg) => {
  if (Date.now() - touchStartTime.value > 600) {
    setReply(msg);
  }
};

/* ================= VOICE CALL ================= */
const inCall = ref(false);
const muted = ref(false);
const isCaller = ref(false);
const callStatus = ref("hazır");
const ringing = ref(false);
const incomingFrom = ref("");
const callAccepted = ref(false);
const pendingOffer = ref(null);
const pendingRemoteCandidates = ref([]);

const startCall = async () => {
  logVoice("startCall click", { roomId, userId });
  isCaller.value = true;
  inCall.value = false;
  callStatus.value = "aranıyor";

  await initVoice(roomId, {
    onStateChange: (s) => handlePcState(s),
    onRemoteTrack: () => handlePcState("connected")
  });

  logVoice("start-call emit");
  socket.emit("start-call", {
    roomId,
    from: userStore.user?.username || "Arayan"
  });

  await createOffer();
};

const hangUp = () => {
  logVoice("hangUp");
  closeVoice();
  inCall.value = false;
  muted.value = false;
  callStatus.value = "hazır";
  isCaller.value = false;
  ringing.value = false;
  callAccepted.value = false;
  pendingOffer.value = null;
  pendingRemoteCandidates.value = [];
  logVoice("call-ended emit");
  socket.emit("call-ended", roomId);
};

const toggleMute = () => {
  const pc = getPC();
  if (!pc) {
    logVoice("toggleMute ignored: no pc");
    return;
  }

  const willMute = !muted.value;
  pc.getSenders().forEach((sender) => {
    if (sender.track?.kind === "audio") {
      sender.track.enabled = !willMute;
    }
  });
  muted.value = willMute;
  logVoice("toggleMute", { muted: muted.value });
};

const handlePcState = (state) => {
  logVoice("pc state", state);
  if (["new", "connecting", "checking"].includes(state)) callStatus.value = "bağlanıyor";
  else if (state === "connected" || state === "completed") callStatus.value = "bağlı";
  else if (state === "disconnected") callStatus.value = "koptu";
  else if (state === "failed") callStatus.value = "başarısız";
  else if (state === "closed") callStatus.value = "hazır";
};

const reconnect = async () => {
  logVoice("reconnect");
  hangUp();
  await nextTick();
  startCall();
};

const createOffer = async () => {
  logVoice("createOffer start");
  callStatus.value = "bağlanıyor";
  inCall.value = true;

  const pc = await initVoice(roomId, {
    onStateChange: (s) => handlePcState(s),
    onRemoteTrack: () => handlePcState("connected")
  });
  if (!pc) {
    logVoice("createOffer failed: no pc");
    return;
  }

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  logVoice("webrtc-offer emit");
  socket.emit("webrtc-offer", { roomId, offer });
};

const handleIncomingOffer = async (offer) => {
  logVoice("handleIncomingOffer", { hasOffer: !!offer });
  callAccepted.value = true;
  inCall.value = true;
  callStatus.value = "bağlanıyor";

  const pc = await initVoice(roomId, {
    onStateChange: (s) => handlePcState(s),
    onRemoteTrack: () => handlePcState("connected")
  });
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  logVoice("remote description set (offer)");

  for (const c of pendingRemoteCandidates.value) {
    await pc.addIceCandidate(c);
  }
  logVoice("drained pending candidates", pendingRemoteCandidates.value.length);
  pendingRemoteCandidates.value = [];

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  logVoice("webrtc-answer emit");
  socket.emit("webrtc-answer", { roomId, answer });
};

const acceptCall = async () => {
  logVoice("acceptCall");
  ringing.value = false;
  callAccepted.value = true;
  callStatus.value = "bağlanıyor";

  logVoice("call-accepted emit");
  socket.emit("call-accepted", { roomId });

  await initVoice(roomId, {
    onStateChange: (s) => handlePcState(s),
    onRemoteTrack: () => handlePcState("connected")
  });

  if (pendingOffer.value) {
    const offer = pendingOffer.value;
    pendingOffer.value = null;
    await handleIncomingOffer(offer);
  }
};

const rejectCall = () => {
  logVoice("rejectCall");
  ringing.value = false;
  inCall.value = false;
  callStatus.value = "hazır";
  callAccepted.value = false;
  pendingOffer.value = null;
  pendingRemoteCandidates.value = [];
  logVoice("call-rejected emit");
  socket.emit("call-rejected", { roomId });
};

/* ================= CONTEXT MENU ================= */
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  msg: null
});

const openMenu = (e, msg) => {
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    msg
  };
};

const closeMenu = () => {
  contextMenu.value.visible = false;
};

/* ================= SCROLL ================= */
const onScroll = () => {
  if (!list.value) return;
  const { scrollTop, scrollHeight, clientHeight } = list.value;

  isAtBottom.value = scrollHeight - (scrollTop + clientHeight) < 5;
  if (isAtBottom.value) hasNewMessage.value = false;
};

const scrollToBottom = async () => {
  await nextTick();
  if (!list.value) return;
  list.value.scrollTop = list.value.scrollHeight;
  hasNewMessage.value = false;
};

const scrollBottomIfNeeded = async () => {
  await nextTick();
  if (!list.value) return;

  if (isAtBottom.value) {
    list.value.scrollTop = list.value.scrollHeight;
  } else {
    hasNewMessage.value = true;
  }
};

/* ================= HELPERS ================= */
const formatTime = (t) =>
  new Date(t).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

const otherUserAvatar = ref("");

const computeOtherUser = () => {
  const other = messages.value.find(m => m?.sender?._id && m.sender._id !== userId);
  if (other) {
    otherUser.value = other.sender.username;
    otherUserId.value = other.sender._id;
    otherUserAvatar.value = other.sender.avatar || "";
  }
};

const setReply = (msg) => {
  if (!msg) return;
  replyTo.value = {
    _id: msg._id,
    username: msg.sender.username,
    content: msg.content
  };
};

const startEdit = (msg) => {
  editingId.value = msg._id;
  text.value = msg.content;
};

const confirmEdit = () => {
  socket.emit("edit-message", {
    messageId: editingId.value,
    userId,
    content: text.value
  });
  editingId.value = null;
  text.value = "";
};

const deleteMessage = (id) => {
  socket.emit("delete-message", { messageId: id, userId });
};

const react = (id, emoji) => {
  socket.emit("react-message", { messageId: id, userId, emoji });
};

const summarizeReactions = (reactions = []) => {
  const map = {};
  reactions.forEach(r => (map[r.emoji] = (map[r.emoji] || 0) + 1));
  return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
};

const scrollToMessage = async (id) => {
  await nextTick();
  const el = document.querySelector(`[data-msg-id="${id}"]`);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("pulse");
  setTimeout(() => el.classList.remove("pulse"), 1200);
};

const highlightMessage = (id) => {
  const el = document.querySelector(`[data-msg-id="${id}"]`);
  if (el) el.classList.add("hover-highlight");
};
const clearHighlight = (id) => {
  const el = document.querySelector(`[data-msg-id="${id}"]`);
  if (el) el.classList.remove("hover-highlight");
};

/* ================= FILE/IMG ================= */
const isImage = (content = "") =>
  /\/uploads\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(content);

const isFile = (content = "") => content.includes("/uploads/");

const fileIcon = (url) => {
  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "???";
  if (url.match(/\.pdf$/i)) return "??";
  if (url.match(/\.(zip|rar)$/i)) return "???";
  return "??";
};

const extractFileName = (content = "") => {
  const match = content.split("/uploads/")[1];
  return match ? decodeURIComponent(match) : "Dosya";
};

const extractImageUrl = (content = "") => {
  const match = content.match(/(\/uploads\/\S+)/);
  return match ? `https://visicos-backend.onrender.com${match[1]}` : "";
};

const openFile = (content) => window.open(extractImageUrl(content), "_blank");

const lightbox = ref({ open: false, src: null });

const openImage = (url) => {
  lightbox.value.open = true;
  lightbox.value.src = url;
};
const closeLightbox = () => {
  lightbox.value.open = false;
  lightbox.value.src = null;
};

const fullAvatar = (url = "") => {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://visicos-backend.onrender.com${url}`;
};

/* ================= API ================= */
const loadMessages = async () => {
  const res = await axios.get(`/api/dm/${roomId}/${userId}`);
  messages.value = res.data || [];
  computeOtherUser();

  await nextTick();
  if (list.value) list.value.scrollTop = list.value.scrollHeight;

  isAtBottom.value = true;
  hasNewMessage.value = false;
};

/* ================= SEND ================= */
const submit = () => {
  if (!text.value.trim()) return;
  editingId.value ? confirmEdit() : send();
};

const send = () => {
  socket.emit("send-message", {
    roomId,
    senderId: userId,
    content: text.value,
    replyTo: replyTo.value
  });
  text.value = "";
  replyTo.value = null;
};

const uploadFile = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const form = new FormData();
  form.append("file", file);

  const res = await axios.post("/api/upload", form);

  socket.emit("send-message", {
    roomId,
    senderId: userId,
    content: `${res.data.url}`
  });

  e.target.value = "";
};

/* ================= THEME ================= */
const darkMode = ref(localStorage.getItem("dm-theme") || "dark");

const toggleTheme = () => {
  darkMode.value = darkMode.value === "dark" ? "darker" : "dark";
  localStorage.setItem("dm-theme", darkMode.value);
};

/* ================= TYPING ================= */
let typingTimeout;
const handleTyping = () => {
  socket.emit("typing", { roomId, username: userStore.user.username });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("stop-typing", roomId);
  }, 700);
};

/* ================= ONLINE ================= */
const isOnline = ref(false);
socket.on("online-users", (users) => {
  if (!otherUserId.value) return;
  isOnline.value = users.includes(otherUserId.value);
});

const callStatusLabel = computed(() => {
  if (callStatus.value === "bağlı") return "Arama bağlandı";
  if (callStatus.value === "bağlanıyor") return "Bağlanıyor...";
  if (callStatus.value === "aranıyor") return `${incomingFrom.value || "Arayan"} arıyor`;
  if (callStatus.value === "koptu") return "Bağlantı koptu";
  if (callStatus.value === "başarısız") return "Bağlantı başarısız";
  if (callStatus.value === "reddedildi") return "Arama reddedildi";
  return "Arama hazır";
});

const callStatusClass = computed(() => {
  if (callStatus.value === "bağlı") return "ok";
  if (callStatus.value === "bağlanıyor") return "warn";
  if (callStatus.value === "aranıyor") return "warn";
  if (callStatus.value === "koptu" || callStatus.value === "başarısız" || callStatus.value === "reddedildi") return "bad";
  return "idle";
});

/* ================= MOUNT ================= */
onMounted(async () => {
  if (!userId) {
    router.push("/login");
    return;
  }

  if (!socket.connected) socket.connect();

  window.addEventListener("click", closeMenu);

  socket.emit("join-dm", { roomId, userId });
  await loadMessages();

  await nextTick();
  if (list.value) list.value.addEventListener("scroll", onScroll);

  // WebRTC
  socket.on("webrtc-offer", async ({ offer }) => {
    logVoice("webrtc-offer recv", { hasOffer: !!offer, accepted: callAccepted.value });
    isCaller.value = false;
    if (!callAccepted.value) {
      pendingOffer.value = offer;
      logVoice("offer queued");
      callStatus.value = "aranıyor";
      return;
    }
    await handleIncomingOffer(offer);
  });

  socket.on("webrtc-answer", async ({ answer }) => {
    logVoice("webrtc-answer recv", { hasAnswer: !!answer });
    const pc = getPC();
    if (!pc) {
      logVoice("webrtc-answer ignored: no pc");
      return;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    logVoice("remote description set (answer)");
    handlePcState(pc.connectionState || "connected");

    for (const c of pendingRemoteCandidates.value) {
      await pc.addIceCandidate(c);
    }
    logVoice("drained pending candidates", pendingRemoteCandidates.value.length);
    pendingRemoteCandidates.value = [];
  });

  socket.on("webrtc-ice", async ({ candidate }) => {
    logVoice("webrtc-ice recv", { hasCandidate: !!candidate });
    const pc = getPC();
    if (pc && candidate && pc.remoteDescription) {
      await pc.addIceCandidate(candidate);
      logVoice("ice candidate added");
    } else if (candidate) {
      pendingRemoteCandidates.value.push(candidate);
      logVoice("ice candidate queued", pendingRemoteCandidates.value.length);
    }
  });

  socket.on("call-ended", () => {
    logVoice("call-ended recv");
    hangUp();
  });

  socket.on("incoming-call", ({ from }) => {
    logVoice("incoming-call recv", { from });
    ringing.value = true;
    inCall.value = false;
    callStatus.value = "aranıyor";
    incomingFrom.value = from;
    callAccepted.value = false;
  });

  socket.on("call-rejected", () => {
    logVoice("call-rejected recv");
    callStatus.value = "reddedildi";
    inCall.value = false;
    ringing.value = false;
    callAccepted.value = false;
    pendingOffer.value = null;
    pendingCandidates.value = [];
  });

  socket.on("call-accepted", async () => {
    logVoice("call-accepted recv", { isCaller: isCaller.value });
    if (isCaller.value) {
      await createOffer();
    }
  });

  // Messages
  socket.on("receive-message", (msg) => {
    messages.value.push(msg);
    computeOtherUser();
    scrollBottomIfNeeded();
  });

  socket.on("typing", (u) => (typingUser.value = u));
  socket.on("stop-typing", () => (typingUser.value = ""));

  socket.on("message-deleted", (msg) => {
    messages.value = messages.value.filter((m) => m._id !== msg._id);

    messages.value.forEach((m) => {
      if (m.replyTo?._id === msg._id) m.replyTo = null;
    });

    if (replyTo.value?._id === msg._id) replyTo.value = null;
  });

  socket.on("message-edited", (msg) => {
    const i = messages.value.findIndex((m) => m._id === msg._id);
    if (i >= 0) messages.value[i] = msg;
  });

  socket.on("message-reacted", ({ messageId, reactions }) => {
    const i = messages.value.findIndex((m) => m._id === messageId);
    if (i >= 0) messages.value[i].reactions = reactions;
  });
});

onBeforeUnmount(() => {
  closeVoice();

  socket.off("receive-message");
  socket.off("typing");
  socket.off("stop-typing");
  socket.off("message-deleted");
  socket.off("message-edited");
  socket.off("message-reacted");
  socket.off("webrtc-offer");
  socket.off("webrtc-answer");
  socket.off("webrtc-ice");
  socket.off("call-ended");
  socket.off("online-users");

  window.removeEventListener("click", closeMenu);
  if (list.value) list.value.removeEventListener("scroll", onScroll);
});
</script>


<style scoped>
  .dm-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}

/* HEADER */
.dm-header {
  padding: 16px;
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ph-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--chip);
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 800;
  overflow: hidden;
  flex-shrink: 0;
}

.ph-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ph-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ph-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.call-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
}

.call-left {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  font-weight: 600;
}

.call-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--chip);
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 800;
  overflow: hidden;
}

.call-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.call-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.call-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
}

.call-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.call-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #555;
  box-shadow: 0 0 8px rgba(0,0,0,0.4);
}
.call-dot.ok { background: #2ecc71; }
.call-dot.warn { background: var(--accent); }
.call-dot.bad { background: var(--accent-strong); }
.call-dot.idle { background: #555; }

.call-text {
  font-size: 12px;
}

.call-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.call-btn.ok {
  background: #2ecc71;
  color: var(--input-bg);
}

.call-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border-soft);
  background: var(--accent-dark);
  color: var(--accent);
  cursor: pointer;
}

.call-icon.end {
  border-color: var(--accent-strong);
  color: var(--text-strong);
  background: var(--border-strong);
}

.theme-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 18px;
  cursor: pointer;
}

.call-btn{
  background: var(--accent-dark);
  border: 1px solid var(--border-soft);
  color: var(--accent);
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  margin-left: 8px;
}
.call-btn.danger{
  border-color:var(--accent-strong);
  color:var(--accent-strong);
}

/* MESSAGES */
.dm-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  position: relative;
}

.message {
  display: flex;
  width: 100%;
  margin-bottom: 14px;
  gap: 10px;
  align-items: flex-start;
}

.message.mine {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--chip);
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  margin-top: 4px;
}

.msg-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bubble {
  background: var(--bg-elev-2);
  padding: 16px 20px;
  border-radius: 14px;
  max-width: 40%;
  flex: 0 1 70%;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid var(--border);
  box-shadow: 0 10px 20px rgba(0,0,0,0.25);
}

.message.mine .bubble {
  background: linear-gradient(145deg, var(--border-strong), #3a0f0f);
  border: 1px solid var(--accent-strong);
  margin-left: auto;
}

.sender {
  font-size: 12px;
  color: var(--accent);
  margin-bottom: 6px;
}

.content {
  font-size: 15px;
  line-height: 1.6;
}

/* META */
.meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
  align-items: center;
}

.read {
  color: #9be7a1;
}
.edit:hover,
.delete:hover {
  opacity: 1;
}

/* REACTIONS */
.reactions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.reactions span {
  cursor: pointer;
}

.rx {
  color: var(--text-muted);
  font-size: 12px;
}

/* TYPING */
.typing {
  padding: 6px 20px;
  font-size: 12px;
  color: var(--text-muted);
}

/* INPUT */
.dm-input {
  display: flex;
  gap: 10px;
  padding: 14px;
  background: var(--bg-elev);
  border-top: 1px solid var(--border);
}

.dm-input input {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--border-strong);
  padding: 12px;
  color: var(--text);
  border-radius: 10px;
}

.dm-input button {
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  border: none;
  padding: 0 18px;
  color: var(--accent-dark);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.dm-input button:hover {
  filter: brightness(1.05);
}

.file,
.emoji {
  cursor: pointer;
  font-size: 20px;
  user-select: none;
  display: flex;
  align-items: center;
}

/* IMAGE PREVIEW */
.image-preview {
  max-width: 260px;
  max-height: 260px;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 6px;
  border: 1px solid var(--border-strong);
  transition: transform 0.15s ease;
}

.image-preview:hover {
  transform: scale(1.03);
}
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.lightbox img {
  max-width: 90%;
  max-height: 90%;
  border-radius: 12px;
}

.lightbox .close {
  position: absolute;
  top: 20px;
  right: 30px;
  font-size: 28px;
  color: white;
  cursor: pointer;
}
.edited {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
}
.file-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
}
.file-link:hover {
  text-decoration: underline;
}
.dm-wrapper.dark {
  background: var(--bg);
}

.dm-wrapper.darker {
  background: #0a0a0a;
}

.context-menu {
  position: fixed;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px 0;
  z-index: 9999;
  min-width: 160px;
  box-shadow: 0 10px 30px rgba(0,0,0,.5);
}

.context-menu div {
  padding: 8px 14px;
  cursor: pointer;
  font-size: 14px;
}

.context-menu div:hover {
  background: var(--border-strong);
  color: var(--accent);
}
.file-card {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #101010;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.file-card:hover {
  background: #171010;
  border-color: var(--accent-strong);
}

.file-icon {
  font-size: 26px;
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 14px;
  color: var(--accent);
  word-break: break-all;
}

.file-sub {
  font-size: 11px;
  color: var(--text-muted);
}
.cm-reactions {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
}

.cm-reactions span {
  cursor: pointer;
  font-size: 18px;
}

.cm-reactions span:hover {
  transform: scale(1.2);
}
.new-message-btn {
  position: absolute;
  bottom: 90px;
  right: 20px;
  background: var(--accent-strong);
  color: var(--text-strong);
  border: none;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
  animation: bounce 1.2s infinite;
}

@keyframes bounce {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.new-message-btn {
  animation: bounce 1.2s infinite, pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(195,20,50,.55); }
  70% { box-shadow: 0 0 0 10px rgba(195,20,50,0); }
  100% { box-shadow: 0 0 0 0 rgba(195,20,50,0); }
}
.status {
  font-size: 12px;
  margin-left: 8px;
}
.online { color: #9be7a1; }
.offline { color: #8c7f7f; }

.reply-preview {
  background: var(--bg-elev);
  border-left: 4px solid var(--accent-strong);
  padding: 8px 12px;
  margin: 0 14px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reply-left {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.reply-left span {
  color: var(--text-muted);
}

.reply-close {
  cursor: pointer;
  color: var(--text-muted);
}

.reply-bubble {
  background: #101010;
  border-left: 3px solid var(--accent-strong);
  padding: 6px 10px;
  margin-bottom: 6px;
  font-size: 12px;
  border-radius: 6px;
}

.reply-bubble {
  cursor: pointer;
  transition: background .15s ease;
}

.reply-bubble:hover {
  background: #171010;
}
@keyframes pulseHighlight {
  0% {
    box-shadow: 0 0 0 0 rgba(195,20,50,.6);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(195,20,50,0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(195,20,50,0);
  }
}

.message.pulse .bubble {
  animation: pulseHighlight 1.2s ease-out;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.message.hover-highlight .bubble {
  box-shadow: 0 0 0 2px var(--accent-strong);
  background: var(--border-strong);
  transition: all .15s ease;
}

.call-popup{
  position:fixed;
  bottom:110px;
  left:50%;
  transform:translateX(-50%);
  background:var(--bg-elev);
  border:1px solid var(--border);
  padding:14px 16px;
  border-radius:14px;
  box-shadow:0 10px 30px rgba(0,0,0,.5);
  z-index:99999;
  min-width:260px;
}
.call-title{
  color:var(--text);
  margin-bottom:10px;
}
.call-actions{
  display:flex;
  gap:10px;
  justify-content:flex-end;
}
.call-actions .ok{
  background:#1f8b4c;
  border:none;
  color:#fff;
  padding:8px 12px;
  border-radius:10px;
  cursor:pointer;
}
.call-actions .no{
  background:var(--accent-strong);
  border:none;
  color:var(--text-strong);
  padding:8px 12px;
  border-radius:10px;
  cursor:pointer;
}

</style>
