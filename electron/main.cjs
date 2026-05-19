const { app, BrowserWindow, protocol, session, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const APP_SCHEME = "als-aac";
const APP_HOST = "app";
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".task": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function resolveDistPath(requestUrl) {
  const url = new URL(requestUrl);
  const rawPathname = url.pathname === "/" || url.pathname === "" ? "/index.html" : url.pathname;
  const normalizedPathname = decodeURIComponent(rawPathname);
  const filePath = path.resolve(DIST_DIR, `.${normalizedPathname}`);

  if (!filePath.startsWith(`${DIST_DIR}${path.sep}`) && filePath !== DIST_DIR) {
    return null;
  }

  return filePath;
}

async function registerAppProtocol() {
  protocol.handle(APP_SCHEME, async (request) => {
    const filePath = resolveDistPath(request.url);

    if (!filePath) {
      return new Response("Forbidden", { status: 403 });
    }

    try {
      const data = await fs.readFile(filePath);
      return new Response(data, {
        headers: {
          "content-type": contentTypeFor(filePath),
          "cache-control": "no-cache",
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}

function configurePermissions() {
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => permission === "media");
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details = {}) => {
    if (permission !== "media") {
      callback(false);
      return;
    }

    const mediaTypes = details.mediaTypes || [];
    callback(mediaTypes.length === 0 || mediaTypes.includes("video"));
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1100,
    minHeight: 720,
    title: "ALS 面部微动作 AAC",
    backgroundColor: "#080c14",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowedUrl = DEV_SERVER_URL || `${APP_SCHEME}://${APP_HOST}/`;

    if (!url.startsWith(allowedUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (DEV_SERVER_URL) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadURL(`${APP_SCHEME}://${APP_HOST}/index.html`);
  }
}

const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    await registerAppProtocol();
    configurePermissions();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
