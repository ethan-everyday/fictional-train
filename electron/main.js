// Seven Nights desktop app: the Steam-shaped shell.
//
// One process = the whole game night. It embeds the game server
// (server.js) and opens the host screen in a window. Players' phones join
// over the local network exactly as they do against `node server.js`.
//
// Run in development:   npm run desktop      (after `npm run build`)
// Package for Windows:  npm run dist         (electron-builder -> /dist)

const { app, BrowserWindow, dialog, shell } = require("electron");
const path = require("path");

// Desktop app = a real game: title music starts without a click.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const PORT = 3100;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    autoHideMenuBar: true,
    backgroundColor: "#09090b",
    title: "Seven Nights",
    webPreferences: {
      // The game is a plain web page; no Node access in the renderer.
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // External links (if any ever appear) go to the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(`http://localhost:${PORT}/host`);
}

app.whenReady().then(() => {
  try {
    const { start } = require(path.join(__dirname, "..", "server.js"));
    start({
      port: PORT,
      dev: false,
      // Room state must live somewhere writable; the app bundle is not.
      stateDir: app.getPath("userData"),
    });
  } catch (err) {
    dialog.showErrorBox(
      "Seven Nights could not start",
      `The game server failed to start:\n\n${err.message}\n\n` +
        "Is another copy of the game already running?",
    );
    app.quit();
    return;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
