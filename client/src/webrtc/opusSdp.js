export const tuneOpusSdp = (sdp) => {
  if (!sdp) return sdp;
  const lines = sdp.split("\n");
  let opusPt = null;

  for (const line of lines) {
    if (line.startsWith("a=rtpmap:") && line.toLowerCase().includes("opus/48000")) {
      const parts = line.split(":")[1]?.split(" ")[0];
      if (parts) opusPt = parts.trim();
    }
  }

  if (!opusPt) return sdp;

  const fmtpLine = `a=fmtp:${opusPt} minptime=10;useinbandfec=1;usedtx=1;maxplaybackrate=48000;stereo=0`;
  const out = [];
  let inserted = false;

  for (const line of lines) {
    if (line.startsWith(`a=fmtp:${opusPt}`)) {
      if (!inserted) {
        out.push(fmtpLine);
        inserted = true;
      }
      continue;
    }
    out.push(line);
    if (!inserted && line.startsWith(`a=rtpmap:${opusPt}`)) {
      out.push(fmtpLine);
      inserted = true;
    }
  }

  return out.join("\n");
};
