import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { createIcons, Camera, Copy, Pause, Play, RotateCcw, Square, Trash2, Volume2 } from "lucide";
import "./styles.css";

createIcons({ icons: { Camera, Copy, Pause, Play, RotateCcw, Square, Trash2, Volume2 } });

const video = document.querySelector("#cameraVideo");
const canvas = document.querySelector("#overlayCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const resetButton = document.querySelector("#resetButton");
const runtimeStatus = document.querySelector("#runtimeStatus");
const videoEmpty = document.querySelector("#videoEmpty");
const cameraSelect = document.querySelector("#cameraSelect");
const thresholdRange = document.querySelector("#thresholdRange");
const thresholdValue = document.querySelector("#thresholdValue");
const holdFramesRange = document.querySelector("#holdFramesRange");
const holdFramesValue = document.querySelector("#holdFramesValue");
const overlayToggle = document.querySelector("#overlayToggle");
const diagnosticPanel = document.querySelector("#diagnosticPanel");
const diagnosticTitle = document.querySelector("#diagnosticTitle");
const diagnosticMessage = document.querySelector("#diagnosticMessage");
const copyUrlButton = document.querySelector("#copyUrlButton");
const blinkCount = document.querySelector("#blinkCount");
const blinkState = document.querySelector("#blinkState");
const earValue = document.querySelector("#earValue");
const fpsValue = document.querySelector("#fpsValue");
const earBar = document.querySelector("#earBar");
const confidenceLabel = document.querySelector("#confidenceLabel");
const eventLog = document.querySelector("#eventLog");
const messageText = document.querySelector("#messageText");
const codeBuffer = document.querySelector("#codeBuffer");
const repeatSpeechButton = document.querySelector("#repeatSpeechButton");
const clearSpeechButton = document.querySelector("#clearSpeechButton");
const pauseRecognitionButton = document.querySelector("#pauseRecognitionButton");
const blinkCodeToggle = document.querySelector("#blinkCodeToggle");
const browToggle = document.querySelector("#browToggle");
const mouthToggle = document.querySelector("#mouthToggle");
const smileToggle = document.querySelector("#smileToggle");
const headShakeToggle = document.querySelector("#headShakeToggle");
const ttsToggle = document.querySelector("#ttsToggle");
const lastGesture = document.querySelector("#lastGesture");
const browMeter = document.querySelector("#browMeter");
const browValue = document.querySelector("#browValue");
const mouthMeter = document.querySelector("#mouthMeter");
const mouthValue = document.querySelector("#mouthValue");
const smileMeter = document.querySelector("#smileMeter");
const smileValue = document.querySelector("#smileValue");
const headMeter = document.querySelector("#headMeter");
const headValue = document.querySelector("#headValue");
const calibrationStatus = document.querySelector("#calibrationStatus");
const calibrationTitle = document.querySelector("#calibrationTitle");
const calibrationInstruction = document.querySelector("#calibrationInstruction");
const calibrationProgress = document.querySelector("#calibrationProgress");
const calibrationStartButton = document.querySelector("#calibrationStartButton");
const calibrationCollectButton = document.querySelector("#calibrationCollectButton");
const calibrationNextButton = document.querySelector("#calibrationNextButton");
const calibrationResetButton = document.querySelector("#calibrationResetButton");
const openEarResult = document.querySelector("#openEarResult");
const closedEarResult = document.querySelector("#closedEarResult");
const calibratedThresholdResult = document.querySelector("#calibratedThresholdResult");
const shortBlinkResult = document.querySelector("#shortBlinkResult");
const longBlinkResult = document.querySelector("#longBlinkResult");
const guidedTestSelect = document.querySelector("#guidedTestSelect");
const guidedTestButton = document.querySelector("#guidedTestButton");
const guidedTestStatus = document.querySelector("#guidedTestStatus");

const MODEL_URL = "/mediapipe/models/face_landmarker.task";
const WASM_URL = "/mediapipe/wasm";

const BUILT_IN_CAMERA_HINTS = [
  "macbook",
  "facetime",
  "built-in",
  "built in",
  "内置",
  "hd camera",
];

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176,
  149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];
const LEFT_BROW_UPPER = [300, 293, 334, 296, 336];
const LEFT_BROW_LOWER = [276, 283, 282, 295, 285];
const RIGHT_BROW_UPPER = [70, 63, 105, 66, 107];
const RIGHT_BROW_LOWER = [46, 53, 52, 65, 55];
const OUTER_LIP = [
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146,
];
const INNER_LIP = [
  78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95,
];
const FACE_CENTER_LINE = [10, 9, 8, 168, 6, 197, 195, 5, 4, 1, 2, 164, 0, 17, 18, 200, 199, 175, 152];
const MOUTH_OPEN_POINTS = [13, 14];
const HEAD_YAW_POINTS = [1, 33, 263];

const BLINK_SYMBOLS = {
  shortMinMs: 100,
  shortMaxMs: 500,
  longMinMs: 700,
  longMaxMs: 2000,
  restMinMs: 2500,
  decodeDelayMs: 1200,
};

const DIRECT_BLINK_CODES = {
  "..": { text: "我需要喝水或润口", speak: true },
  "...": { text: "紧急求助，请马上查看", speak: true },
  "--": { text: "我想休息，暂停识别 5 分钟", speak: true, pauseMs: 5 * 60 * 1000 },
};

const CONFIRMATION_BLINK_CODES = {
  ".-": {
    label: "口腔护理确认",
    prompt: "检测到可能需要口腔护理。连续两次短眨确认，长闭眼取消。",
    confirmedText: "我可能有口腔不适，请查看是否需要润口、清理口腔或吸痰。",
  },
  "-.": {
    label: "体位调整确认",
    prompt: "检测到可能需要调整体位。连续两次短眨确认，长闭眼取消。",
    confirmedText: "请帮我检查并调整体位。",
  },
};

const GESTURE_MESSAGES = {
  BROW_RAISE: "抬眉确认",
  MOUTH_OPEN: "张嘴吸痰",
  SMILE: "微笑表达",
  HEAD_SHAKE: "摇头取消",
};

const CONFIRMATION_TIMEOUT_MS = 10 * 1000;
const MOUTH_DOUBLE_WINDOW_MS = 4000;
const CALIBRATION_STEPS = [
  {
    id: "position",
    title: "1. 准备画面",
    instruction: "确认人脸完整、面部描边贴合、光线稳定。完成后进入下一步。",
    kind: "check",
  },
  {
    id: "open",
    title: "2. 自然睁眼基线",
    instruction: "保持自然睁眼 3 秒，系统会采集 EAR 基线。",
    kind: "ear",
    sampleKey: "openEar",
    durationMs: 3000,
  },
  {
    id: "closed",
    title: "3. 轻闭眼基线",
    instruction: "轻轻闭眼 2 秒，系统会采集闭眼 EAR，并更新眨眼阈值。",
    kind: "ear",
    sampleKey: "closedEar",
    durationMs: 2000,
  },
  {
    id: "short",
    title: "4. 主动短眨样本",
    instruction: "做 5 次低疲劳短眨，每次间隔约 1 秒。",
    kind: "blink",
    sampleKey: "shortBlinkDurations",
    targetCount: 5,
  },
  {
    id: "long",
    title: "5. 长闭眼样本",
    instruction: "做 2 次可控长闭眼，不要勉强。",
    kind: "blink",
    sampleKey: "longBlinkDurations",
    targetCount: 2,
  },
  {
    id: "review",
    title: "6. 测试短码",
    instruction: "选择下方测试项，按目标动作输入，系统会记录是否匹配。",
    kind: "test",
  },
];

