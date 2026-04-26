const { app, BrowserWindow, Menu, shell } = require("electron");

const PANEL_URL = process.env.ODONTO_PANEL_URL || "https://odonto-gules.vercel.app/dashboard";

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 720,
    title: "Odonto Painel",
    backgroundColor: "#f8fafc",
    autoHideMenuBar: true,
    webPreferences: {
      preload: require("path").join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);
  win.loadURL(PANEL_URL);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(new URL(PANEL_URL).origin)) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("did-fail-load", () => {
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <html>
        <head>
          <title>Odonto Painel</title>
          <style>
            body{font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;display:grid;place-items:center;height:100vh;margin:0}
            main{max-width:520px;padding:32px;border:1px solid #e2e8f0;border-radius:18px;background:white;box-shadow:0 20px 60px rgba(15,23,42,.08)}
            h1{margin:0 0 10px;font-size:24px}
            p{line-height:1.5;color:#475569}
            button{margin-top:12px;padding:10px 14px;border-radius:10px;border:0;background:#2563eb;color:white;font-weight:700;cursor:pointer}
          </style>
        </head>
        <body>
          <main>
            <h1>Sem conexão com o painel</h1>
            <p>Verifique a internet do computador e tente novamente.</p>
            <button onclick="location.href='${PANEL_URL}'">Tentar novamente</button>
          </main>
        </body>
      </html>
    `)}`);
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
