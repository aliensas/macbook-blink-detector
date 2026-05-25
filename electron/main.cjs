const { app, BrowserWindow, ipcMain, protocol, session, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");

const APP_SCHEME = "als-aac";
const APP_HOST = "app";
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const PRELOAD_PATH = path.join(__dirname, "preload.cjs");
const SPEECH_TIMEOUT_MS = 12000;

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
  function allowsVideoOnlyMediaRequest(details = {}) {
    const mediaTypes = details.mediaTypes || [];
    return mediaTypes.length === 0 || (mediaTypes.includes("video") && !mediaTypes.includes("audio"));
  }

  session.defaultSession.setPermissionCheckHandler((_webContents, permission, _requestingOrigin, details = {}) => {
    if (permission !== "media") {
      return false;
    }

    return allowsVideoOnlyMediaRequest(details);
  });

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details = {}) => {
    if (permission !== "media") {
      callback(false);
      return;
    }

    callback(allowsVideoOnlyMediaRequest(details));
  });
}

let speechProcess = null;

function stopNativeSpeech() {
  if (speechProcess && !speechProcess.killed) {
    speechProcess.kill();
  }
  speechProcess = null;
}

function runSpeechCommand(command, args, options = {}) {
  const { timeoutMs = SPEECH_TIMEOUT_MS, ...spawnOptions } = options;
  stopNativeSpeech();

  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(command, args, {
      windowsHide: true,
      ...spawnOptions,
    });
    let timeout = null;

    speechProcess = child;

    const settle = (callback, value) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      if (speechProcess === child) {
        speechProcess = null;
      }
      callback(value);
    };

    if (timeoutMs > 0) {
      timeout = setTimeout(() => {
        if (!child.killed) {
          child.kill();
        }
        settle(reject, new Error("Speech command timed out."));
      }, timeoutMs);
    }

    child.once("error", (error) => {
      settle(reject, error);
    });

    child.once("exit", (code, signal) => {
      if (code === 0 || signal === "SIGTERM") {
        settle(resolve, { ok: true });
        return;
      }

      settle(reject, new Error(`Speech command exited with code ${code ?? signal ?? "unknown"}.`));
    });
  });
}

function normalizeSpeechText(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 500);
}

async function speakNatively({ text, lang, rate, volume } = {}) {
  const speechText = normalizeSpeechText(text);
  if (!speechText) {
    return { ok: false };
  }

  if (process.platform === "darwin") {
    return runSpeechCommand("say", [speechText]);
  }

  if (process.platform === "win32") {
    const script = [
      "Add-Type -AssemblyName System.Speech;",
      "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;",
      "$text = [Environment]::GetEnvironmentVariable('ALS_AAC_SPEECH_TEXT');",
      "$lang = [Environment]::GetEnvironmentVariable('ALS_AAC_SPEECH_LANG');",
      "$rateRaw = [Environment]::GetEnvironmentVariable('ALS_AAC_SPEECH_RATE');",
      "$volumeRaw = [Environment]::GetEnvironmentVariable('ALS_AAC_SPEECH_VOLUME');",
      "$culture = if ($lang -like 'en*') { 'en-US' } else { 'zh-CN' };",
      "try {",
      "  $voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like \"$culture*\" } | Select-Object -First 1;",
      "  if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name); }",
      "} catch {}",
      "$rate = 0;",
      "if ([int]::TryParse($rateRaw, [ref]$rate)) { $synth.Rate = [Math]::Max(-10, [Math]::Min(10, $rate)); }",
      "$volume = 100;",
      "if ([int]::TryParse($volumeRaw, [ref]$volume)) { $synth.Volume = [Math]::Max(0, [Math]::Min(100, $volume)); }",
      "$synth.Speak($text);",
      "$synth.Dispose();",
    ].join(" ");

    const mappedRate = Number.isFinite(rate) ? Math.round((rate - 1) * 10) : -1;
    const mappedVolume = Number.isFinite(volume) ? Math.round(volume * 100) : 100;

    return runSpeechCommand("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], {
      env: {
        ...process.env,
        ALS_AAC_SPEECH_TEXT: speechText,
        ALS_AAC_SPEECH_LANG: String(lang || "zh-CN"),
        ALS_AAC_SPEECH_RATE: String(mappedRate),
        ALS_AAC_SPEECH_VOLUME: String(mappedVolume),
      },
    });
  }

  return runSpeechCommand("spd-say", [speechText]);
}

function configureNativeSpeech() {
  ipcMain.handle("speech:speak", (_event, payload) => speakNatively(payload));
  ipcMain.handle("speech:cancel", () => {
    stopNativeSpeech();
    return { ok: true };
  });
  ipcMain.handle("speech:status", () => ({
    ok: true,
    platform: process.platform,
    nativeSpeech: ["darwin", "win32"].includes(process.platform),
    timeoutMs: SPEECH_TIMEOUT_MS,
  }));
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1100,
    minHeight: 720,
    title: "ALS 面部微动作 AAC",
    backgroundColor: "#080c14",
    autoHideMenuBar: process.platform !== "darwin",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: PRELOAD_PATH,
      sandbox: true,
    },
  });

  if (process.platform !== "darwin") {
    mainWindow.setMenuBarVisibility(false);
  }

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
    configureNativeSpeech();
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

  app.on("before-quit", () => {
    stopNativeSpeech();
  });
}