const state = {
  faceLandmarker: null,
  stream: null,
  starting: false,
  running: false,
  rafId: 0,
  lastVideoTime: -1,
  selectedDeviceId: "",
  blinkTotal: 0,
  closedFrames: 0,
  openFrames: 0,
  blinkArmed: true,
  blinkClosedAt: null,
  blinkWasClosed: false,
  blinkCodeBuffer: [],
  blinkDecodeTimer: 0,
  blinkCodeOverflow: false,
  fpsSamples: [],
  lastFrameAt: 0,
  cameraLabelsReady: false,
  pausedUntil: 0,
  lastPhrase: "等待输入",
  pendingConfirmation: null,
  sessionEvents: [],
  signalBaseline: {
    ready: false,
    browUp: 0,
    mouthOpen: 0,
    smile: 0,
  },
  gestureSequences: {
    mouthOpenTimes: [],
  },
  calibration: {
    active: false,
    stepIndex: 0,
    collecting: false,
    collectStartedAt: 0,
    completedStepIds: [],
    activeTestCode: "",
    samples: {
      openEar: [],
      closedEar: [],
      shortBlinkDurations: [],
      longBlinkDurations: [],
    },
  },
};

function setStatus(label, mode = "idle") {
  runtimeStatus.innerHTML = `<span class="dot dot-${mode}"></span><span>${label}</span>`;
}

function addLog(message) {
  state.sessionEvents.push({
    time: new Date().toISOString(),
    message,
    mode: state.pendingConfirmation ? "confirm" : state.pausedUntil > performance.now() ? "paused" : "direct",
  });

  if (state.sessionEvents.length > 300) {
    state.sessionEvents.shift();
  }

  const item = document.createElement("div");
  item.className = "event";
  item.textContent = `${new Date().toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}  ${message}`;
  eventLog.prepend(item);

  while (eventLog.children.length > 5) {
    eventLog.lastElementChild.remove();
  }
}

function hideDiagnostic() {
  diagnosticPanel.classList.add("hidden");
  diagnosticTitle.textContent = "";
  diagnosticMessage.textContent = "";
}

function showDiagnostic(title, message) {
  diagnosticTitle.textContent = title;
  diagnosticMessage.textContent = message;
  diagnosticPanel.classList.remove("hidden");
}

function setControlsBusy(isBusy) {
  startButton.disabled = isBusy;
  cameraSelect.disabled = isBusy;
  stopButton.disabled = isBusy || !state.running;
}

function resetDetectionWindow() {
  state.closedFrames = 0;
  state.openFrames = 0;
  state.blinkArmed = true;
  state.blinkClosedAt = null;
  state.blinkWasClosed = false;
}

function resetLiveMetrics(status = "未检测") {
  blinkState.textContent = status;
  earValue.textContent = "--";
  fpsValue.textContent = "--";
  confidenceLabel.textContent = "--";
  lastGesture.textContent = "--";
  earBar.style.width = "0%";
  updateGestureMeters({ browUp: 0, mouthOpen: 0, smile: 0, headYaw: 0 });
}

function resetSignalBaseline() {
  state.signalBaseline.ready = false;
  state.signalBaseline.browUp = 0;
  state.signalBaseline.mouthOpen = 0;
  state.signalBaseline.smile = 0;
}

function resetGestureSequences() {
  state.gestureSequences.mouthOpenTimes = [];
}

