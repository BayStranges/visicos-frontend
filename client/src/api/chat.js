import api from "./axios";

export const sendDM = (toEmail, text) => {
  return api.post("/chat/send", { toEmail, text });
};

export const getDMs = () => {
  return api.get("/chat/messages");
};
