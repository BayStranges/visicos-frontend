const fallbackLogos = Array.from({ length: 10 }, (_, index) => `/logos/logo${index + 1}.svg`);

export const getFallbackLogo = (seed) => {
  if (seed === undefined || seed === null || seed === "") {
    const randomIndex = Math.floor(Math.random() * fallbackLogos.length);
    return fallbackLogos[randomIndex];
  }

  const value = String(seed);
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return fallbackLogos[hash % fallbackLogos.length];
};
