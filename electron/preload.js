const { contextBridge, shell, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openExternal: (url) => shell.openExternal(url),
  getRunningProcesses: () => ipcRenderer.invoke("get-running-processes")
});
