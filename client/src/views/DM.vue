<template>
  <div class="dm-layout">
    <aside class="servers">
      <div class="logo active" @click="goFriends">
        <img src="/logo.png" alt="Nexora logo" />
      </div>
      <div
        v-for="srv in servers"
        :key="srv._id"
        class="server-pill"
        @click="goServer(srv._id)"
      >
        <img v-if="srv.cover" :src="fullAsset(srv.cover)" />
        <span v-else>{{ (srv.name || "?").slice(0, 1).toUpperCase() }}</span>
      </div>
      <div class="server-pill add" @click="openCreateServer">+</div>
    </aside>

    <div class="dm-wrapper" :class="darkMode">
      <audio ref="ringtoneAudio" src="/zilsesi.mp3" preload="auto" loop></audio>

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
          <div v-if="lastCallLabel" class="call-history">
            Last call: {{ lastCallLabel }}
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="theme-btn" @click="toggleTheme">Tema</button>
        <button class="call-btn" @click="startCall" :disabled="inCall">Sesli Ara</button>
        <button class="call-btn danger" @click="hangUp" v-if="inCall">Bitir</button>
        <button class="call-btn" @click="toggleMute" v-if="inCall">
          {{ muted ? "Unmute" : "Mute" }}
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
        <button class="call-icon" @click="toggleMute" :title="muted ? 'Unmute' : 'Mute'">
          {{ muted ? "Unmute" : "Mute" }}
        </button>
        <button class="call-icon end" @click="hangUp" title="Aramayi bitir">X</button>
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
    <span @click="react(contextMenu.msg._id, ':)')">:)</span>
    <span @click="react(contextMenu.msg._id, '<3')">&lt;3</span>
    <span @click="react(contextMenu.msg._id, 'GG')">GG</span>
    <span @click="react(contextMenu.msg._id, '+1')">+1</span>
  </div>

  <!-- REPLY -->
  <div @click="setReply(contextMenu.msg); closeMenu()">
    Yanitla
  </div>

  <div
    v-if="contextMenu.msg.sender._id === userId"
    @click="startEdit(contextMenu.msg); closeMenu()"
  >
    Duzenle
  </div>

  <div
    v-if="contextMenu.msg.sender._id === userId"
    @click="deleteMessage(contextMenu.msg._id); closeMenu()"
  >
    Sil
  </div>
</div>


    <!-- MESSAGES -->
    <div class="dm-messages" ref="list">
      <button
        v-if="hasNewMessage"
        class="new-message-btn"
        @click="scrollToBottom"
      >
        Yeni mesaj
      </button>

      <div
  v-for="msg in messages.filter(m => !m.deleted)"
  :key="msg._id"
  class="message"
  :data-msg-id="msg._id"
  :class="{ mine: msg.sender._id === userId }"
  @contextmenu.prevent="openMenu($event, msg)"
  @touchstart="(e) => onTouchStart(e, msg)"
  @touchend="onTouchEnd"
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
              {{ (msg.readBy?.length || 0) > 1 ? "Read" : "Sent" }}
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
      <span class="reply-close" @click="replyTo = null">X</span>
    </div>

    <!-- INPUT -->
    <div class="dm-input">
      <div class="input-wrap">
        <input
          ref="inputRef"
          v-model="text"
          placeholder="Mesaj yaz..."
          @input="handleTyping"
          @keydown="onInputKeydown"
        />
        <div v-if="mentionOpen" class="mention-list">
          <button
            v-for="(name, idx) in filteredMentions"
            :key="name"
            class="mention-item"
            :class="{ active: idx === mentionIndex }"
            @mousedown.prevent="applyMention(name)"
          >
            <span class="mention-tag">@</span>
            <span>{{ name }}</span>
          </button>
        </div>
      </div>

      <span class="emoji" @click="text += ':)'">:)</span>

      <label class="file">
        Dosya
        <input type="file" hidden @change="uploadFile" />
      </label>

      <button @click="submit">
        {{ editingId ? "Kaydet" : "Gönder" }}
      </button>
    </div>

    <!-- LIGHTBOX -->
    <div v-if="lightbox.open" class="lightbox" @click.self="closeLightbox">
      <img :src="lightbox.src" />
      <span class="close" @click="closeLightbox">X</span>
    </div>
    <transition name="fade">
      <div v-if="serverModalOpen" class="server-modal" @click="closeCreateServer">
        <div class="server-card" @click.stop>
          <div class="server-card-head">
            <div class="server-title">Sunucu Olustur</div>
            <button class="modal-close" @click="closeCreateServer">X</button>
          </div>
          <div class="server-field">
            <label>Sunucu adi</label>
            <input v-model="serverName" placeholder="Sunucu adi" />
          </div>
          <div class="server-field">
            <label>Kapak</label>
            <input type="file" accept="image/*" @change="onServerCoverChange" />
            <input
              v-model="serverCover"
              placeholder="Kapak URL (opsiyonel)"
              @input="onServerCoverUrlInput"
            />
          </div>
          <div v-if="serverCoverPreview" class="server-cover-preview">
            <img :src="serverCoverPreview" alt="Sunucu kapak" />
          </div>
          <div v-if="serverError" class="server-error">{{ serverError }}</div>
          <div class="server-actions">
            <button class="ghost-btn" @click="closeCreateServer">Iptal</button>
            <button class="primary-btn" :disabled="creatingServer" @click="createServer">
              {{ creatingServer ? "Olusturuluyor..." : "Olustur" }}
            </button>
          </div>
        </div>
      </div>
    </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { ASSET_BASE_URL } from "../config";