function median(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setCommunicationMessage(text, gestureLabel = "") {
  state.lastPhrase = text;
  messageText.textContent = text;
  if (gestureLabel) {
    lastGesture.textContent = gestureLabel;
  }
}

function cancelSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function speak(text = state.lastPhrase) {
  if (!ttsToggle.checked || !("speechSynthesis" in window) || !text || text === "等待输入") {
    return;
  }

  cancelSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function announce(text, gestureLabel, { shouldSpeak = true } = {}) {
  setCommunicationMessage(text, gestureLabel);
  if (shouldSpeak) {
    speak(text);
  }
  addLog(`${gestureLabel ? `${gestureLabel}：` : ""}${text}`);
}

function updateCodeBuffer() {
  if (state.blinkCodeBuffer.length === 0) {
    codeBuffer.textContent = "--";
    return;
  }

  codeBuffer.textContent = state.blinkCodeBuffer.map((symbol) => (symbol === "." ? "·" : "—")).join(" ");
}

function clearBlinkCodeBuffer() {
  window.clearTimeout(state.blinkDecodeTimer);
  state.blinkCodeBuffer = [];
  state.blinkCodeOverflow = false;
  updateCodeBuffer();
}

function displayBlinkCode(code) {
  return code.replaceAll(".", "·").replaceAll("-", "—");
}

function currentCalibrationStep() {
  return CALIBRATION_STEPS[state.calibration.stepIndex] || CALIBRATION_STEPS[0];
}

function isCalibrationStepComplete(stepId) {
  return state.calibration.completedStepIds.includes(stepId);
}

function markCalibrationStepComplete(stepId) {
  if (!isCalibrationStepComplete(stepId)) {
    state.calibration.completedStepIds.push(stepId);
  }
}

function formatMsMedian(values) {
  const value = median(values);
  return value === null ? "--" : `${Math.round(value)}ms`;
}

function hasCompletedCoreCalibration() {
  return ["open", "closed", "short", "long"].every((stepId) => isCalibrationStepComplete(stepId));
}

function updateCalibrationSummary() {
  const openEar = median(state.calibration.samples.openEar);
  const closedEar = median(state.calibration.samples.closedEar);
  openEarResult.textContent = openEar === null ? "--" : openEar.toFixed(3);
  closedEarResult.textContent = closedEar === null ? "--" : closedEar.toFixed(3);
  shortBlinkResult.textContent =
    state.calibration.samples.shortBlinkDurations.length === 0
      ? "--"
      : `${state.calibration.samples.shortBlinkDurations.length} / ${formatMsMedian(state.calibration.samples.shortBlinkDurations)}`;
  longBlinkResult.textContent =
    state.calibration.samples.longBlinkDurations.length === 0
      ? "--"
      : `${state.calibration.samples.longBlinkDurations.length} / ${formatMsMedian(state.calibration.samples.longBlinkDurations)}`;
}

function updateCalibrationUI() {
  const step = currentCalibrationStep();
  const complete = isCalibrationStepComplete(step.id);
  const canAdvance =
    state.calibration.active &&
    !state.calibration.collecting &&
    complete &&
    state.calibration.stepIndex < CALIBRATION_STEPS.length - 1;
  calibrationStatus.textContent = state.calibration.active
    ? `${state.calibration.stepIndex + 1}/${CALIBRATION_STEPS.length}${state.calibration.collecting ? " 采集中" : ""}`
    : "未开始";
  calibrationTitle.textContent = step.title;
  calibrationInstruction.textContent = step.instruction;
  calibrationProgress.style.width = complete ? "100%" : "0%";
  calibrationCollectButton.disabled =
    !state.calibration.active || state.calibration.collecting || step.kind === "check" || step.kind === "test";
  calibrationNextButton.disabled = !canAdvance;
  updateCalibrationSummary();
}

function resetCalibration() {
  cancelSpeech();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  resetGestureSequences();
  state.calibration.active = false;
  state.calibration.stepIndex = 0;
  state.calibration.collecting = false;
  state.calibration.collectStartedAt = 0;
  state.calibration.completedStepIds = [];
  state.calibration.activeTestCode = "";
  state.calibration.samples.openEar = [];
  state.calibration.samples.closedEar = [];
  state.calibration.samples.shortBlinkDurations = [];
  state.calibration.samples.longBlinkDurations = [];
  calibratedThresholdResult.textContent = "--";
  guidedTestStatus.textContent = "未开始测试";
  updateCalibrationUI();
  addLog("引导校准已重置");
}

function startCalibrationGuide() {
  cancelSpeech();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  resetGestureSequences();
  state.calibration.active = true;
  state.calibration.stepIndex = 0;
  state.calibration.collecting = false;
  state.calibration.collectStartedAt = 0;
  state.calibration.completedStepIds = [];
  state.calibration.activeTestCode = "";
  state.calibration.samples.openEar = [];
  state.calibration.samples.closedEar = [];
  state.calibration.samples.shortBlinkDurations = [];
  state.calibration.samples.longBlinkDurations = [];
  calibratedThresholdResult.textContent = "--";
  guidedTestStatus.textContent = "未开始测试";
  markCalibrationStepComplete("position");
  updateCalibrationUI();
  addLog("引导校准已开始");
}

function moveToNextCalibrationStep() {
  if (!state.calibration.active) {
    startCalibrationGuide();
    return;
  }

  const step = currentCalibrationStep();
  if (state.calibration.collecting) {
    addLog("采集中，暂不能进入下一步");
    return;
  }

  if (!isCalibrationStepComplete(step.id)) {
    addLog("当前校准步骤尚未完成");
    return;
  }

  state.calibration.collecting = false;
  state.calibration.stepIndex = Math.min(state.calibration.stepIndex + 1, CALIBRATION_STEPS.length - 1);
  updateCalibrationUI();
}

function beginCalibrationCollection() {
  if (!state.running) {
    addLog("请先启动摄像头再采集校准样本");
    return;
  }

  const step = currentCalibrationStep();
  if (step.kind === "check" || step.kind === "test") {
    return;
  }

  state.calibration.active = true;
  state.calibration.collecting = true;
  state.calibration.collectStartedAt = performance.now();
  if (step.sampleKey) {
    state.calibration.samples[step.sampleKey] = [];
  }
  calibrationProgress.style.width = "0%";
  addLog(`开始采集：${step.title}`);
  updateCalibrationUI();
}

function applyCalibratedThreshold() {
  const openEar = median(state.calibration.samples.openEar);
  const closedEar = median(state.calibration.samples.closedEar);

  if (openEar === null || closedEar === null) {
    return;
  }

  const gap = openEar - closedEar;
  if (gap < 0.035) {
    calibratedThresholdResult.textContent = "差异不足";
    addLog("睁眼/闭眼 EAR 差异不足，未更新阈值");
    return;
  }

  const minThreshold = Number(thresholdRange.min);
  const maxThreshold = Number(thresholdRange.max);
  const calibrated = clamp((openEar + closedEar) / 2, minThreshold, maxThreshold);
  thresholdRange.value = calibrated.toFixed(2);
  thresholdValue.textContent = calibrated.toFixed(2);
  calibratedThresholdResult.textContent = calibrated.toFixed(3);
  addLog(`校准阈值已更新：${calibrated.toFixed(3)}`);
}

function finishCalibrationCollection() {
  const step = currentCalibrationStep();
  state.calibration.collecting = false;
  markCalibrationStepComplete(step.id);
  if (step.id === "closed") {
    applyCalibratedThreshold();
  }
  updateCalibrationUI();
  addLog(`完成采集：${step.title}`);
}

function collectCalibrationFrame(signals, now) {
  const step = currentCalibrationStep();
  if (!state.calibration.collecting || step.kind !== "ear" || signals.ear === null) {
    return;
  }

  state.calibration.samples[step.sampleKey].push(signals.ear);
  const progress = clamp((now - state.calibration.collectStartedAt) / step.durationMs, 0, 1);
  calibrationProgress.style.width = `${Math.round(progress * 100)}%`;

  if (progress >= 1) {
    finishCalibrationCollection();
  }
}

function recordCalibrationBlink(symbol, duration) {
  const step = currentCalibrationStep();
  if (!state.calibration.collecting || step.kind !== "blink") {
    return;
  }

  if (step.id === "short" && symbol !== ".") {
    return;
  }

  if (step.id === "long" && symbol !== "-") {
    return;
  }

  state.calibration.samples[step.sampleKey].push(duration);
  const count = state.calibration.samples[step.sampleKey].length;
  calibrationProgress.style.width = `${Math.round((count / step.targetCount) * 100)}%`;
  updateCalibrationSummary();

  if (count >= step.targetCount) {
    finishCalibrationCollection();
  }
}

function startGuidedTest() {
  if (!state.running) {
    guidedTestStatus.textContent = "请先启动摄像头";
    addLog("请先启动摄像头再测试短码");
    return;
  }

  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  resetGestureSequences();
  state.calibration.activeTestCode = guidedTestSelect.value;
  guidedTestStatus.textContent = `等待输入：${displayBlinkCode(state.calibration.activeTestCode)}`;
  addLog(`开始测试短码 ${state.calibration.activeTestCode}`);
}

function recordGuidedTestCode(code, { overflowed = false } = {}) {
  if (!state.calibration.activeTestCode) {
    return false;
  }

  const expected = state.calibration.activeTestCode;
  const ok = !overflowed && code === expected;
  guidedTestStatus.textContent = ok
    ? `通过：收到 ${displayBlinkCode(code)}`
    : `不匹配：期望 ${displayBlinkCode(expected)}，收到 ${overflowed ? "过长短码" : displayBlinkCode(code)}`;
  addLog(`短码测试${ok ? "通过" : "不匹配"}：${expected} / ${overflowed ? "overflow" : code}`);
  state.calibration.activeTestCode = "";
  return true;
}

function clearPendingConfirmation() {
  state.pendingConfirmation = null;
}

function confirmPendingGesture(label) {
  const pending = getActiveConfirmation();
  if (!pending) {
    return false;
  }

  clearPendingConfirmation();
  announce(pending.confirmedText, `${pending.label}${label}确认`, { shouldSpeak: true });
  return true;
}

function cancelPendingGesture(label) {
  const pending = getActiveConfirmation();
  if (!pending) {
    return false;
  }

  clearPendingConfirmation();
  announce("已取消", `${pending.label}${label}取消`, { shouldSpeak: true });
  return true;
}

function getActiveConfirmation(now = performance.now()) {
  if (!state.pendingConfirmation) {
    return null;
  }

  if (now <= state.pendingConfirmation.expiresAt) {
    return state.pendingConfirmation;
  }

  addLog(`${state.pendingConfirmation.label}超时，已取消`);
  clearPendingConfirmation();
  setCommunicationMessage("确认超时，已取消", "确认");
  return null;
}

function startConfirmation(config) {
  state.pendingConfirmation = {
    ...config,
    expiresAt: performance.now() + CONFIRMATION_TIMEOUT_MS,
  };
  announce(config.prompt, config.label, { shouldSpeak: true });
}

function resolvePendingConfirmation(code) {
  const pending = getActiveConfirmation();
  if (!pending) {
    return false;
  }

  if (code === "..") {
    clearPendingConfirmation();
    announce(pending.confirmedText, `${pending.label}已确认`, { shouldSpeak: true });
    return true;
  }

  if (code === ".") {
    setCommunicationMessage("单次短眨已忽略，请连续两次短眨确认，长闭眼取消。", pending.label);
    addLog(`${pending.label}：单次短眨已忽略`);
    return true;
  }

  if (code === "-") {
    clearPendingConfirmation();
    setCommunicationMessage("已取消", `${pending.label}已取消`);
    addLog(`${pending.label}：已取消`);
    return true;
  }

  setCommunicationMessage("确认未识别：请连续两次短眨确认，长闭眼取消。", pending.label);
  addLog(`${pending.label}：未识别确认短码 ${code}`);
  return true;
}

function decodeBlinkCode() {
  const code = state.blinkCodeBuffer.join("");
  const overflowed = state.blinkCodeOverflow;
  clearBlinkCodeBuffer();

  if (!code) {
    return;
  }

  if (overflowed) {
    if (recordGuidedTestCode(code, { overflowed: true })) {
      return;
    }
    setCommunicationMessage("短码过长，已忽略", "短码");
    addLog(`短码过长 ${code}，已忽略`);
    return;
  }

  if (recordGuidedTestCode(code)) {
    return;
  }

  if (resolvePendingConfirmation(code)) {
    return;
  }

  if (code === ".") {
    addLog("忽略单次短眨");
    return;
  }

  if (code === "-") {
    addLog("忽略单次长闭眼（仅确认场景中用于取消）");
    return;
  }

  const confirmation = CONFIRMATION_BLINK_CODES[code];
  if (confirmation) {
    if (!hasCompletedCoreCalibration()) {
      setCommunicationMessage(`短码 ${displayBlinkCode(code)} 已识别；完成引导校准后才进入确认流程。`, "未校准");
      addLog(`短码 ${displayBlinkCode(code)} 已识别，因未完成引导校准而未进入确认流程`);
      return;
    }

    startConfirmation(confirmation);
    return;
  }

  const phrase = DIRECT_BLINK_CODES[code];
  if (phrase) {
    if (!hasCompletedCoreCalibration()) {
      setCommunicationMessage(`短码 ${displayBlinkCode(code)} 已识别；完成引导校准后才播报短语。`, "未校准");
      addLog(`短码 ${displayBlinkCode(code)} 已识别，因未完成引导校准而未播报`);
      return;
    }

    announce(phrase.text, `短码 ${displayBlinkCode(code)}`, {
      shouldSpeak: phrase.speak,
    });

    if (phrase.pauseMs) {
      pauseRecognition(phrase.pauseMs, { preserveMessage: true });
    }
    return;
  }

  setCommunicationMessage(`未识别编码：${displayBlinkCode(code)}`, "短码");
  addLog(`未识别短码 ${code}`);
}

function enqueueBlinkSymbol(symbol) {
  if (!blinkCodeToggle.checked || isRecognitionPaused(performance.now())) {
    return;
  }

  state.blinkCodeBuffer.push(symbol);
  if (state.blinkCodeBuffer.length > 3) {
    state.blinkCodeOverflow = true;
  }

  updateCodeBuffer();
  window.clearTimeout(state.blinkDecodeTimer);
  state.blinkDecodeTimer = window.setTimeout(decodeBlinkCode, BLINK_SYMBOLS.decodeDelayMs);
}

function pauseRecognition(durationMs = 5 * 60 * 1000, { preserveMessage = false } = {}) {
  state.pausedUntil = performance.now() + durationMs;
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  resetGestureSequences();
  resetDetectionWindow();
  pauseRecognitionButton.querySelector("span").textContent = "继续";
  if (!preserveMessage) {
    setCommunicationMessage("识别已暂停", "休息");
  }
}

function resumeRecognition() {
  state.pausedUntil = 0;
  clearPendingConfirmation();
  pauseRecognitionButton.querySelector("span").textContent = "暂停";
  setCommunicationMessage("等待输入", "继续");
}

function isRecognitionPaused(now = performance.now()) {
  if (state.pausedUntil === 0) {
    return false;
  }

  if (now >= state.pausedUntil) {
    resumeRecognition();
    return false;
  }

  return true;
}

function createHoldDetector({ name, threshold, minHoldMs, cooldownMs, onTrigger }) {
  let active = false;
  let startedAt = 0;
  let peakValue = 0;
  let lastTriggerAt = 0;

  return {
    reset() {
      active = false;
      startedAt = 0;
      peakValue = 0;
    },
    update(value, now, enabled) {
      if (!enabled || isRecognitionPaused(now)) {
        this.reset();
        return;
      }

      if (value >= threshold) {
        if (!active) {
          active = true;
          startedAt = now;
          peakValue = value;
        } else {
          peakValue = Math.max(peakValue, value);
        }
        return;
      }

      if (!active) {
        return;
      }

      const duration = now - startedAt;
      active = false;

      if (duration >= minHoldMs && now - lastTriggerAt >= cooldownMs) {
        lastTriggerAt = now;
        onTrigger({ name, duration, value: peakValue });
      }
    },
  };
}

const gestureDetectors = {
  brow: createHoldDetector({
    name: "BROW_RAISE",
    threshold: 0.2,
    minHoldMs: 500,
    cooldownMs: 1800,
    onTrigger: (event) => handleGestureEvent(event, "抬眉"),
  }),
  mouth: createHoldDetector({
    name: "MOUTH_OPEN",
    threshold: 0.32,
    minHoldMs: 800,
    cooldownMs: 700,
    onTrigger: (event) => handleGestureEvent(event, "张嘴"),
  }),
  smile: createHoldDetector({
    name: "SMILE",
    threshold: 0.28,
    minHoldMs: 500,
    cooldownMs: 2500,
    onTrigger: (event) => handleGestureEvent(event, "微笑"),
  }),
};

const headShakeDetector = {
  direction: "",
  changeCount: 0,
  windowStartedAt: 0,
  lastTriggerAt: 0,
  reset() {
    this.direction = "";
    this.changeCount = 0;
    this.windowStartedAt = 0;
  },
  update(yaw, now, enabled) {
    if (!enabled || isRecognitionPaused(now)) {
      this.reset();
      return;
    }

    const direction = yaw > 0.09 ? "right" : yaw < -0.09 ? "left" : "";
    if (!direction) {
      if (this.windowStartedAt && now - this.windowStartedAt > 1700) {
        this.reset();
      }
      return;
    }

    if (!this.direction) {
      this.direction = direction;
      this.windowStartedAt = now;
      return;
    }

    if (direction !== this.direction) {
      this.direction = direction;
      this.changeCount += 1;
    }

    if (this.changeCount >= 2 && now - this.windowStartedAt <= 2200 && now - this.lastTriggerAt >= 1800) {
      const duration = now - this.windowStartedAt;
      const peakValue = Math.abs(yaw);
      this.lastTriggerAt = now;
      this.reset();
      handleGestureEvent({ name: "HEAD_SHAKE", duration, value: peakValue }, "摇头");
    }

    if (this.windowStartedAt && now - this.windowStartedAt > 2200) {
      this.reset();
    }
  },
};

function handleGestureEvent(event, label) {
  const message = GESTURE_MESSAGES[event.name];
  if (!message) {
    return;
  }

  if (state.calibration.activeTestCode) {
    setCommunicationMessage(`短码测试中，${label}动作已记录但不执行。`, `${label}测试保护`);
    addLog(`${label}动作：短码测试中未执行`);
    return;
  }

  if (!hasCompletedCoreCalibration()) {
    setCommunicationMessage(`检测到${label}；完成引导校准后才启用动作映射。`, `${label}候选`);
    addLog(`${label}候选：${Math.round(event.duration)}ms，峰值 ${(event.value || 0).toFixed(2)}，未校准未播报`);
    return;
  }

  if (event.name === "BROW_RAISE") {
    if (confirmPendingGesture(label)) {
      return;
    }
    announce("确认", message, { shouldSpeak: true });
    return;
  }

  if (event.name === "MOUTH_OPEN") {
    const now = performance.now();
    state.gestureSequences.mouthOpenTimes = state.gestureSequences.mouthOpenTimes.filter(
      (time) => now - time <= MOUTH_DOUBLE_WINDOW_MS,
    );
    state.gestureSequences.mouthOpenTimes.push(now);

    if (state.gestureSequences.mouthOpenTimes.length < 2) {
      setCommunicationMessage("张嘴一次已记录，请在 4 秒内再次张嘴触发吸痰提示。", message);
      addLog(`${label} 1/2：${Math.round(event.duration)}ms，等待第二次张嘴`);
      return;
    }

    resetGestureSequences();
    announce("我需要吸痰，请马上查看。", "张嘴两次", { shouldSpeak: true });
    return;
  }

  if (event.name === "SMILE") {
    announce("谢谢，可以，我还好。", message, { shouldSpeak: true });
    return;
  }

  if (event.name === "HEAD_SHAKE") {
    if (cancelPendingGesture(label)) {
      return;
    }
    announce("否，不是，取消。", message, { shouldSpeak: true });
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function hasLandmarkIndices(landmarks, indices) {
  return indices.every((index) => {
    const point = landmarks[index];
    return point && Number.isFinite(point.x) && Number.isFinite(point.y);
  });
}

function eyeAspectRatio(landmarks, points) {
  if (!hasLandmarkIndices(landmarks, points)) {
    return null;
  }

  const [p1, p2, p3, p4, p5, p6] = points.map((index) => landmarks[index]);
  const horizontalDistance = distance(p1, p4);

  if (horizontalDistance === 0) {
    return null;
  }

  return (distance(p2, p6) + distance(p3, p5)) / (2 * horizontalDistance);
}

function averageEyeAspectRatio(landmarks) {
  const leftEyeRatio = eyeAspectRatio(landmarks, LEFT_EYE);
  const rightEyeRatio = eyeAspectRatio(landmarks, RIGHT_EYE);

  if (leftEyeRatio === null || rightEyeRatio === null) {
    return null;
  }

  return (leftEyeRatio + rightEyeRatio) / 2;
}

function normalizedLandmarkDistance(landmarks, points) {
  if (!hasLandmarkIndices(landmarks, points)) {
    return null;
  }

  return distance(landmarks[points[0]], landmarks[points[1]]);
}

function getBlendshapeScore(result, name) {
  const categories = result.faceBlendshapes?.[0]?.categories || [];
  return categories.find((category) => category.categoryName === name)?.score ?? 0;
}

function estimateHeadYaw(landmarks) {
  if (!hasLandmarkIndices(landmarks, HEAD_YAW_POINTS)) {
    return 0;
  }

  const nose = landmarks[1];
  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];
  const eyeCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const eyeWidth = Math.abs(rightEyeOuter.x - leftEyeOuter.x);

  if (eyeWidth === 0) {
    return 0;
  }

  return Math.max(-1, Math.min(1, (nose.x - eyeCenterX) / eyeWidth));
}

function faceReferenceWidth(landmarks) {
  if (!hasLandmarkIndices(landmarks, [33, 263])) {
    return 0;
  }

  return Math.abs(landmarks[263].x - landmarks[33].x);
}

function extractFaceSignals(result, landmarks) {
  if (!landmarks) {
    return {
      hasFace: false,
      ear: null,
      browUp: 0,
      mouthOpen: 0,
      smile: 0,
      headYaw: 0,
    };
  }

  const mouthDistance = normalizedLandmarkDistance(landmarks, MOUTH_OPEN_POINTS) ?? 0;
  const referenceWidth = faceReferenceWidth(landmarks);
  const mouthOpenRatio = referenceWidth > 0 ? mouthDistance / referenceWidth : 0;
  const mouthOpenFallback = Math.min(Math.max((mouthOpenRatio - 0.04) / 0.22, 0), 1);
  const mouthOpen = Math.max(getBlendshapeScore(result, "jawOpen"), mouthOpenFallback);

  return {
    hasFace: true,
    ear: averageEyeAspectRatio(landmarks),
    browUp: Math.max(
      getBlendshapeScore(result, "browInnerUp"),
      getBlendshapeScore(result, "browOuterUpLeft"),
      getBlendshapeScore(result, "browOuterUpRight"),
    ),
    mouthOpen,
    smile: Math.max(getBlendshapeScore(result, "mouthSmileLeft"), getBlendshapeScore(result, "mouthSmileRight")),
    headYaw: estimateHeadYaw(landmarks),
  };
}

function updateSignalBaseline(signals) {
  if (!signals.hasFace) {
    resetSignalBaseline();
    return signals;
  }

  const baseline = state.signalBaseline;
  if (!baseline.ready) {
    baseline.ready = true;
    baseline.browUp = signals.browUp;
    baseline.mouthOpen = signals.mouthOpen;
    baseline.smile = signals.smile;
  } else {
    baseline.browUp += (signals.browUp - baseline.browUp) * 0.015;
    baseline.mouthOpen += (signals.mouthOpen - baseline.mouthOpen) * 0.01;
    baseline.smile += (signals.smile - baseline.smile) * 0.01;
  }

  return {
    ...signals,
    browUp: Math.max(0, signals.browUp - baseline.browUp),
    mouthOpen: Math.max(0, signals.mouthOpen - baseline.mouthOpen),
    smile: Math.max(0, signals.smile - baseline.smile),
  };
}

function updateGestureMeters(signals) {
  const yawValue = Math.min(Math.abs(signals.headYaw || 0) * 2.5, 1);
  browMeter.value = signals.browUp || 0;
  mouthMeter.value = signals.mouthOpen || 0;
  smileMeter.value = signals.smile || 0;
  headMeter.value = yawValue;
  browValue.textContent = (signals.browUp || 0).toFixed(2);
  mouthValue.textContent = (signals.mouthOpen || 0).toFixed(2);
  smileValue.textContent = (signals.smile || 0).toFixed(2);
  headValue.textContent = Math.abs(signals.headYaw || 0).toFixed(2);
}

function chooseBuiltInCamera(devices) {
  return (
    devices.find((device) => {
      const label = device.label.toLowerCase();
      return BUILT_IN_CAMERA_HINTS.some((hint) => label.includes(hint));
    }) || devices[0]
  );
}

async function enumerateCameras(preferredDeviceId = "") {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter((device) => device.kind === "videoinput");
  state.cameraLabelsReady = cameras.some((device) => Boolean(device.label));

  cameraSelect.innerHTML = "";

  if (cameras.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "没有可用摄像头";
    cameraSelect.append(option);
    state.selectedDeviceId = "";
    return cameras;
  }

  cameras.forEach((device, index) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.textContent = device.label || `摄像头 ${index + 1}`;
    cameraSelect.append(option);
  });

  if (!state.cameraLabelsReady && !preferredDeviceId) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "授权后显示摄像头名称";
    option.selected = true;
    cameraSelect.prepend(option);
  }

  const preferred =
    cameras.find((device) => device.deviceId === preferredDeviceId) ||
    (state.cameraLabelsReady ? chooseBuiltInCamera(cameras) : cameras[0]);

  state.selectedDeviceId = state.cameraLabelsReady ? preferred.deviceId : preferredDeviceId;
  cameraSelect.value = state.selectedDeviceId;
  return cameras;
}

async function refreshCameraList({ preserveSelection = true, shouldLog = false } = {}) {
  if (!navigator.mediaDevices?.enumerateDevices) {
    throw new Error("浏览器不支持摄像头枚举");
  }

  const preferredDeviceId = preserveSelection ? state.selectedDeviceId : "";
  const cameras = await enumerateCameras(preferredDeviceId);
  if (shouldLog) {
    addLog(`摄像头列表已更新（${cameras.length} 个）`);
  }

  return cameras;
}

function cameraConstraints(deviceId = "") {
  const base = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 60 },
  };

  if (deviceId) {
    return {
      video: {
        ...base,
        deviceId: { exact: deviceId },
      },
      audio: false,
    };
  }

  return {
    video: {
      ...base,
      facingMode: "user",
    },
    audio: false,
  };
}

