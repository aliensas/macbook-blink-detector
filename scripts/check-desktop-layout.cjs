const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_INDEX = path.join(ROOT_DIR, "dist", "index.html");
const ARTIFACT_DIR = path.join(os.tmpdir(), "als-aac-layout-smoke");

const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1366, height: 720 },
  { width: 1280, height: 720 },
  { width: 1100, height: 720 },
];

const SCENARIOS = [
  {
    name: "waiting",
    setup: `
      document.querySelector("#messageText").textContent = "等待输入";
      document.querySelector("#codeBuffer").textContent = "--";
    `,
  },
  {
    name: "phrase",
    setup: `
      document.querySelector("#messageText").textContent = "我需要帮助，请过来一下";
      document.querySelector("#codeBuffer").textContent = "· ·";
    `,
  },
  {
    name: "secondary",
    setup: `
      document.querySelector("#patientSecondaryBar").hidden = false;
      document.querySelector("#patientSecondaryCurrent").textContent = "抬高枕头";
      document.querySelector("#patientSecondaryOptions").innerHTML =
        '<span class="patient-secondary-option is-active">抬高枕头</span><span class="patient-secondary-option">放低枕头</span><span class="patient-secondary-option">左侧卧</span>';
      document.querySelector("#messageText").textContent = "我想调整体位，请帮我选择";
      document.querySelector("#codeBuffer").textContent = "— ·";
    `,
  },
];

function assertDistExists() {
  if (!fs.existsSync(DIST_INDEX)) {
    console.error("dist/index.html not found. Run npm run build first.");
    process.exit(1);
  }
}

function rectScript(selector) {
  return `
    (() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    })()
  `;
}

async function measure(win, scenario) {
  await win.webContents.executeJavaScript(scenario.setup);

  return win.webContents.executeJavaScript(`
    (() => {
      const rect = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const value = element.getBoundingClientRect();
        return {
          top: Math.round(value.top),
          bottom: Math.round(value.bottom),
          left: Math.round(value.left),
          right: Math.round(value.right),
          width: Math.round(value.width),
          height: Math.round(value.height)
        };
      };
      const communication = document.querySelector(".communication-panel").getBoundingClientRect();
      const message = document.querySelector(".message-display").getBoundingClientRect();
      const speechStatus = document.querySelector("#speechStatus").getBoundingClientRect();
      return {
        viewport: { width: innerWidth, height: innerHeight },
        video: rect(".video-shell"),
        communication: rect(".communication-panel"),
        message: rect(".message-display"),
        speechStatus: rect("#speechStatus"),
        rightPanel: rect(".control-panel"),
        communicationFullyVisible: communication.top >= 0 && communication.bottom <= innerHeight,
        messageFullyVisible: message.top >= 0 && message.bottom <= innerHeight,
        speechStatusVisible: speechStatus.top >= 0 && speechStatus.bottom <= innerHeight,
        messageLargeEnough: message.height >= 100,
        communicationLargeEnough: communication.height >= 140
      };
    })()
  `);
}

async function captureFailure(win, name) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const image = await win.webContents.capturePage();
  const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
  fs.writeFileSync(filePath, image.toPNG());
  return filePath;
}

async function runScenario(viewport, scenario) {
  const win = new BrowserWindow({
    ...viewport,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#080c14",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  try {
    await win.loadURL(pathToFileURL(DIST_INDEX).toString());
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = await measure(win, scenario);
    const ok =
      result.communicationFullyVisible &&
      result.messageFullyVisible &&
      result.speechStatusVisible &&
      result.messageLargeEnough &&
      result.communicationLargeEnough;

    if (!ok) {
      const screenshot = await captureFailure(win, `${viewport.width}x${viewport.height}-${scenario.name}`);
      return { ok, viewport, scenario: scenario.name, result, screenshot };
    }

    return { ok, viewport, scenario: scenario.name, result };
  } finally {
    win.close();
  }
}

async function main() {
  assertDistExists();

  const failures = [];
  for (const viewport of VIEWPORTS) {
    for (const scenario of SCENARIOS) {
      const result = await runScenario(viewport, scenario);
      const label = `${viewport.width}x${viewport.height} ${scenario.name}`;
      if (result.ok) {
        console.log(`ok ${label}`);
      } else {
        console.error(`fail ${label}`);
        console.error(JSON.stringify(result, null, 2));
        failures.push(result);
      }
    }
  }

  if (failures.length) {
    console.error(`Layout smoke failed: ${failures.length} scenario(s). Screenshots: ${ARTIFACT_DIR}`);
    app.exit(1);
    return;
  }

  console.log("Desktop layout smoke passed.");
}

app.whenReady().then(main).then(() => app.quit()).catch((error) => {
  console.error(error);
  app.exit(1);
});
