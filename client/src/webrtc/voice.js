import socket from "../socket";

let pc = null;
let localStream = null;
let rawStream = null;
let audioContext = null;
let audioNodes = null;
let voiceBoost = 1.2;
let noiseMode = "rnnoise";
let currentRoomId = null;
let globalMute = false;
let globalDeafen = false;

const log = (...args) => {
  const room = currentRoomId ? ` room=${currentRoomId}` : "";
  console.log(`[voice]${room}`, ...args);
};

const loadVoiceBoost = () => {
  const stored = localStorage.getItem("visicos_voice_boost") || "medium";
  if (stored === "off") return 1.0;
  if (stored === "low") return 1.1;
  if (stored === "high") return 1.35;
  return 1.2;
};

voiceBoost = loadVoiceBoost();

const loadNoiseMode = () => {
  const stored = localStorage.getItem("visicos_noise_mode") || "rnnoise";
  if (stored === "off") return "off";
  if (stored === "webrtc") return "webrtc";
  return "rnnoise";
};

noiseMode = loadNoiseMode();

const buildIceServers = () => {
  const servers = [{ urls: "stun:stun.l.google.com:19302" }];
  log("ice servers final:", servers);
  return servers;
};

const ensureRemoteAudioElement = () => {
  let audio = document.getElementById("remote-audio");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "remote-audio";
    audio.autoplay = true;
    audio.playsInline = true;
    document.body.appendChild(audio);
  }
  audio.muted = globalDeafen;
  return audio;
};

const applyGlobalState = () => {
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !globalMute;
    });
  }

  const audio = document.getElementById("remote-audio");
  if (audio) audio.muted = globalDeafen;
};

const buildAudioConstraints = () => ({
  echoCancellation: noiseMode !== "off",
  noiseSuppression: noiseMode !== "off",
  autoGainControl: noiseMode !== "off",
  channelCount: 1
});

const buildProcessedStream = async (stream) => {
  if (!stream) return null;
  if (!window.AudioContext && !window.webkitAudioContext) return null;

  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioContext = new Ctx({ latencyHint: "interactive" });
  }

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {}
  }

  const source = audioContext.createMediaStreamSource(stream);
  let rnnoise = null;
  if (noiseMode === "rnnoise") {
    try {
      const { RNNoiseNode, rnnoise_loadAssets } = await import("simple-rnnoise-wasm");
      const assets = await rnnoise_loadAssets({
        scriptSrc: "/rnnoise/rnnoise.worklet.js",
        moduleSrc: "/rnnoise/rnnoise.wasm"
      });
      await RNNoiseNode.register(audioContext, assets);
      rnnoise = new RNNoiseNode(audioContext);
    } catch (err) {
      log("rnnoise init failed, fallback to webrtc", {
        message: err?.message
      });
    }
  }
  const highpass = audioContext.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 160;

  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -55;
  compressor.knee.value = 30;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.2;

  const gain = audioContext.createGain();
  gain.gain.value = voiceBoost;

  const destination = audioContext.createMediaStreamDestination();
  if (rnnoise) {
    source.connect(rnnoise);
    rnnoise.connect(highpass);
  } else {
    source.connect(highpass);
  }
  highpass.connect(compressor);
  compressor.connect(gain);
  gain.connect(destination);

  audioNodes = { source, rnnoise, highpass, compressor, gain, destination };
  return new MediaStream(destination.stream.getAudioTracks());
};

