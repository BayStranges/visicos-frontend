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
      <div class="quick-handle">{{ handleText }}</div>
      <div class="quick-block">
        <button class="quick-row" @click="emit('editProfile')">Oyun Koleksiyonu</button>
      </div>

      <div class="quick-block">
        <button class="quick-row" @click="emit('editProfile')">Profili Duzenle</button>
        <button class="quick-row split" @click="emit('toggleDnd')">
          {{ dndEnabled ? "Rahatsiz Etmeyin Kapat" : "Rahatsiz Etmeyin" }}
        </button>
      </div>

      <div class="quick-block">
        <button class="quick-row" @click="emit('switchAccount')">Hesap Degistir</button>
        <button class="quick-row split" @click="emit('copyId')">Kullanici ID'sini Kopyala</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  username: { type: String, default: "" },
  avatar: { type: String, default: "" },
  banner: { type: String, default: "" },
  isOnline: { type: Boolean, default: false },
  dndEnabled: { type: Boolean, default: false }
});

const emit = defineEmits(["close", "editProfile", "toggleDnd", "switchAccount", "copyId"]);

const handleText = computed(() => (props.username ? `${props.username.toLowerCase()}tenarilar` : ""));
const bannerStyle = computed(() =>
  props.banner
    ? { backgroundImage: `url(${props.banner})` }
    : { background: "linear-gradient(145deg,#9e9be2,#a7a2eb)" }
);
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
</style>