import socket from "../socket";
import { useUserStore } from "../store/user";
import { initVoice, getPC, closeVoice } from "../webrtc/voice";
import { tuneOpusSdp } from "../webrtc/opusSdp";
import {
  startSfuCall,
  stopSfuCall,
  startMic,
  enableMic,
  startCamera,
  stopCamera,
  startScreen,
  stopScreen
} from "../webrtc/sfu";

const logVoice = (...args) => {
  console.log("[dm-voice]", ...args);
};

const requestNotifications = () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
};

const notifyMessage = (msg) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return;
  const title = msg?.sender?.username ? `New message from ${msg.sender.username}` : "New message";
  const body = msg?.content ? msg.content.slice(0, 140) : "Open DM to read";
  new Notification(title, { body });
};

/* ================= STATE ================= */
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const goFriends = () => router.push("/friends");
const goServer = (id) => router.push(`/server/${id}`);

const userId = userStore.user?._id;
const roomId = route.params.id;

const historyKey = () => `visicos_call_history_${roomId}`;

const loadCallHistory = () => {
  const raw = localStorage.getItem(historyKey()) || "[]";
  try {
    callHistory.value = JSON.parse(raw);
  } catch (err) {
    callHistory.value = [];
  }
};

const saveCallHistory = () => {
  localStorage.setItem(historyKey(), JSON.stringify(callHistory.value));
};

const addCallEntry = (type, durationSec = 0) => {
  callHistory.value.unshift({
    type,
    at: Date.now(),
    duration: durationSec
  });
  callHistory.value = callHistory.value.slice(0, 5);
  saveCallHistory();
};



const loadServers = async () => {
  if (!userId) return;
  try {
    const res = await axios.get(`/api/servers/list/${userId}`);
    servers.value = res.data || [];
  } catch (err) {
    servers.value = [];
  }
};

const openCreateServer = () => {
  serverError.value = "";
  serverName.value = "";
  serverCover.value = "";
  serverCoverFile.value = null;
  if (coverObjectUrl) {
    URL.revokeObjectURL(coverObjectUrl);
    coverObjectUrl = "";
  }
  serverCoverPreview.value = "";
  serverModalOpen.value = true;
};

const closeCreateServer = () => {
  serverModalOpen.value = false;
  serverError.value = "";
  if (coverObjectUrl) {
    URL.revokeObjectURL(coverObjectUrl);
    coverObjectUrl = "";
  }
};

const onServerCoverChange = (event) => {
  const file = event.target.files?.[0];
  if (coverObjectUrl) {
    URL.revokeObjectURL(coverObjectUrl);
    coverObjectUrl = "";
  }
  if (!file) {
    serverCoverFile.value = null;
    serverCoverPreview.value = fullAsset(serverCover.value.trim());
    return;
  }
  serverCoverFile.value = file;
  coverObjectUrl = URL.createObjectURL(file);
  serverCoverPreview.value = coverObjectUrl;
};

const onServerCoverUrlInput = () => {
  if (!serverCoverFile.value) {
    serverCoverPreview.value = fullAsset(serverCover.value.trim());
  }
};