async function getInitialPermission() {
  const stream = await navigator.mediaDevices.getUserMedia(cameraConstraints());
  stream.getTracks().forEach((track) => track.stop());
}

function waitForVideoMetadata() {
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      reject(new Error("等待摄像头画面超时"));
    }, 6000);

    function handleLoadedMetadata() {
      window.clearTimeout(timer);
      resolve();
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
  });
}

async function setupFaceLandmarker() {
  if (state.faceLandmarker) {
    return state.faceLandmarker;
  }

  setStatus("加载模型", "loading");
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const options = {
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  };

  try {
    state.faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
      ...options,
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
    });
  } catch (error) {
    console.warn("GPU delegate unavailable, falling back to CPU.", error);
    try {
      state.faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        ...options,
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "CPU",
        },
      });
    } catch (cpuError) {
      const modelError = new Error(cpuError.message || "模型加载失败");
      modelError.name = "ModelLoadError";
      modelError.cause = cpuError;
      throw modelError;
    }
  }

  return state.faceLandmarker;
}

async function startCamera(deviceId = state.selectedDeviceId) {
  if (state.starting) {
    addLog("摄像头正在启动");
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("浏览器不支持", "error");
    addLog("当前浏览器无法访问摄像头");
    showDiagnostic(
      "当前浏览器不支持摄像头",
      `请用 Chrome 或 Safari 打开 ${window.location.href}，再允许摄像头权限。`,
    );
    return;
  }

  state.starting = true;
  setControlsBusy(true);
  setStatus("请求权限", "loading");
  hideDiagnostic();

  try {
    if (!state.cameraLabelsReady) {
      await getInitialPermission();
      await enumerateCameras(deviceId);
    }

    await setupFaceLandmarker();
    stopCamera(false);

    const preferredDeviceId = deviceId || state.selectedDeviceId;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(cameraConstraints(preferredDeviceId));
    } catch (error) {
      if (!preferredDeviceId || error.name !== "OverconstrainedError") {
        throw error;
      }

      addLog("指定摄像头不可用，切回系统默认摄像头");
      state.selectedDeviceId = "";
      stream = await navigator.mediaDevices.getUserMedia(cameraConstraints());
    }

    state.stream = stream;
    video.srcObject = stream;
    await waitForVideoMetadata();
    await video.play();

    await enumerateCameras(deviceId || stream.getVideoTracks()[0]?.getSettings().deviceId);
    resizeCanvas();
    state.running = true;
    state.lastVideoTime = -1;
    state.lastFrameAt = performance.now();
    state.fpsSamples = [];
    resetDetectionWindow();
    clearBlinkCodeBuffer();
    clearPendingConfirmation();
    resetGestureSequences();
    resetSignalBaseline();
    resetLiveMetrics("检测中");
    setCommunicationMessage("等待输入", "已启动");
    videoEmpty.classList.add("hidden");
    setStatus("检测中", "ok");
    hideDiagnostic();
    stream.getVideoTracks().forEach((track) => {
      track.addEventListener("ended", () => handleCameraEnded(stream), { once: true });
    });
    addLog(`已连接：${cameraSelect.selectedOptions[0]?.textContent || "MacBook 摄像头"}`);
    detectLoop();
  } catch (error) {
    console.error(error);
    if (state.stream && !state.running) {
      stopCamera(false);
    }
    const cameraError = formatCameraError(error);
    setStatus(cameraError.status, "error");
    addLog(cameraError.log);
    showDiagnostic(cameraError.title, cameraError.message);
  } finally {
    state.starting = false;
    setControlsBusy(false);
  }
}

