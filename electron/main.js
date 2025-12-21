const { app, BrowserWindow, shell, ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");

const isDev = process.env.NODE_ENV === "development";
const VITE_DEV_SERVER = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#0b0b0b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.menuBarVisible = false;

  if (isDev) {
    win.loadURL(VITE_DEV_SERVER);
  } else {
    const indexPath = path.join(__dirname, "..", "client", "dist", "index.html");
    win.loadFile(indexPath);
  }

  // Açılan harici linkleri varsayılan tarayıcıda aç
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
};

const parseCsvLine = (line) => {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((s) => s.trim());
};

const getRunningProcesses = () =>
  new Promise((resolve) => {
    if (process.platform === "win32") {
      exec("tasklist /FO CSV /NH", { windowsHide: true }, (err, stdout) => {
        if (err) {
          resolve([]);
          return;
        }
        const lines = stdout.split(/\r?\n/).filter(Boolean);
        const names = lines
          .map((line) => parseCsvLine(line)[0])
          .filter(Boolean);
        resolve(names);
      });
      return;
    }

    exec("ps -A -o comm=", (err, stdout) => {
      if (err) {
        resolve([]);
        return;
      }
      const names = stdout.split(/\r?\n/).filter(Boolean);
      resolve(names);
    });
  });

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("get-running-processes", async () => {
    return getRunningProcesses();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
