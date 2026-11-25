const { app, BrowserWindow, shell, Menu } = require("electron");
const http = require("http");
const https = require("https");
const path = require("path");

// Disable GPU compositing to prevent mailbox overlay errors on macOS Apple Silicon
app.commandLine.appendSwitch("disable-gpu-compositing");

const LOCAL_URL = "http://localhost:3100/os";
const LAN_URL = "http://RSEs-MacBook-Air.local:3100/os";
const CLOUD_URL = "https://book.rsegnr.in/os?pass=rse2026";
const ICON_PATH = path.join(__dirname, "AppIcon.icns");

function checkUrl(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 400);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function resolveTargetUrl() {
  // 1. Prefer local server on primary Studio Mac
  if (await checkUrl(LOCAL_URL, 1500)) return LOCAL_URL;
  // 2. Try Studio local Wi-Fi host for secondary MacBooks in office
  if (await checkUrl(LAN_URL, 1500)) return LAN_URL;
  // 3. Universal Cloud Fallback (Works on any Mac anywhere in the world)
  return CLOUD_URL;
}

function triggerInPageShortcut(win, action) {
  if (!win || win.isDestroyed()) return;
  win.webContents
    .executeJavaScript(`window.dispatchEvent(new CustomEvent('rse-os-action', { detail: '${action}' }));`)
    .catch(() => {});
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
              {
                label: "નવું સ્લોટ બુકિંગ (New Booking)",
                accelerator: "CmdOrCtrl+N",
                click: () => triggerInPageShortcut(win, "new-booking"),
              },
              {
                label: "ગ્લોબલ સર્ચ (Search)",
                accelerator: "CmdOrCtrl+K",
                click: () => triggerInPageShortcut(win, "focus-search"),
              },
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
      role: "editMenu",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
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

  if (isMac && app.dock) {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: "+ નવું સ્લોટ બુકિંગ ઉમેરો",
        click: () => {
          win.show();
          triggerInPageShortcut(win, "new-booking");
        },
      },
      {
        label: "તાજું કરો (Sync)",
        click: () => win && win.webContents.reload(),
      },
    ]);
    app.dock.setMenu(dockMenu);
  }
}

async function createWindow() {
  if (process.platform === "darwin" && app.dock) {
    try {
      app.dock.setIcon(ICON_PATH);
    } catch (_) {}
  }

  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    title: "RSE | OS",
    icon: ICON_PATH,
    backgroundColor: "#F8F7F4",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  setupMenu(win);

  // Connecting Screen while locating fastest Studio Server (Local -> LAN -> Cloud)
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
            <p>સ્ટુડિયો સર્વર અને MongoDB ક્લાઉડ સાથે જોડાઈ રહ્યું છે</p>
          </div>
        </body>
      </html>
    `)}`
  );

  let activeUrl = await resolveTargetUrl();
  win.loadURL(activeUrl);
  win.show();
  win.focus();

  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
  }

  // Auto-recovery if connection momentarily drops
  win.webContents.on("did-fail-load", () => {
    setTimeout(async () => {
      activeUrl = await resolveTargetUrl();
      if (!win.isDestroyed()) win.loadURL(activeUrl);
    }, 1500);
  });

  // Native Right-Click Context Menu (Cut, Copy, Paste, Select All)
  win.webContents.on("context-menu", (_event, params) => {
    const ctxTemplate = [];
    if (params.isEditable) {
      ctxTemplate.push(
        { role: "undo", label: "Undo" },
        { role: "redo", label: "Redo" },
        { type: "separator" },
        { role: "cut", label: "Cut" },
        { role: "copy", label: "Copy" },
        { role: "paste", label: "Paste" },
        { role: "pasteAndMatchStyle", label: "Paste and Match Style" },
        { type: "separator" },
        { role: "selectAll", label: "Select All" }
      );
    } else if (params.selectionText && params.selectionText.trim().length > 0) {
      ctxTemplate.push(
        { role: "copy", label: "Copy" },
        { type: "separator" },
        { role: "selectAll", label: "Select All" }
      );
    } else {
      ctxTemplate.push({ role: "selectAll", label: "Select All" });
    }
    Menu.buildFromTemplate(ctxTemplate).popup({ window: win });
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