function stopCamera(clearStatus = true) {
  state.running = false;
  cancelAnimationFrame(state.rafId);
  state.stream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
  video.pause();
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  videoEmpty.classList.remove("hidden");
  setControlsBusy(state.starting);

  if (clearStatus) {
    setStatus("已停止", "idle");
    resetDetectionWindow();
    clearBlinkCodeBuffer();
    clearPendingConfirmation();
    resetGestureSequences();
    resetLiveMetrics("已停止");
    addLog("检测已停止");
  }
}

function handleCameraEnded(endedStream) {
  if (!state.running || state.stream !== endedStream) {
    return;
  }

  stopCamera(false);
  setStatus("摄像头断开", "error");
  resetLiveMetrics("已断开");
  addLog("摄像头已断开");
  showDiagnostic("摄像头已断开", "摄像头设备被系统断开或被其他应用接管。请确认设备可用后重新启动。");
}

function formatCameraError(error) {
  if (error.name === "ModelLoadError") {
    return {
      status: "模型失败",
      log: "人脸模型加载失败",
      title: "人脸模型加载失败",
      message: "本地模型或 wasm 文件没有正确加载。请重新运行 npm install，并确认开发服务器仍在当前项目目录启动。",
    };
  }
  if (error.name === "NotAllowedError") {
    return {
      status: "摄像头失败",
      log: "摄像头权限被拒绝",
      title: "摄像头权限被拒绝",
      message: `当前浏览器没有摄像头权限。请用 Chrome 或 Safari 打开 ${window.location.href}，或在 macOS「隐私与安全性 > 相机」允许当前浏览器后重试。`,
    };
  }
  if (error.name === "NotFoundError") {
    return {
      status: "摄像头失败",
      log: "没有找到可用摄像头",
      title: "没有找到可用摄像头",
      message: "请确认 MacBook 摄像头可用，且没有被系统禁用。",
    };
  }
  if (error.name === "NotReadableError") {
    return {
      status: "摄像头失败",
      log: "摄像头被其他应用占用",
      title: "摄像头被占用",
      message: "请先关闭 FaceTime、Zoom、Teams、微信视频等正在使用摄像头的应用，再点击启动。",
    };
  }
  if (error.name === "OverconstrainedError") {
    return {
      status: "摄像头失败",
      log: "指定摄像头不可用，已准备切回默认摄像头",
      title: "指定摄像头不可用",
      message: "请在摄像头下拉框里切换设备，或重新点击启动使用系统默认摄像头。",
    };
  }
  return {
    status: "启动失败",
    log: error.message || "摄像头启动失败",
    title: "摄像头启动失败",
    message: `${error.name || "UnknownError"}：${error.message || "没有更多错误信息"}`,
  };
}

