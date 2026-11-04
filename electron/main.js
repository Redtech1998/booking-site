const { app, BrowserWindow, shell, Menu } = require("electron");
const http = require("http");

// Disable GPU compositing to prevent mailbox overlay errors on macOS Apple Silicon
app.commandLine.appendSwitch("disable-gpu-compositing");

const BASE_URL = "http://localhost:3100";

function waitForServer(url, timeoutMs = 30000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode < 500) {
          resolve(true);
        } else {
          setTimeout(check, 500);
        }
      });
      req.on("error", () => {
        if (Date.now() - startTime > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(check, 500);
        }
      });
      req.setTimeout(2000, () => {
        req.destroy();
        setTimeout(check, 500);
      });
    };
    check();
  });
}

function setupMenu(win) {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac
      ? [
          {
            label: "RSE | OS",
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload (તાજું કરો)",
          accelerator: "CmdOrCtrl+R",
          click: () => win && win.webContents.reload(),
        },
        {
          label: "Hard Reload",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => win && win.webContents.reloadIgnoringCache(),
        },
        {
          label: "Developer Tools",
          accelerator: "Alt+Command+I",
          click: () => win && win.webContents.toggleDevTools(),
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1000,
    minHeight: 680,
    title: "RSE | OS",
    backgroundColor: "#F8F7F4",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  setupMenu(win);

  // Modern Electron 45+ console message logger
  win.webContents.on("console-message", (event, level, message, line, sourceId) => {
    const msg = event?.message || message || event;
    const src = event?.sourceId || sourceId || "";
    const ln = event?.line || line || 0;
    console.log(`[Renderer Console] ${msg} (${src}:${ln})`);
  });

  // Connecting Screen while local Next.js server wakes up
  win.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              background-color: #F8F7F4;
              color: #1C1C1E;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              user-select: none;
              -webkit-app-region: drag;
            }
            .card {
              background: rgba(255, 255, 255, 0.95);
              padding: 36px 48px;
              border-radius: 24px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.06);
              border: 1px solid rgba(0,0,0,0.06);
              text-align: center;
            }
            .spinner {
              width: 32px;
              height: 32px;
              border: 3px solid rgba(107, 46, 76, 0.15);
              border-top: 3px solid #6B2E4C;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin: 0 auto 16px;
            }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            h2 { margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #1C1C1E; }
            p { margin: 0; font-size: 13px; color: #8E8E93; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h2>RSE | OS શરૂ થઈ રહ્યું છે...</h2>
            <p>લોકલ સર્વર સાથે જોડાઈ રહ્યું છે</p>
          </div>
        </body>
      </html>
    `)}`
  );

  // Ensure server is up before rendering
  await waitForServer(BASE_URL);
  win.loadURL(BASE_URL);
  win.show();
  win.focus();
  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
  }

  // Auto-recovery if connection momentarily drops
  win.webContents.on("did-fail-load", () => {
    setTimeout(async () => {
      const isUp = await waitForServer(BASE_URL, 8000);
      if (isUp) win.loadURL(BASE_URL);
    }, 1000);
  });

  // Open external links (Drive, WhatsApp, Frame.io) in default system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
