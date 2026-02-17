<template>
  <div v-if="open" class="quick-wrap" @click="emit('close')">
    <div class="quick-card" @click.stop>
      <div class="quick-banner" :style="bannerStyle"></div>
      <div class="quick-avatar">
        <img v-if="avatar" :src="avatar" alt="avatar" />
        <span v-else>{{ (username || "?").slice(0, 1).toUpperCase() }}</span>
        <span class="quick-dot" :class="{ offline: !isOnline }"></span>
      </div>

      <div class="quick-class-row">
        <button class="quick-class-btn">+ Karakter sinifini sec</button>
      </div>

      <div class="quick-name">{{ username || "Kullanici" }}</div>
      <div class="quick-block">
        <button class="quick-row" @click="emit('editProfile')">Oyun Koleksiyonu</button>
      </div>

      <div class="quick-block status-block">
        <button class="quick-row" @click="emit('editProfile')">Profili Duzenle</button>
        <button class="quick-row split status-row" @click="showPresenceMenu = !showPresenceMenu">
          {{ presenceLabel }}
          <span class="status-arrow">></span>
        </button>
        <div v-if="showPresenceMenu" class="presence-menu">
          <button class="presence-item" @click="setPresence('online')">
            <span class="presence-dot online"></span>
            <span>Cevrim ici</span>
          </button>
          <button class="presence-item" @click="setPresence('idle')">
            <span class="presence-dot idle"></span>
            <span>Bosta</span>
          </button>
          <button class="presence-item" @click="setPresence('dnd')">
            <span class="presence-dot dnd"></span>
            <span>Rahatsiz Etmeyin</span>
          </button>
          <button class="presence-item" @click="setPresence('invisible')">
            <span class="presence-dot invisible"></span>
            <span>Gorunmez</span>
          </button>
        </div>
      </div>

      <div class="quick-block">
        <button class="quick-row" @click="emit('switchAccount')">Hesap Degistir</button>
        <button class="quick-row split" @click="emit('copyId')">Kullanici ID'sini Kopyala</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  username: { type: String, default: "" },
  avatar: { type: String, default: "" },
  banner: { type: String, default: "" },
  isOnline: { type: Boolean, default: false },
  dndEnabled: { type: Boolean, default: false },
  presenceStatus: { type: String, default: "online" }
});

const emit = defineEmits(["close", "editProfile", "setPresence", "switchAccount", "copyId"]);
const showPresenceMenu = ref(false);
const bannerStyle = computed(() =>
  props.banner
    ? { backgroundImage: `url(${props.banner})` }
    : { background: "linear-gradient(145deg,#9e9be2,#a7a2eb)" }
);
const presenceLabel = computed(() => {
  if (props.presenceStatus === "idle") return "Bosta";
  if (props.presenceStatus === "dnd") return "Rahatsiz Etmeyin";
  if (props.presenceStatus === "invisible") return "Gorunmez";
  return "Cevrim ici";
});

const setPresence = (status) => {
  emit("setPresence", status);
  showPresenceMenu.value = false;
};
</script>

<style scoped>
.quick-wrap {
  position: fixed;
  inset: 0;
  z-index: 200;
}

.quick-card {
  position: fixed;
  left: 86px;
  bottom: 86px;
  width: 300px;
  background: #f0f1f3;
  border: 1px solid #c8ccd3;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.45);
  color: #31343b;
}

.quick-banner {
  height: 104px;
  background-size: cover;
  background-position: center;
}

.quick-avatar {
  position: absolute;
  left: 14px;
  top: 58px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 5px solid #f0f1f3;
  background: #d6d9df;
  overflow: hidden;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
}

.quick-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quick-dot {
  position: absolute;
  right: 1px;
  bottom: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid #f0f1f3;
  background: #25b861;
}

.quick-dot.offline {
  background: #d14646;
}

.quick-class-row {
  padding: 8px 14px 0 88px;
}

.quick-class-btn {
  width: 100%;
  border: 1px solid #d3d6dd;
  background: #fbfbfc;
  color: #6a6f79;
  border-radius: 999px;
  padding: 8px 10px;
  text-align: left;
  font-size: 13px;
}

.quick-name {
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
  padding: 8px 14px 0;
}

.quick-handle {
  padding: 2px 14px 0;
  color: #656a73;
  font-size: 24px;
  font-weight: 700;
}

.quick-block {
  margin: 10px 14px 0;
  border: 1px solid #d1d4da;
  border-radius: 10px;
  overflow: hidden;
  background: #f7f7f8;
}

.quick-row {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: #4f5561;
  padding: 13px 12px;
  font-size: 15px;
  cursor: pointer;
}

.quick-row.split {
  border-top: 1px solid #d8dbe1;
}

.quick-row:hover {
  background: #eceef2;
}

.status-block {
  position: relative;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-arrow {
  color: #828792;
}

.presence-menu {
  position: absolute;
  left: calc(100% + 12px);
  top: 34px;
  min-width: 230px;
  background: #f0f1f3;
  border: 1px solid #d1d4da;
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
  z-index: 5;
}

.presence-item {
  width: 100%;
  border: none;
  background: transparent;
  color: #32353c;
  padding: 8px;
  text-align: left;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.presence-item:hover {
  background: #e7e9ee;
}

.presence-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.presence-dot.online { background: #2ea869; }
.presence-dot.idle { background: #f0b34d; }
.presence-dot.dnd { background: #d94b4b; }
.presence-dot.invisible { background: #8b909b; }
</style>