function resizeCanvas() {
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  canvas.width = width;
  canvas.height = height;
}

function detectLoop() {
  if (!state.running || !state.faceLandmarker) {
    return;
  }

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== state.lastVideoTime) {
    state.lastVideoTime = video.currentTime;
    try {
      const result = state.faceLandmarker.detectForVideo(video, performance.now());
      const landmarks = result.faceLandmarks?.[0];
      const signals = extractFaceSignals(result, landmarks);
      updateFps();
      drawOverlay(landmarks);
      processFaceSignals(signals, performance.now());
    } catch (error) {
      console.error(error);
      setStatus("检测失败", "error");
      addLog("检测循环出现错误，已暂停");
      stopCamera(false);
      showDiagnostic("检测循环出现错误", error.message || "请刷新页面后重试。");
      return;
    }
  }

  state.rafId = requestAnimationFrame(detectLoop);
}

function updateFps() {
  const now = performance.now();
  const delta = now - state.lastFrameAt;
  state.lastFrameAt = now;

  if (delta <= 0) {
    return;
  }

  state.fpsSamples.push(1000 / delta);
  if (state.fpsSamples.length > 20) {
    state.fpsSamples.shift();
  }

  const average = state.fpsSamples.reduce((sum, fps) => sum + fps, 0) / state.fpsSamples.length;
  fpsValue.textContent = Math.round(average).toString();
}