export const initVoice = async (roomId, { onStateChange, onRemoteTrack } = {}) => {
  currentRoomId = roomId;
  log("initVoice start");
  // Reuse PC but make sure tracks exist
  if (!rawStream) {
    try {
      rawStream = await navigator.mediaDevices.getUserMedia({
        audio: buildAudioConstraints(),
        video: false
      });
      log("getUserMedia ok", {
        audioTracks: rawStream.getAudioTracks().length,
        videoTracks: rawStream.getVideoTracks().length
      });
    } catch (err) {
      log("getUserMedia failed", {
        name: err?.name,
        message: err?.message
      });
      throw err;
    }
  }

  if (!localStream) {
    try {
      const processed = await buildProcessedStream(rawStream);
      localStream = processed || rawStream;
    } catch (err) {
      log("audio processing failed, fallback to raw", {
        message: err?.message
      });
      localStream = rawStream;
    }
  }

  applyGlobalState();

  if (!pc) {
    pc = new RTCPeerConnection({ iceServers: buildIceServers() });
    log("pc created", pc);

    pc.onicecandidate = (e) => {
      if (!e.candidate) {
        log("ice candidate complete");
        return;
      }
      log("ice candidate", {
        type: e.candidate?.type,
        protocol: e.candidate?.protocol,
        address: e.candidate?.address,
        port: e.candidate?.port
      });
      socket.emit("webrtc-ice", { roomId, candidate: e.candidate });
    };

    pc.onicecandidateerror = (e) => {
      log("ice candidate error", {
        errorCode: e?.errorCode,
        errorText: e?.errorText,
        url: e?.url
      });
    };

    pc.onsignalingstatechange = () => {
      log("signaling state:", pc.signalingState);
    };

    pc.onicegatheringstatechange = () => {
      log("ice gathering state:", pc.iceGatheringState);
    };

    pc.onnegotiationneeded = async () => {
      log("negotiation needed");
    };

    pc.onconnectionstatechange = () => {
      console.log("PC state:", pc.connectionState);
      log("pc connection state:", pc.connectionState);
      onStateChange?.(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE state:", pc.iceConnectionState);
      log("ice connection state:", pc.iceConnectionState);
      onStateChange?.(pc.iceConnectionState);
    };

    pc.ontrack = (e) => {
      log("remote track", {
        trackId: e.track?.id,
        kind: e.track?.kind,
        streams: e.streams?.map((s) => s.id)
      });
      const [stream] = e.streams;
      if (!stream) return;
      const audio = ensureRemoteAudioElement();
      audio.srcObject = stream;
      onRemoteTrack?.(stream);
    };
  }

  // Attach local tracks if not already
  const senders = pc.getSenders();
  const hasAudio = senders.some((s) => s.track && s.track.kind === "audio");
  log("local senders", { senders: senders.length, hasAudio });
  if (!hasAudio && localStream) {
    localStream.getTracks().forEach((track) => {
      track.enabled = !globalMute;
      log("add local track", { id: track.id, kind: track.kind });
      pc.addTrack(track, localStream);
    });
  }

  log("initVoice done");
  return pc;
};

export const getPC = () => pc;

export const setGlobalMute = (value) => {
  globalMute = !!value;
  log("global mute", globalMute);
  applyGlobalState();
};

export const setGlobalDeafen = (value) => {
  globalDeafen = !!value;
  log("global deafen", globalDeafen);
  applyGlobalState();
};

export const setVoiceBoost = (level) => {
  if (!level) return;
  localStorage.setItem("visicos_voice_boost", level);
  voiceBoost = loadVoiceBoost();
  if (audioNodes?.gain) {
    audioNodes.gain.gain.value = voiceBoost;
  }
};

export const setNoiseMode = (mode) => {
  if (!mode) return;
  localStorage.setItem("visicos_noise_mode", mode);
  noiseMode = loadNoiseMode();
};

export const closeVoice = () => {
  log("closeVoice start");
  try {
    if (pc) pc.close();
  } catch {}

  pc = null;

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  if (rawStream) {
    rawStream.getTracks().forEach((t) => t.stop());
    rawStream = null;
  }
  if (audioContext) {
    try {
      audioContext.close();
    } catch {}
    audioContext = null;
    audioNodes = null;
  }

  const audio = document.getElementById("remote-audio");
  if (audio) {
    audio.srcObject = null;
    audio.remove();
  }
  currentRoomId = null;
  log("closeVoice done");
};