const createServer = async () => {
  if (!serverName.value.trim()) {
    serverError.value = "Sunucu adi gerekli";
    return;
  }
  if (!userId) {
    serverError.value = "Kullanici bulunamadi";
    return;
  }
  serverError.value = "";
  creatingServer.value = true;
  try {
    let coverUrl = serverCover.value.trim();
    if (serverCoverFile.value) {
      const form = new FormData();
      form.append("file", serverCoverFile.value);
      const uploadRes = await axios.post("/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      coverUrl = uploadRes.data?.url || "";
    }
    const res = await axios.post("/api/servers", {
      name: serverName.value.trim(),
      cover: coverUrl,
      ownerId: userId
    });
    await loadServers();
    closeCreateServer();
    router.push(`/server/${res.data._id}`);
  } catch (err) {
    serverError.value = err?.response?.data?.message || "Sunucu olusturulamadi";
  } finally {
    creatingServer.value = false;
  }
};

const fullAsset = (url = "") => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${ASSET_BASE_URL}${url}`;
};
const messages = ref([]);
const text = ref("");
const inputRef = ref(null);
const ringtoneAudio = ref(null);
const mentionOpen = ref(false);
const mentionQuery = ref("");
const mentionIndex = ref(0);
const mentionStart = ref(0);
const typingUser = ref("");
const otherUser = ref("DM");
const list = ref(null);
const isAtBottom = ref(true);
const hasNewMessage = ref(false);
const otherUserId = ref(null);
const replyTo = ref(null);
const editingId = ref(null);
const callHistory = ref([]);
const callStartAt = ref(0);
const sfuActive = ref(false);
const sfuMuted = ref(false);
const sfuDeafened = ref(false);
const sfuVideoOn = ref(false);
const sfuScreenOn = ref(false);
const voiceParticipants = ref([]);
const participantStreams = new Map();
const remoteAudioEls = new Map();
const speakingTimers = new Map();
const servers = ref([]);
const serverModalOpen = ref(false);
const serverName = ref("");
const serverCover = ref("");
const serverCoverFile = ref(null);
const serverCoverPreview = ref("");
const serverError = ref("");
const creatingServer = ref(false);
let coverObjectUrl = "";

/* ================= TOUCH ================= */
const touchStartTime = ref(0);
const touchTimer = ref(null);
const touchPos = ref({ x: 0, y: 0 });
const touchMsg = ref(null);

const onTouchStart = (event, msg) => {
  touchStartTime.value = Date.now();
  touchMsg.value = msg;
  touchPos.value = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  if (touchTimer.value) clearTimeout(touchTimer.value);
  touchTimer.value = setTimeout(() => {
    if (!touchMsg.value) return;
    openMenu({ clientX: touchPos.value.x, clientY: touchPos.value.y }, touchMsg.value);
    touchTimer.value = null;
  }, 550);
};

const onTouchEnd = () => {
  if (touchTimer.value) {
    clearTimeout(touchTimer.value);
    touchTimer.value = null;
  }
  touchMsg.value = null;
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
const overlayStorageKey = "visicos_voice_overlay";

const startCall = async () => {
  logVoice("startCall click", { roomId, userId });
  isCaller.value = true;
  inCall.value = false;
  callStatus.value = "aranıyor";
  callStartAt.value = Date.now();
  addCallEntry("outgoing");

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
  if (callStartAt.value) {
    const duration = Math.floor((Date.now() - callStartAt.value) / 1000);
    addCallEntry("ended", duration);
  }
  callStartAt.value = 0;
  logVoice("hangUp");
  closeVoice();
  if (ringtoneAudio.value) {
    ringtoneAudio.value.pause();
    ringtoneAudio.value.currentTime = 0;
  }
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

const startGroupCall = async () => {
  if (!userId || sfuActive.value) return;
  sfuActive.value = true;
  sfuMuted.value = false;
  sfuDeafened.value = false;
  sfuVideoOn.value = false;
  sfuScreenOn.value = false;
  voiceParticipants.value = [];

  const selfProfile = await loadUserProfile(userId);
  upsertParticipant({
    userId,
    username: selfProfile?.username || "Sen",
    avatar: selfProfile?.avatar || "",
    speaking: false,
    muted: sfuMuted.value
  });

  await startSfuCall({
    room: roomId,
    user: userId,
    onTrack: async ({ userId: producerUserId, kind, stream }) => {
      let profile = voiceParticipants.value.find((p) => p.userId === producerUserId);
      if (!profile) {
        const fetched = await loadUserProfile(producerUserId);
        profile = {
          userId: producerUserId,
          username: fetched?.username || "Kullanici",
          avatar: fetched?.avatar || ""
        };
        upsertParticipant(profile);
      }

      const entry = participantStreams.get(producerUserId) || {};
      if (kind === "audio") {
        entry.audio = stream;
        attachRemoteAudio(producerUserId, stream);
        startSpeakingMeter(producerUserId, stream);
      } else {
        entry.video = stream;
      }
      participantStreams.set(producerUserId, entry);
    },
    onProducerClosed: (producerId) => {
      // cleanup handled by timers/streams maps on leave
    }
  });

  await startMic({
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1
  });
};

const leaveGroupCall = async () => {
  sfuActive.value = false;
  sfuMuted.value = false;
  sfuDeafened.value = false;
  sfuVideoOn.value = false;
  sfuScreenOn.value = false;

  for (const key of participantStreams.keys()) {
    stopSpeakingMeter(key);
  }
  participantStreams.clear();
  for (const audio of remoteAudioEls.values()) {
    audio.srcObject = null;
    audio.remove();
  }
  remoteAudioEls.clear();
  voiceParticipants.value = [];
  await stopSfuCall();
};

const toggleSfuMute = () => {
  sfuMuted.value = !sfuMuted.value;
  enableMic(!sfuMuted.value);
  upsertParticipant({ userId, muted: sfuMuted.value });
};

const toggleSfuDeafen = () => {
  sfuDeafened.value = !sfuDeafened.value;
  for (const audio of remoteAudioEls.values()) {
    audio.muted = sfuDeafened.value;
  }
};

const toggleSfuCamera = async () => {
  sfuVideoOn.value = !sfuVideoOn.value;
  if (sfuVideoOn.value) await startCamera();
  else await stopCamera();
};

const toggleSfuScreen = async () => {
  sfuScreenOn.value = !sfuScreenOn.value;
  if (sfuScreenOn.value) await startScreen();
  else await stopScreen();
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
  offer.sdp = tuneOpusSdp(offer.sdp);
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
  answer.sdp = tuneOpusSdp(answer.sdp);
  await pc.setLocalDescription(answer);

  logVoice("webrtc-answer emit");
  socket.emit("webrtc-answer", { roomId, answer });
};

const acceptCall = async () => {
  callStartAt.value = Date.now();
  addCallEntry("accepted");
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
  addCallEntry("missed");
  callStartAt.value = 0;
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

const buildOverlayPayload = () => {
  const selfName = userStore.user?.displayName || userStore.user?.username || "Sen";
  const otherName = otherUser.value || "Kullanici";
  const status = ringing.value
    ? "ringing"
    : inCall.value
      ? callAccepted.value
        ? "connected"
        : "connecting"
      : "idle";

  return {
    active: inCall.value || ringing.value,
    status,
    roomId,
    updatedAt: Date.now(),
    self: {
      id: userId,
      name: selfName,
      avatar: userStore.user?.avatar || "",
      muted: muted.value
    },
    other: {
      id: otherUserId.value,
      name: otherName,
      avatar: otherUserAvatar.value || ""
    }
  };
};

const updateOverlayState = () => {
  const payload = buildOverlayPayload();
  localStorage.setItem(overlayStorageKey, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("visicos-overlay-update", { detail: payload }));
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
  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "IMG";
  if (url.match(/\.pdf$/i)) return "PDF";
  if (url.match(/\.(zip|rar)$/i)) return "ZIP";
  return "FILE";
};

const extractFileName = (content = "") => {
  const match = content.split("/uploads/")[1];
  return match ? decodeURIComponent(match) : "Dosya";
};

const extractImageUrl = (content = "") => {
  const match = content.match(/(\/uploads\/\S+)/);
  return match ? `${ASSET_BASE_URL}${match[1]}` : "";
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

const fullAvatar = (url = "") => fullAsset(url);

const upsertParticipant = (payload) => {
  const idx = voiceParticipants.value.findIndex((p) => p.userId === payload.userId);
  if (idx >= 0) {
    voiceParticipants.value[idx] = { ...voiceParticipants.value[idx], ...payload };
  } else {
    voiceParticipants.value.push(payload);
  }
};

const loadUserProfile = async (id) => {
  try {
    const res = await axios.get(`/api/auth/profile/${id}`);
    return res.data;
  } catch (err) {
    return null;
  }
};

const attachRemoteAudio = (userId, stream) => {
  let audio = remoteAudioEls.get(userId);
  if (!audio) {
    audio = document.createElement("audio");
    audio.autoplay = true;
    audio.playsInline = true;
    audio.muted = sfuDeafened.value;
    document.body.appendChild(audio);
    remoteAudioEls.set(userId, audio);
  }
  audio.srcObject = stream;
};

const startSpeakingMeter = (userId, stream) => {
  if (!stream) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const data = new Float32Array(analyser.fftSize);
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    const speaking = rms > 0.02;
    upsertParticipant({ userId, speaking });
  }, 120);
  speakingTimers.set(userId, { timer, ctx });
};

const stopSpeakingMeter = (userId) => {
  const entry = speakingTimers.get(userId);
  if (!entry) return;
  clearInterval(entry.timer);
  entry.ctx.close().catch(() => {});
  speakingTimers.delete(userId);
};

const mentionCandidates = computed(() => {
  const names = [];
  const selfName = userStore.user?.username || "";
  const otherName = otherUser.value || "";
  if (selfName) names.push(selfName);
  if (otherName && otherName !== selfName) names.push(otherName);
  return names;
});

const filteredMentions = computed(() => {
  const query = mentionQuery.value.toLowerCase();
  const options = mentionCandidates.value;
  if (!mentionOpen.value) return [];
  if (!query) return options;
  return options.filter((name) => name.toLowerCase().includes(query));
});

const updateMentionState = () => {
  const el = inputRef.value;
  const value = text.value;
  if (!el) {
    mentionOpen.value = false;
    return;
  }

  const caret = el.selectionStart ?? value.length;
  const prefix = value.slice(0, caret);
  const match = prefix.match(/(^|\\s)@([\\w.-]{0,32})$/);
  if (!match) {
    mentionOpen.value = false;
    mentionQuery.value = "";
    return;
  }

  mentionStart.value = caret - match[2].length - 1;
  mentionQuery.value = match[2];

  const options = mentionCandidates.value.filter((name) =>
    name.toLowerCase().includes(mentionQuery.value.toLowerCase())
  );
  if (options.length === 0) {
    mentionOpen.value = false;
    return;
  }

  mentionOpen.value = true;
  mentionIndex.value = Math.min(mentionIndex.value, options.length - 1);
};

const applyMention = (name) => {
  const el = inputRef.value;
  const value = text.value;
  const caret = el?.selectionStart ?? value.length;
  const before = value.slice(0, mentionStart.value);
  const after = value.slice(caret);
  const insert = `@${name} `;
  text.value = `${before}${insert}${after}`;
  mentionOpen.value = false;
  mentionQuery.value = "";
  mentionIndex.value = 0;
  nextTick(() => {
    if (!inputRef.value) return;
    const pos = before.length + insert.length;
    inputRef.value.setSelectionRange(pos, pos);
    inputRef.value.focus();
  });
};

const onInputKeydown = (event) => {
  if (mentionOpen.value) {
    const options = filteredMentions.value;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      mentionIndex.value = options.length
        ? (mentionIndex.value + 1) % options.length
        : 0;
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      mentionIndex.value = options.length
        ? (mentionIndex.value - 1 + options.length) % options.length
        : 0;
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const selected = options[mentionIndex.value];
      if (selected) applyMention(selected);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      mentionOpen.value = false;
      return;
    }
  }

  if (event.key === "Enter") {
    event.preventDefault();
    submit();
  }
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
  mentionOpen.value = false;
  mentionQuery.value = "";
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
  updateMentionState();
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

const formatAgo = (ts) => {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
};

const lastCallLabel = computed(() => {
  const last = callHistory.value[0];
  if (!last) return "";
  const duration = last.duration ? `${Math.max(1, Math.round(last.duration / 60))}m` : "";
  const suffix = duration ? ` (${duration})` : "";
  return `${last.type}${suffix} - ${formatAgo(last.at)}`;
});

const callStatusClass = computed(() => {
  if (callStatus.value === "bağlı") return "ok";
  if (callStatus.value === "bağlanıyor") return "warn";
  if (callStatus.value === "aranıyor") return "warn";
  if (callStatus.value === "koptu" || callStatus.value === "başarısız" || callStatus.value === "reddedildi") return "bad";
  return "idle";
});

const clearOverlayState = () => {
  const payload = buildOverlayPayload();
  payload.active = false;
  payload.status = "idle";
  localStorage.setItem(overlayStorageKey, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("visicos-overlay-update", { detail: payload }));
};

watch(
  [inCall, ringing, callAccepted, muted, otherUser, otherUserId, otherUserAvatar],
  () => updateOverlayState(),
  { immediate: true }
);
watch(
  ringing,
  (value) => {
    const audio = ringtoneAudio.value;
    if (!audio) return;
    if (value) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }
);


/* ================= MOUNT ================= */
onMounted(async () => {
  if (!userId) {
    router.push("/login");
    return;
  }

  loadServers();

  if (!socket.connected) socket.connect();

  requestNotifications();

  window.addEventListener("click", closeMenu);

  socket.emit("join-dm", { roomId, userId });
  await loadMessages();
  loadCallHistory();
  if (route.query.call === "1") {
    await nextTick();
    startCall();
    router.replace({ path: `/dm/${roomId}` });
  }

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
    addCallEntry("incoming");
    logVoice("incoming-call recv", { from });
    ringing.value = true;
    inCall.value = false;
    callStatus.value = "aranıyor";
    incomingFrom.value = from;
    callAccepted.value = false;
  });

  socket.on("call-rejected", () => {
    addCallEntry("rejected");
    callStartAt.value = 0;
    logVoice("call-rejected recv");
    callStatus.value = "reddedildi";
    inCall.value = false;
    ringing.value = false;
    callAccepted.value = false;
    pendingOffer.value = null;
    pendingRemoteCandidates.value = [];
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
    notifyMessage(msg);
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
  clearOverlayState();
  closeVoice();
  if (ringtoneAudio.value) {
    ringtoneAudio.value.pause();
    ringtoneAudio.value.currentTime = 0;
  }

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


<style scoped> .dm-layout {   display: grid;   grid-template-columns: 80px 1fr;   height: 100vh;   background: var(--bg);   color: var(--text);   font-family: "Inter", "Segoe UI", system-ui, sans-serif;   overflow: hidden; }  .servers {   background: var(--bg-elev);   border-right: 1px solid var(--border);   display: flex;   flex-direction: column;   align-items: center;   padding: 12px 0;   gap: 12px;   height: 100vh;   overflow: hidden; }  .logo {   width: 48px;   height: 48px;   border-radius: 14px;   background: linear-gradient(145deg, var(--accent-strong), var(--accent));   display: grid;   place-items: center;   font-weight: 800;   font-size: 20px;   color: #fff;   box-shadow: 0 8px 18px rgba(0,0,0,0.35);   cursor: pointer; } .logo img {   width: 100%;   height: 100%;   object-fit: contain; }  .logo.active {   box-shadow: 0 0 0 2px rgba(247, 201, 72, 0.45), 0 10px 18px rgba(0,0,0,0.35); }  .server-pill {   width: 48px;   height: 48px;   border-radius: 50%;   background: var(--accent-dark);   display: grid;   place-items: center;   color: var(--accent);   font-weight: 700;   cursor: pointer;   transition: all 0.15s ease; }  .server-pill:hover {   background: var(--border-strong);   transform: translateY(-2px); }  .server-pill.add {   background: #1f1f1f;   color: var(--accent);   border: 1px dashed var(--border-soft); }  @media (max-width: 720px) {   .dm-layout {     grid-template-columns: 64px 1fr;   }   .logo,   .server-pill {     width: 40px;     height: 40px;     border-radius: 12px;   } }  .dm-wrapper {   display: flex;   flex-direction: column;   height: 100vh;   background: var(--bg);   color: var(--text);   font-family: "Inter", "Segoe UI", system-ui, sans-serif;   overflow: hidden; }  /* HEADER */ .dm-header {   padding: 16px;   background: var(--bg-elev);   border-bottom: 1px solid var(--border);   display: flex;   align-items: center;   justify-content: space-between;   gap: 14px; }  .profile-head {   display: flex;   align-items: center;   gap: 12px; }  .ph-avatar {   width: 48px;   height: 48px;   border-radius: 14px;   background: var(--chip);   display: grid;   place-items: center;   color: var(--accent);   font-weight: 800;   overflow: hidden;   flex-shrink: 0; }  .ph-avatar img {   width: 100%;   height: 100%;   object-fit: cover; }  .ph-meta {   display: flex;   flex-direction: column;   gap: 4px; }  .call-history {   font-size: 11px;   color: var(--text-muted); }  .ph-name {   font-size: 18px;   font-weight: 700;   color: var(--accent); }  .header-actions {   display: flex;   align-items: center;   gap: 8px; }  .call-bar {   display: flex;   align-items: center;   justify-content: space-between;   gap: 12px;   padding: 12px 16px;   background: var(--bg-elev);   border-bottom: 1px solid var(--border); }  .call-left {   display: flex;   align-items: center;   gap: 12px;   color: var(--text);   font-weight: 600; }  .call-avatar {   width: 40px;   height: 40px;   border-radius: 12px;   background: var(--chip);   display: grid;   place-items: center;   color: var(--accent);   font-weight: 800;   overflow: hidden; }  .call-avatar img {   width: 100%;   height: 100%;   object-fit: cover; }  .call-meta {   display: flex;   flex-direction: column;   gap: 4px; }  .call-title {   font-size: 14px;   font-weight: 700;   color: var(--accent); }  .call-sub {   display: flex;   align-items: center;   gap: 6px;   color: var(--text-muted);   font-size: 12px; }  .call-dot {   width: 8px;   height: 8px;   border-radius: 50%;   background: #555;   box-shadow: 0 0 8px rgba(0,0,0,0.4); } .call-dot.ok { background: #2ecc71; } .call-dot.warn { background: var(--accent); } .call-dot.bad { background: var(--accent-strong); } .call-dot.idle { background: #555; }  .call-text {   font-size: 12px; }  .call-controls {   display: flex;   gap: 8px;   align-items: center; }  .call-btn.ok {   background: #2ecc71;   color: var(--input-bg); }  .call-icon {   width: 36px;   height: 36px;   border-radius: 10px;   border: 1px solid var(--border-soft);   background: var(--accent-dark);   color: var(--accent);   cursor: pointer; }  .call-icon.end {   border-color: var(--accent-strong);   color: var(--text-strong);   background: var(--border-strong); }  .theme-btn {   background: none;   border: none;   color: var(--accent);   font-size: 18px;   cursor: pointer; }  .call-btn{   background: var(--accent-dark);   border: 1px solid var(--border-soft);   color: var(--accent);   padding: 6px 10px;   border-radius: 10px;   cursor: pointer;   margin-left: 8px; } .call-btn.danger{   border-color:var(--accent-strong);   color:var(--accent-strong); }  /* MESSAGES */ .dm-messages {   flex: 1;   min-height: 0;   overflow-y: auto;   padding: 20px;   position: relative; }  .message {   display: flex;   width: 100%;   margin-bottom: 14px;   gap: 10px;   align-items: flex-start; }  .message.mine {   justify-content: flex-end;   flex-direction: row-reverse; }  .msg-avatar {   width: 40px;   height: 40px;   border-radius: 12px;   background: var(--chip);   display: grid;   place-items: center;   color: var(--accent);   font-weight: 700;   overflow: hidden;   flex-shrink: 0;   margin-top: 4px; }  .msg-avatar img {   width: 100%;   height: 100%;   object-fit: cover; }  .bubble {   background: var(--bg-elev-2);   padding: 16px 20px;   border-radius: 14px;   max-width: 40%;   flex: 0 1 70%;   white-space: pre-wrap;   word-break: break-word;   border: 1px solid var(--border);   box-shadow: 0 10px 20px rgba(0,0,0,0.25); }  .message.mine .bubble {   background: linear-gradient(145deg, var(--border-strong), #3a0f0f);   border: 1px solid var(--accent-strong);   margin-left: auto; }  .sender {   font-size: 12px;   color: var(--accent);   margin-bottom: 6px; }  .content {   font-size: 15px;   line-height: 1.6; }  /* META */ .meta {   display: flex;   gap: 8px;   font-size: 11px;   color: var(--text-muted);   margin-top: 8px;   align-items: center; }  .read {   color: #9be7a1; } .edit:hover, .delete:hover {   opacity: 1; }  /* REACTIONS */ .reactions {   margin-top: 8px;   display: flex;   gap: 8px;   align-items: center; }  .reactions span {   cursor: pointer; }  .rx {   color: var(--text-muted);   font-size: 12px; }  /* TYPING */ .typing {   padding: 6px 20px;   font-size: 12px;   color: var(--text-muted); }  /* INPUT */ .dm-input {   display: flex;   gap: 10px;   padding: 14px;   background: var(--bg-elev);   border-top: 1px solid var(--border); }  .input-wrap {   position: relative;   flex: 1; }  .input-wrap input {   width: 100%; }  .mention-list {   position: absolute;   left: 0;   right: 0;   bottom: 54px;   background: #1b1b1f;   border: 1px solid var(--border);   border-radius: 10px;   max-height: 180px;   overflow: auto;   z-index: 20;   box-shadow: 0 10px 24px rgba(0,0,0,0.35); }  .mention-item {   width: 100%;   border: none;   background: transparent;   color: var(--text);   padding: 8px 10px;   display: flex;   gap: 8px;   align-items: center;   text-align: left;   cursor: pointer; }  .mention-item.active, .mention-item:hover {   background: var(--border-strong);   color: var(--accent); }  .mention-tag {   color: var(--text-muted);   font-size: 12px; }  .dm-input input {   flex: 1;   background: var(--input-bg);   border: 1px solid var(--border-strong);   padding: 12px;   color: var(--text);   border-radius: 10px;   font-size: 16px; }  .dm-input button {   background: linear-gradient(145deg, var(--accent-strong), var(--accent));   border: none;   padding: 0 18px;   color: var(--accent-dark);   border-radius: 10px;   cursor: pointer;   font-weight: 700; }  .dm-input button:hover {   filter: brightness(1.05); }  .file, .emoji {   cursor: pointer;   font-size: 20px;   user-select: none;   display: flex;   align-items: center; }  /* IMAGE PREVIEW */ .image-preview {   max-width: 260px;   max-height: 260px;   border-radius: 10px;   cursor: pointer;   margin-top: 6px;   border: 1px solid var(--border-strong);   transition: transform 0.15s ease; }  .image-preview:hover {   transform: scale(1.03); }  @media (max-width: 700px) {   .dm-layout {     grid-template-columns: 56px 1fr;   }   .servers {     padding: 10px 0;   }   .logo,   .server-pill {     width: 36px;     height: 36px;     border-radius: 10px;   }   .dm-header {     flex-direction: column;     align-items: flex-start;     gap: 10px;     padding: 12px;   }   .profile-head {     width: 100%;   }   .ph-avatar {     width: 40px;     height: 40px;     border-radius: 12px;   }   .header-actions {     width: 100%;     flex-wrap: wrap;     gap: 6px;   }   .call-bar {     flex-direction: column;     align-items: flex-start;   }   .call-controls {     width: 100%;     justify-content: flex-start;   }   .dm-messages {     padding: 14px;   }   .bubble {     max-width: 85%;   }   .dm-input {     flex-wrap: wrap;     gap: 8px;   }   .dm-input input {     width: 100%;   }   .image-preview {     max-width: 100%;     height: auto;   }   .file-card {     max-width: 100%;   } } .lightbox {   position: fixed;   inset: 0;   background: rgba(0,0,0,0.9);   display: flex;   align-items: center;   justify-content: center;   z-index: 9999; }  .lightbox img {   max-width: 90%;   max-height: 90%;   border-radius: 12px; }  .lightbox .close {   position: absolute;   top: 20px;   right: 30px;   font-size: 28px;   color: white;   cursor: pointer; } .edited {   font-size: 11px;   color: var(--text-muted);   font-style: italic; } .file-link {   color: var(--accent);   text-decoration: none;   font-size: 14px; } .file-link:hover {   text-decoration: underline; } .dm-wrapper.dark {   background: var(--bg); }  .dm-wrapper.darker {   background: #0a0a0a; }  .context-menu {   position: fixed;   background: var(--panel);   border: 1px solid var(--border);   border-radius: 10px;   padding: 6px 0;   z-index: 9999;   min-width: 160px;   box-shadow: 0 10px 30px rgba(0,0,0,.5); }  .context-menu div {   padding: 8px 14px;   cursor: pointer;   font-size: 14px; }  .context-menu div:hover {   background: var(--border-strong);   color: var(--accent); } .file-card {   display: flex;   gap: 12px;   align-items: center;   background: #101010;   border: 1px solid var(--border);   border-radius: 12px;   padding: 12px 14px;   cursor: pointer;   transition: all 0.15s ease; }  .file-card:hover {   background: #171010;   border-color: var(--accent-strong); }  .file-icon {   font-size: 26px; }  .file-info {   display: flex;   flex-direction: column; }  .file-name {   font-size: 14px;   color: var(--accent);   word-break: break-all; }  .file-sub {   font-size: 11px;   color: var(--text-muted); } .cm-reactions {   display: flex;   gap: 8px;   padding: 8px 10px;   border-bottom: 1px solid var(--border); }  .cm-reactions span {   cursor: pointer;   font-size: 18px; }  .cm-reactions span:hover {   transform: scale(1.2); } .new-message-btn {   position: absolute;   bottom: 90px;   right: 20px;   background: var(--accent-strong);   color: var(--text-strong);   border: none;   padding: 8px 14px;   border-radius: 20px;   font-size: 13px;   cursor: pointer;   box-shadow: 0 6px 20px rgba(0,0,0,0.5);   animation: bounce 1.2s infinite; }  @keyframes bounce {   0%,100% { transform: translateY(0); }   50% { transform: translateY(-4px); } } .new-message-btn {   animation: bounce 1.2s infinite, pulse 2s infinite; }  @keyframes pulse {   0% { box-shadow: 0 0 0 0 rgba(195,20,50,.55); }   70% { box-shadow: 0 0 0 10px rgba(195,20,50,0); }   100% { box-shadow: 0 0 0 0 rgba(195,20,50,0); } } .status {   font-size: 12px;   margin-left: 8px; } .online { color: #9be7a1; } .offline { color: #8c7f7f; }  .reply-preview {   background: var(--bg-elev);   border-left: 4px solid var(--accent-strong);   padding: 8px 12px;   margin: 0 14px;   border-radius: 8px;   display: flex;   justify-content: space-between;   align-items: center; }  .reply-left {   display: flex;   flex-direction: column;   font-size: 12px; }  .reply-left span {   color: var(--text-muted); }  .reply-close {   cursor: pointer;   color: var(--text-muted); }  .reply-bubble {   background: #101010;   border-left: 3px solid var(--accent-strong);   padding: 6px 10px;   margin-bottom: 6px;   font-size: 12px;   border-radius: 6px; }  .reply-bubble {   cursor: pointer;   transition: background .15s ease; }  .reply-bubble:hover {   background: #171010; } @keyframes pulseHighlight {   0% {     box-shadow: 0 0 0 0 rgba(195,20,50,.6);   }   70% {     box-shadow: 0 0 0 12px rgba(195,20,50,0);   }   100% {     box-shadow: 0 0 0 0 rgba(195,20,50,0);   } }  .message.pulse .bubble {   animation: pulseHighlight 1.2s ease-out; } @keyframes slideIn {   from { transform: translateX(100%); }   to { transform: translateX(0); } } .message.hover-highlight .bubble {   box-shadow: 0 0 0 2px var(--accent-strong);   background: var(--border-strong);   transition: all .15s ease; }  .call-popup{   position:fixed;   bottom:110px;   left:50%;   transform:translateX(-50%);   background:var(--bg-elev);   border:1px solid var(--border);   padding:14px 16px;   border-radius:14px;   box-shadow:0 10px 30px rgba(0,0,0,.5);   z-index:99999;   min-width:260px; } .call-title{   color:var(--text);   margin-bottom:10px; } .call-actions{   display:flex;   gap:10px;   justify-content:flex-end; } .call-actions .ok{   background:#1f8b4c;   border:none;   color:#fff;   padding:8px 12px;   border-radius:10px;   cursor:pointer; } .call-actions .no{   background:var(--accent-strong);   border:none;   color:var(--text-strong);   padding:8px 12px;   border-radius:10px;   cursor:pointer; }  </style>










<style scoped>
.server-pill img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.server-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
}

.server-card {
  width: min(420px, 92vw);
  background: #2a2b30;
  border: 1px solid #35363b;
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

.server-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.server-title {
  font-size: 16px;
  font-weight: 700;
}

.server-field {
  display: grid;
  gap: 8px;
}

.server-field label {
  font-size: 12px;
  color: var(--text-muted);
}

.server-field input {
  background: #1f1f22;
  border: 1px solid #33343a;
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
}

.server-cover-preview {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #33343a;
}

.server-cover-preview img {
  width: 100%;
  display: block;
  height: 160px;
  object-fit: cover;
}

.server-error {
  color: #ff9a9a;
  font-size: 12px;
}

.server-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>

<style scoped>
.ghost-btn {
  background: transparent;
  border: 1px solid #3a3b41;
  color: var(--text-muted);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.ghost-btn:hover {
  color: var(--text-strong);
  border-color: #4a4b52;
}

.primary-btn {
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  color: var(--accent-dark);
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>








<style scoped>
.dm-layout,
.dm-wrapper {
  --accent: #85ccff;
  --accent-strong: #3d8fe9;
  --accent-dark: #102743;
  --border: #2d4663;
  --border-strong: #406287;
  --border-soft: #5479a5;
  background:
    radial-gradient(760px 340px at 60% -22%, rgba(100, 177, 255, 0.16), transparent 60%),
    #0c1118;
}

.servers,
.dm-header,
.call-bar,
.dm-input,
.context-menu,
.server-card,
.server-field input,
.bubble,
.file-card,
.reply-preview,
.reply-bubble {
  border-color: rgba(120, 176, 239, 0.34) !important;
}

.bubble,
.file-card,
.context-menu,
.server-card {
  border-radius: 14px;
  box-shadow: 0 18px 38px rgba(6, 14, 27, 0.36);
}

.message.mine .bubble {
  background: linear-gradient(145deg, rgba(30, 60, 92, 0.95), rgba(41, 90, 145, 0.95));
}

.call-btn,
.dm-input button,
.primary-btn,
.new-message-btn {
  background: linear-gradient(135deg, #87ccff, #3c8fe8) !important;
  color: #0b223e !important;
}

.dm-row:hover,
.context-menu div:hover,
.file-card:hover,
.reply-bubble:hover {
  background: rgba(51, 93, 146, 0.2);
}
</style>