function processFaceSignals(signals, now) {
  const detectionSignals = updateSignalBaseline(signals);
  updateGestureMeters(detectionSignals);

  if (isRecognitionPaused(now)) {
    blinkState.textContent = "暂停";
    resetDetectionWindow();
    resetGestureSequences();
    gestureDetectors.brow.reset();
    gestureDetectors.mouth.reset();
    gestureDetectors.smile.reset();
    headShakeDetector.reset();
    return;
  }

  getActiveConfirmation(now);

  if (!signals.hasFace) {
    blinkState.textContent = "未见人脸";
    earValue.textContent = "--";
    confidenceLabel.textContent = "--";
    earBar.style.width = "0%";
    resetDetectionWindow();
    resetGestureSequences();
    gestureDetectors.brow.reset();
    gestureDetectors.mouth.reset();
    gestureDetectors.smile.reset();
    headShakeDetector.reset();
    return;
  }

  const threshold = Number(thresholdRange.value);
  const holdFrames = Number(holdFramesRange.value);
  const ear = signals.ear;

  if (ear === null) {
    blinkState.textContent = "关键点不足";
    earValue.textContent = "--";
    confidenceLabel.textContent = "--";
    earBar.style.width = "0%";
    resetDetectionWindow();
    resetGestureSequences();
    gestureDetectors.brow.reset();
    gestureDetectors.mouth.reset();
    gestureDetectors.smile.reset();
    headShakeDetector.reset();
    return;
  }

  const isClosed = ear < threshold;
  const openness = Math.min(Math.max((ear - 0.12) / 0.24, 0), 1);

  earValue.textContent = ear.toFixed(3);
  earBar.style.width = `${Math.round(openness * 100)}%`;
  confidenceLabel.textContent = isClosed ? "闭合" : "睁开";
  collectCalibrationFrame(signals, now);

  if (isClosed) {
    if (!state.blinkWasClosed) {
      state.blinkWasClosed = true;
      state.blinkClosedAt = now;
    }
    state.closedFrames += 1;
    state.openFrames = 0;
  } else {
    state.openFrames += 1;
  }

  if (state.closedFrames >= holdFrames && state.blinkArmed) {
    state.blinkArmed = false;
    blinkState.textContent = "闭眼";
  }

  if (!isClosed && !state.blinkArmed && state.openFrames >= 2) {
    state.blinkTotal += 1;
    blinkCount.textContent = state.blinkTotal.toString();
    blinkState.textContent = "眨眼";
    state.blinkArmed = true;
    handleBlinkReleased(now, ear);
    state.closedFrames = 0;
    return;
  }

  if (!isClosed && state.blinkArmed) {
    blinkState.textContent = "睁眼";
    state.closedFrames = 0;
    state.blinkWasClosed = false;
    state.blinkClosedAt = null;
  }

  gestureDetectors.brow.update(detectionSignals.browUp, now, browToggle.checked);
  gestureDetectors.mouth.update(detectionSignals.mouthOpen, now, mouthToggle.checked);
  gestureDetectors.smile.update(detectionSignals.smile, now, smileToggle.checked);
  headShakeDetector.update(detectionSignals.headYaw, now, headShakeToggle.checked);
}

function handleBlinkReleased(now, ear) {
  const duration = state.blinkClosedAt ? now - state.blinkClosedAt : 0;
  state.blinkWasClosed = false;
  state.blinkClosedAt = null;

  if (duration >= BLINK_SYMBOLS.restMinMs) {
    addLog(`闭眼休息 ${Math.round(duration)}ms`);
    return;
  }

  if (duration >= BLINK_SYMBOLS.longMinMs && duration <= BLINK_SYMBOLS.longMaxMs) {
    recordCalibrationBlink("-", duration);
    enqueueBlinkSymbol("-");
    addLog(`长闭眼 ${Math.round(duration)}ms（EAR ${ear.toFixed(3)}）`);
    return;
  }

  if (duration >= BLINK_SYMBOLS.shortMinMs && duration <= BLINK_SYMBOLS.shortMaxMs) {
    recordCalibrationBlink(".", duration);
    enqueueBlinkSymbol(".");
    addLog(`短眨眼 ${Math.round(duration)}ms（EAR ${ear.toFixed(3)}）`);
    return;
  }

  addLog(`眨眼 ${Math.round(duration)}ms（EAR ${ear.toFixed(3)}）`);
}

function drawOverlay(landmarks) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!landmarks || !overlayToggle.checked) {
    return;
  }

  const drawPoint = (point, color, radius = 4) => {
    if (!point) {
      return;
    }

    ctx.beginPath();
    ctx.arc(point.x * canvas.width, point.y * canvas.height, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawPath = ({ indices, color, lineWidth = 2.5, pointRadius = 2, close = false, dash = [] }) => {
    if (!hasLandmarkIndices(landmarks, indices)) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    indices.forEach((index, itemIndex) => {
      const point = landmarks[index];
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      if (itemIndex === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    if (close) {
      ctx.closePath();
    }
    ctx.setLineDash(dash);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();

    indices.forEach((index) => drawPoint(landmarks[index], color, pointRadius));
  };

  drawPath({ indices: FACE_OVAL, color: "rgba(224, 242, 254, 0.9)", lineWidth: 2.5, pointRadius: 1.7, close: true });
  drawPath({ indices: FACE_CENTER_LINE, color: "rgba(203, 213, 225, 0.68)", lineWidth: 1.6, pointRadius: 1.3, dash: [8, 8] });

  drawPath({ indices: LEFT_BROW_UPPER, color: "#facc15", lineWidth: 3, pointRadius: 2.4 });
  drawPath({ indices: LEFT_BROW_LOWER, color: "#fde047", lineWidth: 2.2, pointRadius: 2 });
  drawPath({ indices: RIGHT_BROW_UPPER, color: "#facc15", lineWidth: 3, pointRadius: 2.4 });
  drawPath({ indices: RIGHT_BROW_LOWER, color: "#fde047", lineWidth: 2.2, pointRadius: 2 });

  drawPath({ indices: OUTER_LIP, color: "#fb7185", lineWidth: 3, pointRadius: 2.2, close: true });
  drawPath({ indices: INNER_LIP, color: "#fda4af", lineWidth: 2.4, pointRadius: 1.8, close: true });

  drawPath({ indices: LEFT_EYE, color: "#2dd4bf", lineWidth: 3, pointRadius: 3, close: true });
  drawPath({ indices: RIGHT_EYE, color: "#38bdf8", lineWidth: 3, pointRadius: 3, close: true });
  [...LEFT_IRIS, ...RIGHT_IRIS].forEach((index) => {
    if (landmarks[index]) {
      drawPoint(landmarks[index], "#f8fafc", 2);
    }
  });
}

function resetCounters() {
  state.blinkTotal = 0;
  resetDetectionWindow();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  resetGestureSequences();
  blinkCount.textContent = "0";
  blinkState.textContent = state.running ? "检测中" : "未检测";
  addLog("计数已清零");
}

thresholdRange.addEventListener("input", () => {
  thresholdValue.textContent = Number(thresholdRange.value).toFixed(2);
});

holdFramesRange.addEventListener("input", () => {
  holdFramesValue.textContent = holdFramesRange.value;
});

startButton.addEventListener("click", () => {
  startCamera();
});

stopButton.addEventListener("click", () => {
  stopCamera();
});

resetButton.addEventListener("click", resetCounters);

repeatSpeechButton.addEventListener("click", () => {
  speak();
});

clearSpeechButton.addEventListener("click", () => {
  cancelSpeech();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  resetGestureSequences();
  setCommunicationMessage("等待输入", "--");
});

ttsToggle.addEventListener("change", () => {
  if (!ttsToggle.checked) {
    cancelSpeech();
  }
});

[browToggle, mouthToggle, smileToggle, headShakeToggle].forEach((toggle) => {
  toggle.addEventListener("change", resetGestureSequences);
});

calibrationStartButton.addEventListener("click", startCalibrationGuide);

calibrationCollectButton.addEventListener("click", beginCalibrationCollection);

calibrationNextButton.addEventListener("click", moveToNextCalibrationStep);

calibrationResetButton.addEventListener("click", resetCalibration);

guidedTestButton.addEventListener("click", startGuidedTest);

pauseRecognitionButton.addEventListener("click", () => {
  if (state.pausedUntil > performance.now()) {
    resumeRecognition();
    addLog("识别已恢复");
    return;
  }

  pauseRecognition();
  addLog("识别已暂停 5 分钟");
});

copyUrlButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    addLog("本地地址已复制");
  } catch {
    addLog(window.location.href);
  }
});

cameraSelect.addEventListener("change", async () => {
  state.selectedDeviceId = cameraSelect.value;
  if (state.running) {
    await startCamera(state.selectedDeviceId);
  }
});

navigator.mediaDevices?.addEventListener?.("devicechange", () => {
  refreshCameraList({ preserveSelection: true, shouldLog: true }).catch(() => {
    addLog("摄像头列表更新失败");
  });
});

window.addEventListener("resize", resizeCanvas);

refreshCameraList().catch(() => {
  const option = document.createElement("option");
  option.textContent = "等待权限";
  option.value = "";
  cameraSelect.append(option);
});

updateCalibrationUI();
