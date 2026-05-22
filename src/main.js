import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import {
  createIcons,
  Camera,
  Circle,
  Copy,
  Download,
  Pause,
  Play,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Upload,
  Volume2,
} from "lucide";
import "./styles.css";

createIcons({
  icons: { Camera, Circle, Copy, Download, Pause, Play, RotateCcw, Save, Square, Trash2, Upload, Volume2 },
});

const video = document.querySelector("#cameraVideo");
const canvas = document.querySelector("#overlayCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const resetButton = document.querySelector("#resetButton");
const runtimeStatus = document.querySelector("#runtimeStatus");
const videoEmpty = document.querySelector("#videoEmpty");
const emergencyOverlay = document.querySelector("#emergencyOverlay");
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
const secondarySelectionPanel = document.querySelector("#secondarySelectionPanel");
const secondarySelectionTitle = document.querySelector("#secondarySelectionTitle");
const secondarySelectionHint = document.querySelector("#secondarySelectionHint");
const secondarySelectionOptions = document.querySelector("#secondarySelectionOptions");
const secondarySelectionSelectButton = document.querySelector("#secondarySelectionSelectButton");
const secondarySelectionCancelButton = document.querySelector("#secondarySelectionCancelButton");
const actionGuideMode = document.querySelector("#actionGuideMode");
const actionGuideList = document.querySelector("#actionGuideList");
const blinkCodeToggle = document.querySelector("#blinkCodeToggle");
const browToggle = document.querySelector("#browToggle");
const mouthToggle = document.querySelector("#mouthToggle");
const smileToggle = document.querySelector("#smileToggle");
const headShakeToggle = document.querySelector("#headShakeToggle");
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
const recordingStatus = document.querySelector("#recordingStatus");
const recordingCount = document.querySelector("#recordingCount");
const recordingAccuracy = document.querySelector("#recordingAccuracy");
const recordingLatency = document.querySelector("#recordingLatency");
const recordingExpectedSelect = document.querySelector("#recordingExpectedSelect");
const recordingStartButton = document.querySelector("#recordingStartButton");
const recordingStopButton = document.querySelector("#recordingStopButton");
const recordingMarkCorrectButton = document.querySelector("#recordingMarkCorrectButton");
const recordingMarkWrongButton = document.querySelector("#recordingMarkWrongButton");
const recordingExportJsonButton = document.querySelector("#recordingExportJsonButton");
const recordingExportCsvButton = document.querySelector("#recordingExportCsvButton");
const engineerPanel = document.querySelector(".engineer-panel");
const actionSettingsList = document.querySelector("#actionSettingsList");
const actionSettingsSaveButton = document.querySelector("#actionSettingsSaveButton");
const actionSettingsCancelButton = document.querySelector("#actionSettingsCancelButton");
const actionSettingsExportButton = document.querySelector("#actionSettingsExportButton");
const actionSettingsImportButton = document.querySelector("#actionSettingsImportButton");
const actionSettingsImportInput = document.querySelector("#actionSettingsImportInput");
const actionSettingsResetButton = document.querySelector("#actionSettingsResetButton");
const actionSettingsStatus = document.querySelector("#actionSettingsStatus");

const APP_BASE_URL = new URL(import.meta.env.BASE_URL, window.location.href);
const MODEL_URL = new URL("mediapipe/models/face_landmarker.task", APP_BASE_URL).toString();
const WASM_URL = new URL("mediapipe/wasm", APP_BASE_URL).toString();
const ENGINEERING_MODE = new URLSearchParams(window.location.search).has("debug");

document.documentElement.classList.toggle("engineering-mode", ENGINEERING_MODE);
if (engineerPanel) {
  engineerPanel.open = ENGINEERING_MODE;
}

const BUILT_IN_CAMERA_HINTS = [
  "macbook",
  "facetime",
  "built-in",
  "built in",
  "front",
  "front camera",
  "user",
  "内置",
  "前置",
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
const MOUTH_WIDTH_POINTS = [61, 291];
const HEAD_YAW_POINTS = [1, 33, 263];

const BLINK_SYMBOLS = {
  shortMinMs: 100,
  shortMaxMs: 500,
  longMinMs: 700,
  longMaxMs: 2800,
  restMinMs: 3500,
  singleSymbolDecodeDelayMs: 2500,
  decodeDelayMs: 1200,
  closedDeferMs: 120,
  finalDecodeDelayMs: 350,
  longSequenceDecodeDelayMs: 2200,
  separatedLongWindowMs: 6000,
};

const DEFAULT_ACTION_CONFIG = [
  {
    id: "blink_double_short_help",
    gestureId: "blink_double_short",
    label: "短眨2次",
    displayText: "我需要帮助，请过来一下",
    speechText: "我需要帮助，请过来一下",
    instruction: "连续短眨两次；每次闭眼 0.1-0.5 秒，并明显睁开。",
    category: "help",
    input: "blink",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "blink_triple_short_emergency",
    gestureId: "blink_triple_short",
    label: "短眨3次",
    displayText: "紧急求助，请马上查看",
    speechText: "紧急求助，请马上查看",
    instruction: "连续短眨三次；每次都要闭眼后再睁开。",
    category: "emergency",
    input: "blink",
    enabled: true,
    requiresConfirmation: false,
    locked: true,
    flash: true,
  },
  {
    id: "blink_double_long_rest",
    gestureId: "blink_double_long",
    label: "长闭眼2次",
    displayText: "我想休息",
    speechText: "我想休息",
    instruction: "长闭眼一次约 1 秒；有效范围 0.7-2.8 秒，必须睁开。6 秒内做两次。",
    category: "control",
    input: "blink",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "blink_short_long_scratch",
    gestureId: "blink_short_long",
    label: "短眨+长闭眼",
    displayText: "我想挠痒痒",
    speechText: "我想挠痒痒",
    instruction: "先短眨并睁开；2.5 秒内开始长闭眼约 1 秒，触发后进入挠痒痒二级选择。",
    category: "care",
    input: "blink",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "blink_long_short_position",
    gestureId: "blink_long_short",
    label: "长闭眼+短眨",
    displayText: "我想调整体位",
    speechText: "我想调整体位",
    instruction: "先长闭眼约 1 秒并睁开；再短眨一次，触发后进入调整体位二级选择。",
    category: "care",
    input: "blink",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "brow_raise_yes",
    gestureId: "brow_raise",
    label: "抬眉",
    displayText: "是，确认",
    speechText: "是，确认",
    instruction: "头部尽量稳定，轻抬眉约 0.25 秒后放松；上下点头会暂停抬眉判断。",
    category: "control",
    input: "brow",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "mouth_double_open_suction",
    gestureId: "mouth_double_open",
    label: "张嘴2次",
    displayText: "我需要吸痰，请马上查看",
    speechText: "我需要吸痰，请马上查看",
    instruction: "微张嘴约 0.2 秒后闭合，6 秒内重复两次。",
    category: "care",
    input: "mouth",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "smile_status",
    gestureId: "smile",
    label: "微笑",
    displayText: "谢谢，可以，我还好",
    speechText: "谢谢，可以，我还好",
    instruction: "轻微闭嘴微笑约 0.25 秒后放松；只有明显张嘴时才会抑制微笑。",
    category: "emotion",
    input: "smile",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "smile_double_love",
    gestureId: "smile_double",
    label: "微笑2次",
    displayText: "我爱你",
    speechText: "我爱你",
    instruction: "先闭嘴微笑并完全放松约 0.5 秒，再第二次闭嘴微笑。",
    category: "emotion",
    input: "smile",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "head_shake_no",
    gestureId: "head_shake",
    label: "摇头",
    displayText: "否，不是，取消",
    speechText: "否，不是，取消",
    instruction: "极轻微左-右-左或右-左-右摇头；4 秒内完成，不需要大幅度。",
    category: "control",
    input: "head",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
];

const ACTION_CONFIG = DEFAULT_ACTION_CONFIG.map((action) => ({ ...action }));
const BLINK_CODE_GESTURE_IDS = {
  "..": "blink_double_short",
  "...": "blink_triple_short",
  "--": "blink_double_long",
  ".-": "blink_short_long",
  "-.": "blink_long_short",
};
const EVENT_GESTURE_IDS = {
  BROW_RAISE: "brow_raise",
  MOUTH_OPEN: "mouth_open",
  MOUTH_DOUBLE_OPEN: "mouth_double_open",
  SMILE: "smile",
  SMILE_DOUBLE: "smile_double",
  HEAD_SHAKE: "head_shake",
};
const SECONDARY_SELECTION_SCAN_MS = 3220;
const SECONDARY_SELECTION_TIMEOUT_MS = 90 * 1000;
const SECONDARY_SELECTION_GROUPS = {
  scratch: {
    id: "scratch",
    triggerGestureId: "blink_short_long",
    label: "挠痒痒",
    title: "我想挠痒痒：请选择位置",
    promptSuffix: "请继续选择位置",
    hint: "自动轮流高亮；两次短眨或轻抬眉后放松选择，长闭眼或摇头取消。",
    options: [
      { id: "scratch_head", label: "头部", text: "请帮我挠头部" },
      { id: "scratch_face", label: "脸部/耳边", text: "请帮我挠脸部或耳边" },
      { id: "scratch_back", label: "背部", text: "请帮我挠背部" },
      { id: "scratch_arm", label: "手臂", text: "请帮我挠手臂" },
      { id: "scratch_leg", label: "腿部", text: "请帮我挠腿部" },
      { id: "scratch_check", label: "请查看", text: "请帮我查看哪里痒" },
    ],
  },
  position: {
    id: "position",
    triggerGestureId: "blink_long_short",
    label: "调整体位",
    title: "我想调整体位：请选择方式",
    promptSuffix: "请继续选择调整方式",
    hint: "自动轮流高亮；两次短眨或轻抬眉后放松选择，长闭眼或摇头取消。",
    options: [
      { id: "position_left", label: "向左侧翻身", text: "请帮我向左侧翻身" },
      { id: "position_right", label: "向右侧翻身", text: "请帮我向右侧翻身" },
      { id: "position_raise", label: "抬高上身", text: "请帮我把头和上半身垫高一点" },
      { id: "position_lower", label: "放低上身", text: "请帮我把头和上半身放低一点" },
      { id: "position_pillow", label: "调整枕头", text: "请帮我调整枕头" },
      { id: "position_legs", label: "调整腿脚", text: "请帮我调整腿部或脚的位置" },
    ],
  },
};
const CONFIRMATION_TIMEOUT_MS = 10 * 1000;
const MOUTH_DOUBLE_WINDOW_MS = 6000;
const MOUTH_BROW_SUPPRESS_THRESHOLD = 0.045;
const MOUTH_SMILE_SUPPRESS_THRESHOLD = 0.16;
const SMILE_MOUTH_SUPPRESS_THRESHOLD = 0.14;
const SMILE_DOUBLE_WINDOW_MS = 2400;
const SMILE_DOUBLE_MIN_GAP_MS = 550;
const SMILE_WIDTH_DELTA_SCALE = 0.055;
const HEAD_SHAKE_YAW_THRESHOLD = 0.022;
const BROW_HEAD_MOTION_GUARD = {
  pitchDelta: 0.03,
  pitchJump: 0.012,
  centerJump: 0.015,
  settleMs: 650,
};
const FACE_SCALE_STABILITY = {
  relativeJump: 0.1,
  absoluteJump: 0.02,
  settleMs: 700,
};
const CALIBRATION_STORAGE_KEY = "alsFacialAac.defaultPatientCalibration.v1";
const ACTION_TEXT_STORAGE_KEY = "alsFacialAac.actionText.v1";
const LEGACY_ACTION_CONFIG_STORAGE_KEYS = ["alsFacialAac.actionConfig.v2"];
const CALIBRATION_STEPS = [
  {
    id: "position",
    title: "准备画面",
    instruction: "确认人脸完整、面部描边贴合、光线稳定。完成后进入下一步。",
    kind: "check",
  },
  {
    id: "open",
    title: "1. 自然睁眼基线",
    instruction: "保持自然睁眼，点击“采集”，系统会采集 2 秒 EAR 基线。",
    kind: "ear",
    sampleKey: "openEar",
    durationMs: 2000,
  },
  {
    id: "closed",
    title: "2. 轻闭眼基线",
    instruction: "轻轻闭眼，点击“采集”，系统会采集 1.5 秒闭眼 EAR，并更新眨眼阈值。",
    kind: "ear",
    sampleKey: "closedEar",
    durationMs: 1500,
  },
  {
    id: "short",
    title: "3. 主动短眨样本",
    instruction: "点击“采集”后做 3 次低疲劳短眨，每次间隔约 1 秒。",
    kind: "blink",
    sampleKey: "shortBlinkDurations",
    targetCount: 3,
  },
  {
    id: "long",
    title: "4. 长闭眼样本",
    instruction: "点击“采集”后做 1 次可控长闭眼，不要勉强。",
    kind: "blink",
    sampleKey: "longBlinkDurations",
    targetCount: 1,
  },
  {
    id: "review",
    title: "5. 确认校准",
    instruction: "核心校准完成后即可点击“完成确认”。下方短码测试是可选验证，用来继续观察误触和准确率。",
    kind: "test",
  },
];
const GUIDED_TEST_CODES = [".", "-", "..", "...", "--", ".-", "-."];

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
  blinkCodeStartedAt: null,
  blinkCodeLastAt: null,
  blinkCodeDurations: [],
  pendingSeparatedLongAt: 0,
  secondarySelection: {
    active: false,
    groupId: "",
    index: 0,
    startedAt: 0,
    expiresAt: 0,
    scanTimer: 0,
  },
  fpsSamples: [],
  lastFps: null,
  lastSignals: null,
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
    smileBlendshape: 0,
    mouthWidthRatio: 0,
    headPitch: 0,
  },
  faceStability: {
    lastScale: null,
    unstableUntil: 0,
  },
  headMotionGuard: {
    lastPitch: null,
    lastCenterY: null,
    browBlockedUntil: 0,
  },
  gestureSequences: {
    mouthOpenTimes: [],
    smileTimer: 0,
    smilePending: null,
  },
  calibration: {
    active: false,
    stepIndex: 0,
    collecting: false,
    collectStartedAt: 0,
    confirmed: false,
    completedStepIds: [],
    activeTestCode: "",
    guidedRestFirstLongAt: 0,
    guidedTestResults: {},
    samples: {
      openEar: [],
      closedEar: [],
      shortBlinkDurations: [],
      longBlinkDurations: [],
    },
  },
  recording: {
    active: false,
    startedAt: 0,
    stoppedAt: 0,
    records: [],
    nextId: 1,
    pendingRecordId: null,
    environment: null,
  },
};

function setStatus(label, mode = "idle") {
  runtimeStatus.innerHTML = `<span class="dot dot-${mode}"></span><span>${label}</span>`;
}

function isPausedStateActive() {
  return state.pausedUntil !== 0;
}

function addLog(message) {
  state.sessionEvents.push({
    time: new Date().toISOString(),
    message,
    mode: state.pendingConfirmation
      ? "confirm"
      : state.secondarySelection.active
        ? "secondary"
        : isPausedStateActive()
          ? "paused"
          : "direct",
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

function elapsedMs(time = performance.now()) {
  return state.recording.startedAt ? Math.round(time - state.recording.startedAt) : 0;
}

function snapshotSignals() {
  const signals = state.lastSignals || {};
  return {
    ear: Number.isFinite(signals.ear) ? Number(signals.ear.toFixed(4)) : null,
    browUp: Number.isFinite(signals.browUp) ? Number(signals.browUp.toFixed(4)) : null,
    mouthOpen: Number.isFinite(signals.mouthOpen) ? Number(signals.mouthOpen.toFixed(4)) : null,
    smile: Number.isFinite(signals.smile) ? Number(signals.smile.toFixed(4)) : null,
    smileBlendshape: Number.isFinite(signals.smileBlendshape) ? Number(signals.smileBlendshape.toFixed(4)) : null,
    mouthWidthRatio: Number.isFinite(signals.mouthWidthRatio) ? Number(signals.mouthWidthRatio.toFixed(4)) : null,
    smileWidthDelta: Number.isFinite(signals.smileWidthDelta) ? Number(signals.smileWidthDelta.toFixed(4)) : null,
    headYaw: Number.isFinite(signals.headYaw) ? Number(signals.headYaw.toFixed(4)) : null,
    headPitch: Number.isFinite(signals.headPitch) ? Number(signals.headPitch.toFixed(4)) : null,
    headPitchDelta: Number.isFinite(signals.headPitchDelta) ? Number(signals.headPitchDelta.toFixed(4)) : null,
    hasFace: Boolean(signals.hasFace),
  };
}

function averageRecorded(records, key) {
  const values = records.map((record) => record[key]).filter((value) => Number.isFinite(value));
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function updateRecordingUI() {
  const records = state.recording.records;
  const marked = records.filter((record) => typeof record.correct === "boolean");
  const correct = marked.filter((record) => record.correct).length;
  const averageDisplayLatency = averageRecorded(records, "displayLatencyFromActionEndMs");

  recordingStatus.textContent = state.recording.active ? "记录中" : records.length > 0 ? "已停止" : "未记录";
  recordingCount.textContent = records.length.toString();
  recordingAccuracy.textContent = marked.length > 0 ? `${Math.round((correct / marked.length) * 100)}%` : "--";
  recordingLatency.textContent =
    averageDisplayLatency === null ? "--" : `${Math.round(averageDisplayLatency)}ms`;
  recordingStartButton.disabled = state.recording.active;
  recordingStopButton.disabled = !state.recording.active;
  recordingMarkCorrectButton.disabled = records.length === 0;
  recordingMarkWrongButton.disabled = records.length === 0;
  recordingExportJsonButton.disabled = records.length === 0;
  recordingExportCsvButton.disabled = records.length === 0;
}

function getRecordingEnvironment() {
  const track = state.stream?.getVideoTracks?.()[0];
  const settings = track?.getSettings?.() || {};
  return {
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    cameraLabel: cameraSelect.selectedOptions[0]?.textContent || "",
    cameraDeviceId: state.selectedDeviceId || "",
    video: {
      width: video.videoWidth || null,
      height: video.videoHeight || null,
      trackWidth: settings.width || null,
      trackHeight: settings.height || null,
      frameRate: settings.frameRate || null,
      facingMode: settings.facingMode || null,
    },
    thresholds: {
      blinkEar: Number(thresholdRange.value),
      holdFrames: Number(holdFramesRange.value),
    },
  };
}

function startTestRecording() {
  state.recording.active = true;
  state.recording.startedAt = performance.now();
  state.recording.stoppedAt = 0;
  state.recording.records = [];
  state.recording.nextId = 1;
  state.recording.pendingRecordId = null;
  state.recording.environment = getRecordingEnvironment();
  updateRecordingUI();
  addLog("测试记录已开始");
}

function stopTestRecording() {
  state.recording.active = false;
  state.recording.stoppedAt = performance.now();
  state.recording.pendingRecordId = null;
  updateRecordingUI();
  addLog(`测试记录已停止，共 ${state.recording.records.length} 条`);
}

function recordTestAction(data) {
  if (!state.recording.active) {
    return null;
  }

  const now = performance.now();
  const actionEndedAt = data.actionEndedAtMs ?? data.detectedAtMs ?? now;
  const actionStartedAt = Number.isFinite(data.actionStartedAtMs) ? data.actionStartedAtMs : null;
  const detectedAt = Number.isFinite(data.detectedAtMs) ? data.detectedAtMs : now;
  const record = {
    id: state.recording.nextId,
    timestamp: new Date().toISOString(),
    elapsedMs: elapsedMs(now),
    type: data.type,
    source: data.source || "",
    label: data.label || "",
    code: data.code || "",
    expected: data.expected ?? recordingExpectedSelect.value,
    received: data.received || data.code || data.label || "",
    correct: typeof data.correct === "boolean" ? data.correct : null,
    actionStartedAtMs: actionStartedAt === null ? null : Math.round(actionStartedAt),
    actionEndedAtMs: Math.round(actionEndedAt),
    detectedAtMs: Math.round(detectedAt),
    durationMs: Number.isFinite(data.durationMs) ? Math.round(data.durationMs) : null,
    recognitionLatencyMs:
      Number.isFinite(detectedAt) && Number.isFinite(actionEndedAt)
        ? Math.round(detectedAt - actionEndedAt)
        : null,
    totalInputToDetectionMs:
      Number.isFinite(detectedAt) && Number.isFinite(actionStartedAt)
        ? Math.round(detectedAt - actionStartedAt)
        : null,
    displayAtMs: null,
    displayLatencyFromActionEndMs: null,
    displayLatencyFromDetectionMs: null,
    speechQueuedAtMs: null,
    speechQueueLatencyFromDisplayMs: null,
    speechStartedAtMs: null,
    speechStartLatencyFromQueueMs: null,
    text: "",
    fps: Number.isFinite(state.lastFps) ? Math.round(state.lastFps) : null,
    signals: snapshotSignals(),
    note: data.note || "",
  };

  state.recording.nextId += 1;
  state.recording.records.push(record);
  state.recording.pendingRecordId = record.id;
  updateRecordingUI();
  return record.id;
}

function updateTestRecord(recordId, patch) {
  if (!recordId) {
    return;
  }

  const record = state.recording.records.find((item) => item.id === recordId);
  if (!record) {
    return;
  }

  Object.assign(record, patch);
  updateRecordingUI();
}

function updatePendingTestRecord(patch) {
  updateTestRecord(state.recording.pendingRecordId, patch);
}

function finishPendingTestRecord(patch = {}) {
  const recordId = state.recording.pendingRecordId;
  if (recordId) {
    updateTestRecord(recordId, patch);
    state.recording.pendingRecordId = null;
  }
}

function markLastRecording(correct) {
  const lastRecord = state.recording.records.at(-1);
  if (!lastRecord) {
    return;
  }

  lastRecord.correct = correct;
  lastRecord.expected = lastRecord.expected || recordingExpectedSelect.value;
  updateRecordingUI();
  addLog(`上一条测试记录已标记为${correct ? "正确" : "错误"}`);
}

function recordingPayload() {
  const startedAt = state.recording.startedAt
    ? new Date(Date.now() - (performance.now() - state.recording.startedAt)).toISOString()
    : null;

  return {
    exportedAt: new Date().toISOString(),
    startedAt,
    stoppedAt: state.recording.stoppedAt
      ? new Date(Date.now() - (performance.now() - state.recording.stoppedAt)).toISOString()
      : null,
    environment: state.recording.environment || getRecordingEnvironment(),
    summary: {
      total: state.recording.records.length,
      marked: state.recording.records.filter((record) => typeof record.correct === "boolean").length,
      correct: state.recording.records.filter((record) => record.correct === true).length,
      averageDisplayLatencyMs: averageRecorded(state.recording.records, "displayLatencyFromActionEndMs"),
      averageSpeechQueueLatencyMs: averageRecorded(state.recording.records, "speechQueueLatencyFromDisplayMs"),
      averageSpeechStartLatencyMs: averageRecorded(state.recording.records, "speechStartLatencyFromQueueMs"),
    },
    records: state.recording.records,
  };
}

function downloadTextFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportRecordingJson() {
  const payload = recordingPayload();
  downloadTextFile(
    `als-aac-test-${new Date().toISOString().replaceAll(":", "-")}.json`,
    JSON.stringify(payload, null, 2),
    "application/json",
  );
}

function exportRecordingCsv() {
  const columns = [
    "id",
    "timestamp",
    "elapsedMs",
    "type",
    "source",
    "label",
    "code",
    "expected",
    "received",
    "correct",
    "durationMs",
    "recognitionLatencyMs",
    "totalInputToDetectionMs",
    "displayLatencyFromActionEndMs",
    "displayLatencyFromDetectionMs",
    "speechQueueLatencyFromDisplayMs",
    "speechStartLatencyFromQueueMs",
    "fps",
    "ear",
    "browUp",
    "mouthOpen",
    "smile",
    "smileBlendshape",
    "mouthWidthRatio",
    "smileWidthDelta",
    "headYaw",
    "headPitch",
    "headPitchDelta",
    "text",
    "note",
  ];
  const rows = state.recording.records.map((record) =>
    columns.map((column) => csvEscape(record.signals?.[column] ?? record[column])).join(","),
  );
  downloadTextFile(
    `als-aac-test-${new Date().toISOString().replaceAll(":", "-")}.csv`,
    [columns.join(","), ...rows].join("\n"),
    "text/csv;charset=utf-8",
  );
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
  state.signalBaseline.smileBlendshape = 0;
  state.signalBaseline.mouthWidthRatio = 0;
  state.signalBaseline.headPitch = 0;
  state.faceStability.lastScale = null;
  state.faceStability.unstableUntil = 0;
  state.headMotionGuard.lastPitch = null;
  state.headMotionGuard.lastCenterY = null;
  state.headMotionGuard.browBlockedUntil = 0;
}

function resetGestureSequences() {
  state.gestureSequences.mouthOpenTimes = [];
  if (state.gestureSequences.smileTimer) {
    window.clearTimeout(state.gestureSequences.smileTimer);
  }
  state.gestureSequences.smileTimer = 0;
  state.gestureSequences.smilePending = null;
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

function getDefaultActionConfigById(id) {
  return DEFAULT_ACTION_CONFIG.find((action) => action.id === id) || null;
}

function getActionConfigById(id) {
  return ACTION_CONFIG.find((action) => action.id === id) || null;
}

function getActionConfigByGestureId(gestureId) {
  return ACTION_CONFIG.find((action) => action.gestureId === gestureId && action.enabled) || null;
}

function normalizeActionText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function getActionText(action) {
  return normalizeActionText(action?.displayText || action?.speechText || "");
}

function setActionText(action, text) {
  const normalized = normalizeActionText(text);
  action.displayText = normalized;
  action.speechText = normalized;
}

function resetActionConfigTextFromDefaults() {
  ACTION_CONFIG.forEach((action) => {
    const defaults = getDefaultActionConfigById(action.id);
    if (!defaults) {
      return;
    }

    setActionText(action, getActionText(defaults));
  });
}

function extractActionTextOverrides(payload) {
  const source = payload?.actions && typeof payload.actions === "object" ? payload.actions : payload;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(source)
      .map(([id, values]) => {
        const defaults = getDefaultActionConfigById(id);
        if (!defaults) {
          return null;
        }

        const text =
          typeof values === "string"
            ? normalizeActionText(values)
            : normalizeActionText(values?.text || values?.speechText || values?.displayText);

        return text ? [id, text] : null;
      })
      .filter(Boolean),
  );
}

function applyActionTextOverrides(payload) {
  const overrides = extractActionTextOverrides(payload);
  resetActionConfigTextFromDefaults();

  Object.entries(overrides).forEach(([id, text]) => {
    const action = getActionConfigById(id);
    if (!action) {
      return;
    }

    setActionText(action, text);
  });
}

function currentActionTextOverrides() {
  return Object.fromEntries(
    ACTION_CONFIG.map((action) => {
      const defaults = getDefaultActionConfigById(action.id);
      if (!defaults) {
        return null;
      }

      const text = getActionText(action);
      const defaultText = getActionText(defaults);

      return text && text !== defaultText ? [action.id, text] : null;
    }).filter(Boolean),
  );
}

function findInvalidActionText() {
  return ACTION_CONFIG.find((action) => !getActionText(action));
}

function setActionSettingsStatus(text, tone = "idle") {
  if (!actionSettingsStatus) {
    return;
  }

  actionSettingsStatus.textContent = text;
  actionSettingsStatus.dataset.tone = tone;
}

function saveActionTextConfig({ silent = false } = {}) {
  const invalidAction = findInvalidActionText();
  if (invalidAction) {
    setActionSettingsStatus(`${invalidAction.label} 的表达文字不能为空。`, "error");
    return false;
  }

  const overrides = currentActionTextOverrides();
  try {
    if (Object.keys(overrides).length === 0) {
      window.localStorage.removeItem(ACTION_TEXT_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ACTION_TEXT_STORAGE_KEY, JSON.stringify(overrides, null, 2));
    }
    LEGACY_ACTION_CONFIG_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));

    if (!silent) {
      setActionSettingsStatus("已保存到本机。", "success");
      addLog("高级设置已保存到本机");
    }
    return true;
  } catch {
    setActionSettingsStatus("保存失败，请检查浏览器本地存储权限。", "error");
    return false;
  }
}

function loadSavedActionTextConfig() {
  try {
    const raw = window.localStorage.getItem(ACTION_TEXT_STORAGE_KEY);
    applyActionTextOverrides(raw ? JSON.parse(raw) : {});
    LEGACY_ACTION_CONFIG_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    setActionSettingsStatus(raw ? "已载入本机自定义含义。" : "使用当前默认配置。");
    return true;
  } catch {
    resetActionConfigTextFromDefaults();
    setActionSettingsStatus("本机自定义含义读取失败，已使用默认配置。", "error");
    return false;
  }
}

function updateActionTextValue(actionId, value) {
  const action = getActionConfigById(actionId);
  if (!action) {
    return;
  }

  setActionText(action, value);
  updateActionGuide();
  setActionSettingsStatus("有未保存修改。", "dirty");
}

function restoreActionTextDefault(actionId) {
  const action = getActionConfigById(actionId);
  const defaults = getDefaultActionConfigById(actionId);
  if (!action || !defaults) {
    return;
  }

  setActionText(action, getActionText(defaults));
  renderActionSettings();
  updateActionGuide();
  saveActionTextConfig({ silent: true });
  setActionSettingsStatus(`${action.label} 已恢复默认并保存。`, "success");
}

function restoreAllActionTextDefaults() {
  resetActionConfigTextFromDefaults();
  renderActionSettings();
  updateActionGuide();
  saveActionTextConfig({ silent: true });
  setActionSettingsStatus("全部动作含义已恢复默认并保存。", "success");
  addLog("高级设置已恢复默认");
}

function renderActionSettings() {
  if (!actionSettingsList) {
    return;
  }

  actionSettingsList.innerHTML = "";
  ACTION_CONFIG.forEach((action) => {
    const row = document.createElement("div");
    row.className = "action-settings-item";
    row.dataset.actionId = action.id;

    const header = document.createElement("div");
    header.className = "action-settings-item-header";

    const title = document.createElement("strong");
    title.textContent = action.label;

    const category = document.createElement("span");
    category.textContent = action.category;

    header.append(title, category);

    const fields = document.createElement("div");
    fields.className = "action-settings-fields";

    const fieldLabel = document.createElement("label");
    fieldLabel.className = "action-settings-field";

    const caption = document.createElement("span");
    caption.textContent = "表达文字";

    const input = document.createElement("input");
    input.type = "text";
    input.value = getActionText(action);
    input.dataset.actionId = action.id;
    input.autocomplete = "off";
    input.maxLength = 60;

    fieldLabel.append(caption, input);
    fields.append(fieldLabel);

    const actions = document.createElement("div");
    actions.className = "action-settings-item-actions";

    const testButton = document.createElement("button");
    testButton.className = "ghost-action compact-action";
    testButton.type = "button";
    testButton.dataset.actionId = action.id;
    testButton.dataset.action = "test";
    testButton.textContent = "测试播报";

    const resetButton = document.createElement("button");
    resetButton.className = "ghost-action compact-action";
    resetButton.type = "button";
    resetButton.dataset.actionId = action.id;
    resetButton.dataset.action = "reset";
    resetButton.textContent = "恢复默认";

    actions.append(testButton, resetButton);
    row.append(header, fields, actions);
    actionSettingsList.append(row);
  });
}

function exportActionTextConfig() {
  const invalidAction = findInvalidActionText();
  if (invalidAction) {
    setActionSettingsStatus(`${invalidAction.label} 的表达文字不能为空。`, "error");
    return;
  }

  const overrides = currentActionTextOverrides();
  downloadTextFile(
    `als-aac-action-config-${new Date().toISOString().replaceAll(":", "-")}.json`,
    JSON.stringify(overrides, null, 2),
    "application/json",
  );
  setActionSettingsStatus("已导出自定义含义。", "success");
}

async function importActionTextConfig(file) {
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    applyActionTextOverrides(payload);
    const invalidAction = findInvalidActionText();
    if (invalidAction) {
      throw new Error(`${invalidAction.label} 的表达文字不能为空。`);
    }
    renderActionSettings();
    updateActionGuide();
    saveActionTextConfig({ silent: true });
    setActionSettingsStatus("已导入并保存到本机。", "success");
    addLog("高级设置已导入");
  } catch (error) {
    loadSavedActionTextConfig();
    renderActionSettings();
    updateActionGuide();
    setActionSettingsStatus(error.message || "导入失败，请检查 JSON 文件。", "error");
  } finally {
    if (actionSettingsImportInput) {
      actionSettingsImportInput.value = "";
    }
  }
}

function isActionGuideVisible(action) {
  if (!action.enabled) {
    return false;
  }

  if (action.input === "blink") {
    return blinkCodeToggle.checked;
  }

  if (action.input === "brow") {
    return browToggle.checked;
  }

  if (action.input === "mouth") {
    return mouthToggle.checked;
  }

  if (action.input === "smile") {
    return smileToggle.checked;
  }

  if (action.input === "head") {
    return headShakeToggle.checked;
  }

  return false;
}

function updateActionGuide() {
  if (!actionGuideMode || !actionGuideList) {
    return;
  }

  const visibleActions = ACTION_CONFIG.filter(isActionGuideVisible);
  const optionalInputCount = new Set(
    visibleActions.filter((action) => action.input !== "blink").map((action) => action.input),
  ).size;
  actionGuideMode.textContent = optionalInputCount > 0 ? `已启用 ${optionalInputCount} 类可选输入` : "仅眨眼";
  actionGuideList.innerHTML = "";

  if (visibleActions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "action-guide-empty";
    empty.textContent = "当前未启用动作输入。";
    actionGuideList.append(empty);
    return;
  }

  visibleActions.forEach((action) => {
    const item = document.createElement("div");
    item.className = "action-guide-item";

    const label = document.createElement("strong");
    label.textContent = action.label;

    const text = document.createElement("span");
    text.textContent = getActionText(action);

    item.append(label, text);

    if (action.instruction) {
      const detail = document.createElement("small");
      detail.textContent = action.instruction;
      item.append(detail);
    }

    actionGuideList.append(item);
  });
}

function secondarySelectionGroupForAction(action) {
  if (!action?.gestureId) {
    return null;
  }

  return Object.values(SECONDARY_SELECTION_GROUPS).find((group) => group.triggerGestureId === action.gestureId) || null;
}

function getActiveSecondarySelection(now = performance.now()) {
  if (!state.secondarySelection.active) {
    return null;
  }

  if (now <= state.secondarySelection.expiresAt) {
    return state.secondarySelection;
  }

  const group = SECONDARY_SELECTION_GROUPS[state.secondarySelection.groupId];
  const label = group ? `${group.label}超时` : "二级选择超时";
  clearSecondarySelection();
  setCommunicationMessage("二级选择已取消", label);
  addLog(`${label}，已取消`);
  finishPendingTestRecord({ text: "二级选择已取消", label });
  return null;
}

function activeSecondarySelectionGroup() {
  const selection = getActiveSecondarySelection();
  return selection ? SECONDARY_SELECTION_GROUPS[selection.groupId] || null : null;
}

function renderSecondarySelection() {
  const group = activeSecondarySelectionGroup();
  if (!secondarySelectionPanel || !secondarySelectionOptions) {
    return;
  }

  if (!group) {
    secondarySelectionPanel.hidden = true;
    secondarySelectionOptions.innerHTML = "";
    return;
  }

  secondarySelectionPanel.hidden = false;
  secondarySelectionTitle.textContent = group.title;
  secondarySelectionHint.textContent = group.hint;
  secondarySelectionOptions.innerHTML = "";

  group.options.forEach((option, index) => {
    const optionButton = document.createElement("button");
    optionButton.className = `secondary-selection-option${index === state.secondarySelection.index ? " is-active" : ""}`;
    optionButton.type = "button";
    optionButton.dataset.index = String(index);
    optionButton.textContent = option.label;
    secondarySelectionOptions.append(optionButton);
  });
}

function clearSecondarySelectionTimer() {
  window.clearTimeout(state.secondarySelection.scanTimer);
  state.secondarySelection.scanTimer = 0;
}

function scheduleSecondarySelectionScan() {
  clearSecondarySelectionTimer();
  if (!state.secondarySelection.active) {
    return;
  }

  state.secondarySelection.scanTimer = window.setTimeout(() => {
    const group = getActiveSecondarySelection();
    if (!group) {
      renderSecondarySelection();
      return;
    }

    advanceSecondarySelection();
  }, SECONDARY_SELECTION_SCAN_MS);
}

function advanceSecondarySelection() {
  const group = activeSecondarySelectionGroup();
  if (!group) {
    return;
  }

  state.secondarySelection.index = (state.secondarySelection.index + 1) % group.options.length;
  renderSecondarySelection();
  scheduleSecondarySelectionScan();
}

function clearSecondarySelection({ render = true } = {}) {
  clearSecondarySelectionTimer();
  state.secondarySelection.active = false;
  state.secondarySelection.groupId = "";
  state.secondarySelection.index = 0;
  state.secondarySelection.startedAt = 0;
  state.secondarySelection.expiresAt = 0;
  if (render) {
    renderSecondarySelection();
  }
}

function startSecondarySelection(group, action, label = action?.label || group.label) {
  clearPendingConfirmation();
  clearSecondarySelection({ render: false });
  const now = performance.now();
  state.secondarySelection.active = true;
  state.secondarySelection.groupId = group.id;
  state.secondarySelection.index = 0;
  state.secondarySelection.startedAt = now;
  state.secondarySelection.expiresAt = now + SECONDARY_SELECTION_TIMEOUT_MS;
  renderSecondarySelection();
  scheduleSecondarySelectionScan();

  const actionText = getActionText(action);
  const prompt = `${actionText}，${group.promptSuffix}`;
  setCommunicationMessage(prompt, label);
  speak(prompt);
  addLog(`${label}：进入二级选择`);
  finishPendingTestRecord({ text: prompt, label, note: "secondary_selection_started" });
  return true;
}

function selectSecondarySelection(index = state.secondarySelection.index, sourceLabel = "短眨选择") {
  const group = activeSecondarySelectionGroup();
  if (!group) {
    return false;
  }

  const option = group.options[index] || group.options[state.secondarySelection.index];
  if (!option) {
    return false;
  }

  clearSecondarySelection();
  announce(option.text, `${group.label}：${option.label}`, { shouldSpeak: true });
  addLog(`${group.label}二级选择：${option.label}（${sourceLabel}）`);
  return true;
}

function cancelSecondarySelection({ reason = "cancel", shouldSpeak = true, sourceLabel = "取消" } = {}) {
  const group = activeSecondarySelectionGroup();
  if (!group) {
    return false;
  }

  clearSecondarySelection();
  const label = reason === "timeout" ? `${group.label}超时` : `${group.label}：${sourceLabel}`;
  if (shouldSpeak) {
    announce("已取消", label, { shouldSpeak: true });
  } else {
    setCommunicationMessage("二级选择已取消", label);
    addLog(`${group.label}二级选择已取消`);
    finishPendingTestRecord({ text: "二级选择已取消", label });
  }
  return true;
}

function resolveSecondarySelectionBlinkCode(code) {
  if (!getActiveSecondarySelection()) {
    return false;
  }

  if (code === "...") {
    clearSecondarySelection();
    addLog("二级选择中收到紧急求助短码，已退出二级选择");
    return false;
  }

  if (code === "..") {
    selectSecondarySelection(undefined, "两次短眨");
    return true;
  }

  if (code === ".") {
    setCommunicationMessage("单次短眨已忽略；两次短眨选择当前项，长闭眼取消。", "二级选择");
    addLog("二级选择：忽略单次短眨");
    finishPendingTestRecord({ note: "single_short_blink_ignored_in_secondary_selection" });
    return true;
  }

  if (code.includes("-")) {
    cancelSecondarySelection({ sourceLabel: "长闭眼取消" });
    return true;
  }

  setCommunicationMessage(`二级选择中未识别：${displayBlinkCode(code)}`, "二级选择");
  addLog(`二级选择：未识别短码 ${code}`);
  finishPendingTestRecord({ note: "unrecognized_code_in_secondary_selection" });
  return true;
}

function startActionConfirmation(action, label = action?.label || "") {
  state.pendingConfirmation = {
    label,
    confirmedText: getActionText(action),
    expiresAt: performance.now() + CONFIRMATION_TIMEOUT_MS,
  };
  const prompt = `检测到：${getActionText(action)}。连续两次短眨确认，长闭眼取消。`;
  announce(prompt, `${label}待确认`, { shouldSpeak: true });
}

function announceAction(action, label = action?.label || "") {
  const text = getActionText(action);
  announce(text, label, { shouldSpeak: true });
  if (action.flash) {
    triggerEmergencyFlash();
  }
}

function executeConfiguredAction(action, label = action?.label || "") {
  if (!action) {
    return false;
  }

  const secondaryGroup = secondarySelectionGroupForAction(action);
  if (secondaryGroup) {
    return startSecondarySelection(secondaryGroup, action, label);
  }

  if (action.requiresConfirmation) {
    startActionConfirmation(action, label);
    return true;
  }

  announceAction(action, label);
  return true;
}

function setCommunicationMessage(text, gestureLabel = "") {
  state.lastPhrase = text;
  messageText.textContent = text;
  if (gestureLabel) {
    lastGesture.textContent = gestureLabel;
  }

  if (state.recording.pendingRecordId) {
    const displayAt = performance.now();
    const record = state.recording.records.find((item) => item.id === state.recording.pendingRecordId);
    if (record && record.displayAtMs === null) {
      updateTestRecord(record.id, {
        displayAtMs: Math.round(displayAt),
        displayLatencyFromActionEndMs: Number.isFinite(record.actionEndedAtMs)
          ? Math.round(displayAt - record.actionEndedAtMs)
          : null,
        displayLatencyFromDetectionMs: Number.isFinite(record.detectedAtMs)
          ? Math.round(displayAt - record.detectedAtMs)
          : null,
        text,
        label: gestureLabel || record.label,
      });
    }
  }
}

function cancelSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function speak(text = state.lastPhrase) {
  if (!("speechSynthesis" in window) || !text || text === "等待输入") {
    return;
  }

  cancelSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  const recordId = state.recording.pendingRecordId;
  if (recordId) {
    const queuedAt = performance.now();
    const record = state.recording.records.find((item) => item.id === recordId);
    updateTestRecord(recordId, {
      speechQueuedAtMs: Math.round(queuedAt),
      speechQueueLatencyFromDisplayMs:
        record && Number.isFinite(record.displayAtMs) ? Math.round(queuedAt - record.displayAtMs) : null,
    });
    utterance.onstart = () => {
      const startedAt = performance.now();
      const latestRecord = state.recording.records.find((item) => item.id === recordId);
      updateTestRecord(recordId, {
        speechStartedAtMs: Math.round(startedAt),
        speechStartLatencyFromQueueMs:
          latestRecord && Number.isFinite(latestRecord.speechQueuedAtMs)
            ? Math.round(startedAt - latestRecord.speechQueuedAtMs)
            : null,
      });
    };
  }
  window.speechSynthesis.speak(utterance);
}

function announce(text, gestureLabel, { shouldSpeak = true } = {}) {
  setCommunicationMessage(text, gestureLabel);
  if (shouldSpeak) {
    speak(text);
  }
  addLog(`${gestureLabel ? `${gestureLabel}：` : ""}${text}`);
  finishPendingTestRecord({ text, label: gestureLabel });
}

let emergencyFlashTimer = null;

function triggerEmergencyFlash() {
  if (emergencyFlashTimer) {
    return; // already flashing
  }
  emergencyOverlay.classList.add("is-active");
  emergencyFlashTimer = window.setTimeout(() => {
    emergencyOverlay.classList.remove("is-active");
    emergencyFlashTimer = null;
  }, 8000); // auto-stop after 8s
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
  state.blinkCodeStartedAt = null;
  state.blinkCodeLastAt = null;
  state.blinkCodeDurations = [];
  updateCodeBuffer();
}

function clearSeparatedLongBlink() {
  state.pendingSeparatedLongAt = 0;
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

function hasCompletedGuidedTests() {
  return GUIDED_TEST_CODES.every((code) => state.calibration.guidedTestResults[code]?.passed);
}

function guidedTestPassedCount() {
  return GUIDED_TEST_CODES.filter((code) => state.calibration.guidedTestResults[code]?.passed).length;
}

function guidedTestProgressText() {
  return `${guidedTestPassedCount()}/${GUIDED_TEST_CODES.length}`;
}

function hasConfirmedCalibration() {
  return hasCompletedCoreCalibration() && state.calibration.confirmed;
}

function numericSamples(values) {
  return Array.isArray(values) ? values.filter((value) => Number.isFinite(value)) : [];
}

function guidedTestResultsForSavedProfile(results = {}) {
  return Object.fromEntries(
    GUIDED_TEST_CODES.map((code) => [
      code,
      {
        passed: Boolean(results[code]?.passed),
        received: results[code]?.received || code,
      },
    ]),
  );
}

function saveCalibrationProfile({ silent = false } = {}) {
  if (!hasConfirmedCalibration()) {
    return false;
  }

  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    threshold: Number(thresholdRange.value),
    holdFrames: Number(holdFramesRange.value),
    completedStepIds: Array.from(new Set([...state.calibration.completedStepIds, "review"])),
    guidedTestResults: guidedTestResultsForSavedProfile(state.calibration.guidedTestResults),
    samples: {
      openEar: numericSamples(state.calibration.samples.openEar),
      closedEar: numericSamples(state.calibration.samples.closedEar),
      shortBlinkDurations: numericSamples(state.calibration.samples.shortBlinkDurations),
      longBlinkDurations: numericSamples(state.calibration.samples.longBlinkDurations),
    },
  };

  try {
    window.localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(payload));
    if (!silent) {
      addLog("校准档案已保存，本机下次会自动沿用");
    }
    return true;
  } catch {
    if (!silent) {
      addLog("校准档案保存失败，请检查浏览器本地存储权限");
    }
    return false;
  }
}

function clearSavedCalibrationProfile() {
  try {
    window.localStorage.removeItem(CALIBRATION_STORAGE_KEY);
  } catch {
    addLog("本地校准档案清除失败");
  }
}

function loadSavedCalibrationProfile() {
  let payload = null;

  try {
    const raw = window.localStorage.getItem(CALIBRATION_STORAGE_KEY);
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    addLog("本地校准档案读取失败，已忽略");
    return false;
  }

  if (!payload || payload.version !== 1) {
    return false;
  }

  const savedGuidedResults = guidedTestResultsForSavedProfile(payload.guidedTestResults);

  const threshold = Number(payload.threshold);
  if (Number.isFinite(threshold)) {
    const clampedThreshold = clamp(threshold, Number(thresholdRange.min), Number(thresholdRange.max));
    thresholdRange.value = clampedThreshold.toFixed(2);
    thresholdValue.textContent = clampedThreshold.toFixed(2);
    calibratedThresholdResult.textContent = clampedThreshold.toFixed(3);
  }

  const holdFrames = Number(payload.holdFrames);
  if (Number.isFinite(holdFrames)) {
    const clampedHoldFrames = Math.round(clamp(holdFrames, Number(holdFramesRange.min), Number(holdFramesRange.max)));
    holdFramesRange.value = clampedHoldFrames.toString();
    holdFramesValue.textContent = clampedHoldFrames.toString();
  }

  state.calibration.active = true;
  state.calibration.stepIndex = CALIBRATION_STEPS.findIndex((step) => step.id === "review");
  state.calibration.collecting = false;
  state.calibration.collectStartedAt = 0;
  state.calibration.confirmed = true;
  state.calibration.completedStepIds = ["position", "open", "closed", "short", "long", "review"];
  state.calibration.activeTestCode = "";
  state.calibration.guidedTestResults = savedGuidedResults;
  state.calibration.samples.openEar = numericSamples(payload.samples?.openEar);
  state.calibration.samples.closedEar = numericSamples(payload.samples?.closedEar);
  state.calibration.samples.shortBlinkDurations = numericSamples(payload.samples?.shortBlinkDurations);
  state.calibration.samples.longBlinkDurations = numericSamples(payload.samples?.longBlinkDurations);

  const savedDate = payload.savedAt ? new Date(payload.savedAt) : null;
  const savedDateText =
    savedDate && !Number.isNaN(savedDate.getTime())
      ? savedDate.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "本地";
  guidedTestStatus.textContent = `已载入同一患者本地校准档案（${savedDateText}）。更换患者或状态变化时请重置。`;
  setCommunicationMessage("已载入校准档案，可以开始通信输入。", "校准已载入");
  addLog("已载入本机保存的校准档案");
  updateCalibrationUI();
  return true;
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
  const isTestStep = step.kind === "test";
  const activeCalibrationStepIndex = Math.max(1, state.calibration.stepIndex);
  const activeCalibrationStepCount = CALIBRATION_STEPS.length - 1;
  const isConfirmed = state.calibration.confirmed;
  const isWaitingForCamera =
    state.calibration.active &&
    !state.running &&
    !isConfirmed &&
    step.kind !== "check" &&
    step.kind !== "test";
  const canCollect =
    state.calibration.active &&
    state.running &&
    !state.calibration.collecting &&
    step.kind !== "check" &&
    step.kind !== "test";
  const canAdvance =
    state.calibration.active &&
    !state.calibration.collecting &&
    complete &&
    state.calibration.stepIndex < CALIBRATION_STEPS.length - 1;
  const canConfirm =
    state.calibration.active &&
    isTestStep &&
    hasCompletedCoreCalibration() &&
    !state.calibration.activeTestCode &&
    !isConfirmed;
  calibrationStatus.textContent = state.calibration.active
    ? isConfirmed
      ? "已确认"
      : `${activeCalibrationStepIndex}/${activeCalibrationStepCount}${state.calibration.collecting ? " 采集中" : ""}`
    : "未开始";
  if (!state.calibration.active) {
    calibrationTitle.textContent = "准备校准";
    calibrationInstruction.textContent = "先点击摄像头区域的“启动”，确认人脸完整、光线稳定后点击“开始校准”。";
  } else if (isConfirmed) {
    calibrationTitle.textContent = "校准已完成";
    calibrationInstruction.textContent = "可以开始通信输入；同一患者下次打开会自动沿用，状态变化明显时再重新校准。";
  } else if (isWaitingForCamera) {
    calibrationTitle.textContent = step.title;
    calibrationInstruction.textContent = "请先点击摄像头区域的“启动”并允许摄像头权限，看到人脸后再采集。";
  } else {
    calibrationTitle.textContent = step.title;
    calibrationInstruction.textContent = step.instruction;
  }
  calibrationProgress.style.width = isTestStep
    ? hasCompletedCoreCalibration()
      ? "100%"
      : `${Math.round((guidedTestPassedCount() / GUIDED_TEST_CODES.length) * 100)}%`
    : complete
      ? "100%"
      : "0%";
  calibrationStartButton.textContent = state.calibration.active ? "重新校准" : "开始校准";
  calibrationCollectButton.textContent = isWaitingForCamera
    ? "等待摄像头"
    : state.calibration.collecting
      ? "采集中"
      : step.kind === "blink"
        ? "开始记录"
        : "采集";
  calibrationCollectButton.hidden =
    !state.calibration.active || isConfirmed || isTestStep || step.kind === "check";
  calibrationCollectButton.disabled = !canCollect;
  calibrationNextButton.hidden = !state.calibration.active || !isTestStep || isConfirmed;
  calibrationNextButton.textContent = isTestStep
    ? isConfirmed
      ? "已确认"
      : "完成确认"
    : "下一步";
  calibrationNextButton.disabled = isTestStep ? !canConfirm : !canAdvance;
  calibrationResetButton.hidden = !state.calibration.active;
  guidedTestSelect.disabled =
    !state.calibration.active || !isTestStep || Boolean(state.calibration.activeTestCode);
  guidedTestButton.disabled =
    !state.running ||
    !state.calibration.active ||
    !isTestStep ||
    Boolean(state.calibration.activeTestCode);
  updateCalibrationSummary();
}

function resetCalibration() {
  cancelSpeech();
  clearBlinkCodeBuffer();
  clearSeparatedLongBlink();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  clearSavedCalibrationProfile();
  state.calibration.active = false;
  state.calibration.stepIndex = 0;
  state.calibration.collecting = false;
  state.calibration.collectStartedAt = 0;
  state.calibration.confirmed = false;
  state.calibration.completedStepIds = [];
  state.calibration.activeTestCode = "";
  state.calibration.guidedRestFirstLongAt = 0;
  state.calibration.guidedTestResults = {};
  state.calibration.samples.openEar = [];
  state.calibration.samples.closedEar = [];
  state.calibration.samples.shortBlinkDurations = [];
  state.calibration.samples.longBlinkDurations = [];
  calibratedThresholdResult.textContent = "--";
  guidedTestStatus.textContent = "校准已重置。点击“开始校准”后按提示采集。";
  updateCalibrationUI();
  addLog("引导校准已重置，本地校准档案已清除");
}

function startCalibrationGuide() {
  cancelSpeech();
  clearBlinkCodeBuffer();
  clearSeparatedLongBlink();
  clearPendingConfirmation();
  resetGestureSequences();
  state.calibration.active = true;
  state.calibration.stepIndex = CALIBRATION_STEPS.findIndex((step) => step.id === "open");
  state.calibration.collecting = false;
  state.calibration.collectStartedAt = 0;
  state.calibration.confirmed = false;
  state.calibration.completedStepIds = [];
  state.calibration.activeTestCode = "";
  state.calibration.guidedRestFirstLongAt = 0;
  state.calibration.guidedTestResults = {};
  state.calibration.samples.openEar = [];
  state.calibration.samples.closedEar = [];
  state.calibration.samples.shortBlinkDurations = [];
  state.calibration.samples.longBlinkDurations = [];
  calibratedThresholdResult.textContent = "--";
  markCalibrationStepComplete("position");
  guidedTestStatus.textContent = state.running
    ? "请保持自然睁眼，准备好后点击“采集”。"
    : "请先点击摄像头区域的“启动”，看到人脸后再采集。";
  updateCalibrationUI();
  addLog("引导校准已开始");
}

function prepareCurrentCalibrationStep() {
  const step = currentCalibrationStep();
  if (step.kind === "test") {
    const nextCode = GUIDED_TEST_CODES.find((testCode) => !state.calibration.guidedTestResults[testCode]?.passed);
    if (nextCode) {
      guidedTestSelect.value = nextCode;
    }
    guidedTestStatus.textContent = hasCompletedGuidedTests()
      ? "短码测试已全部通过，也可以重新选择项目复测。"
      : `核心校准完成，可直接点“完成确认”。短码测试可选，当前进度 ${guidedTestProgressText()}。`;
    return;
  }

  guidedTestStatus.textContent =
    step.kind === "blink"
      ? `${step.title}：点击“开始记录”后按提示做动作。`
      : `${step.title}：准备好后点击“采集”。`;
}

function advanceToNextCalibrationStep() {
  state.calibration.collecting = false;
  calibrationProgress.classList.remove("is-collecting");
  state.calibration.stepIndex = Math.min(state.calibration.stepIndex + 1, CALIBRATION_STEPS.length - 1);
  prepareCurrentCalibrationStep();
  updateCalibrationUI();
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

  if (step.kind === "test") {
    if (state.calibration.activeTestCode) {
      guidedTestStatus.textContent = "当前测试还在等待输入，请先完成或重置校准。";
      addLog("短码测试等待输入中，暂不能完成确认");
      return;
    }

    markCalibrationStepComplete(step.id);
    state.calibration.confirmed = true;
    guidedTestStatus.textContent = hasCompletedGuidedTests()
      ? "全部短码测试已通过，校准已确认。工程测试仍可继续复测。"
      : `校准已确认。工程测试可继续验证短码，当前进度 ${guidedTestProgressText()}。`;
    setCommunicationMessage("校准已确认，可以开始通信输入。", "校准完成");
    addLog("引导校准已确认完成");
    saveCalibrationProfile();
    updateCalibrationUI();
    return;
  }

  if (!isCalibrationStepComplete(step.id)) {
    addLog("当前校准步骤尚未完成");
    return;
  }

  advanceToNextCalibrationStep();
}

function beginCalibrationCollection() {
  if (!state.calibration.active) {
    startCalibrationGuide();
  }

  if (!state.running) {
    guidedTestStatus.textContent = "请先启动摄像头，再采集校准样本。";
    addLog("请先启动摄像头再采集校准样本");
    return;
  }

  const step = currentCalibrationStep();
  if (step.kind === "check") {
    advanceToNextCalibrationStep();
    return;
  }

  if (step.kind === "test") {
    guidedTestStatus.textContent = "核心校准已完成，可直接点“完成确认”。短码测试是可选验证。";
    return;
  }

  state.calibration.active = true;
  state.calibration.collecting = true;
  state.calibration.collectStartedAt = performance.now();
  if (step.sampleKey) {
    state.calibration.samples[step.sampleKey] = [];
  }
  calibrationProgress.style.width = "0%";
  calibrationProgress.classList.add("is-collecting");
  guidedTestStatus.textContent =
    step.kind === "blink"
      ? `${step.title}采集中，请按提示做动作。`
      : `${step.title}采集中，请保持姿势。`;
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
  calibrationProgress.classList.remove("is-collecting");
  markCalibrationStepComplete(step.id);
  if (step.id === "closed") {
    applyCalibratedThreshold();
  }
  updateCalibrationUI();
  addLog(`完成采集：${step.title}`);

  if (state.calibration.stepIndex < CALIBRATION_STEPS.length - 1) {
    advanceToNextCalibrationStep();
  }
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

  if (!state.calibration.active || currentCalibrationStep().kind !== "test") {
    guidedTestStatus.textContent = "请先完成前面校准步骤，并进入“测试短码”。";
    addLog("尚未进入短码测试步骤");
    return;
  }

  if (!hasCompletedCoreCalibration()) {
    guidedTestStatus.textContent = "请先完成睁眼、闭眼、短眨和长闭眼样本采集。";
    addLog("核心校准未完成，暂不能测试短码");
    return;
  }

  clearBlinkCodeBuffer();
  clearSeparatedLongBlink();
  clearPendingConfirmation();
  resetGestureSequences();
  state.calibration.guidedRestFirstLongAt = 0;
  state.calibration.activeTestCode = guidedTestSelect.value;
  guidedTestStatus.textContent = `等待输入：${displayBlinkCode(state.calibration.activeTestCode)}`;
  addLog(`开始测试短码 ${state.calibration.activeTestCode}`);
  updateCalibrationUI();
}

function recordGuidedTestCode(
  code,
  { overflowed = false, actionStartedAt = null, actionEndedAt = null, decodedAt = null } = {},
) {
  if (!state.calibration.activeTestCode) {
    return false;
  }

  const expected = state.calibration.activeTestCode;
  if (expected === "--" && code === "-" && !overflowed) {
    const firstLongAt = Number.isFinite(decodedAt)
      ? decodedAt
      : Number.isFinite(actionEndedAt)
        ? actionEndedAt
        : performance.now();
    const secondLongAt = Number.isFinite(actionStartedAt) ? actionStartedAt : firstLongAt;
    const hasFirstLong =
      state.calibration.guidedRestFirstLongAt &&
      secondLongAt - state.calibration.guidedRestFirstLongAt <= BLINK_SYMBOLS.separatedLongWindowMs;

    if (!hasFirstLong) {
      state.calibration.guidedRestFirstLongAt = firstLongAt;
      updatePendingTestRecord({
        expected,
        received: "-",
        correct: null,
        note: "guided_test_waiting_second_long_blink",
      });
      guidedTestStatus.textContent = "已收到第一次长闭眼，请在 6 秒内再做一次长闭眼。";
      addLog("两次长闭眼测试：已收到第一次长闭眼，等待第二次");
      finishPendingTestRecord();
      updateCalibrationUI();
      return true;
    }

    state.calibration.guidedRestFirstLongAt = 0;
    code = "--";
  } else {
    state.calibration.guidedRestFirstLongAt = 0;
  }

  const ok = !overflowed && code === expected;
  updatePendingTestRecord({
    expected,
    received: overflowed ? "overflow" : code,
    correct: ok,
    note: "guided_test",
  });
  state.calibration.guidedTestResults[expected] = {
    passed: ok,
    received: overflowed ? "overflow" : code,
  };
  addLog(`短码测试${ok ? "通过" : "不匹配"}：${expected} / ${overflowed ? "overflow" : code}`);
  state.calibration.activeTestCode = "";
  if (ok) {
    const nextCode = GUIDED_TEST_CODES.find((testCode) => !state.calibration.guidedTestResults[testCode]?.passed);
    if (nextCode) {
      guidedTestSelect.value = nextCode;
      guidedTestStatus.textContent = `通过：收到 ${displayBlinkCode(code)}。可点“完成确认”，也可继续测试 ${displayBlinkCode(nextCode)}。进度 ${guidedTestProgressText()}。`;
    } else {
      guidedTestStatus.textContent = "全部短码测试已通过，可以点击“完成确认”。";
    }
  } else {
    guidedTestStatus.textContent = `不匹配：期望 ${displayBlinkCode(expected)}，收到 ${overflowed ? "过长短码" : displayBlinkCode(code)}。请重新点“测试”。`;
  }
  finishPendingTestRecord();
  updateCalibrationUI();
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

function resolveSeparatedLongBlinkRest({ code, actionStartedAt = null, actionEndedAt = null, decodedAt = null } = {}) {
  if (code !== "-" || !hasConfirmedCalibration()) {
    return false;
  }

  const firstLongAt = Number.isFinite(decodedAt)
    ? decodedAt
    : Number.isFinite(actionEndedAt)
      ? actionEndedAt
      : performance.now();
  const secondLongAt = Number.isFinite(actionStartedAt) ? actionStartedAt : firstLongAt;
  const hasFirstLong =
    state.pendingSeparatedLongAt && secondLongAt - state.pendingSeparatedLongAt <= BLINK_SYMBOLS.separatedLongWindowMs;

  if (!hasFirstLong) {
    state.pendingSeparatedLongAt = firstLongAt;
    setCommunicationMessage("已收到一次长闭眼；6 秒内再做一次会表达“我想休息”。", "长闭眼 1/2");
    addLog("一次长闭眼：等待第二次长闭眼表达我想休息");
    finishPendingTestRecord({ note: "waiting_second_long_blink_for_rest" });
    return true;
  }

  clearSeparatedLongBlink();
  updatePendingTestRecord({
    code: "--",
    received: "--",
    label: `短码 ${displayBlinkCode("--")}`,
  });
  const action = getActionConfigByGestureId(BLINK_CODE_GESTURE_IDS["--"]);
  executeConfiguredAction(action, action?.label || `短码 ${displayBlinkCode("--")}`);
  return true;
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
    finishPendingTestRecord({ note: "single_short_blink_ignored_in_confirmation" });
    return true;
  }

  if (code === "-") {
    clearPendingConfirmation();
    setCommunicationMessage("已取消", `${pending.label}已取消`);
    addLog(`${pending.label}：已取消`);
    finishPendingTestRecord({ text: "已取消", label: `${pending.label}已取消` });
    return true;
  }

  setCommunicationMessage("确认未识别：请连续两次短眨确认，长闭眼取消。", pending.label);
  addLog(`${pending.label}：未识别确认短码 ${code}`);
  finishPendingTestRecord({ note: "unrecognized_confirmation_code" });
  return true;
}

function decodeBlinkCode() {
  if (state.blinkClosedAt !== null || state.blinkWasClosed) {
    window.clearTimeout(state.blinkDecodeTimer);
    state.blinkDecodeTimer = window.setTimeout(decodeBlinkCode, BLINK_SYMBOLS.closedDeferMs);
    return;
  }

  const code = state.blinkCodeBuffer.join("");
  if (!code) {
    clearBlinkCodeBuffer();
    return;
  }

  const overflowed = state.blinkCodeOverflow;
  const decodedAt = performance.now();
  const actionStartedAt = state.blinkCodeStartedAt;
  const actionEndedAt = state.blinkCodeLastAt ?? decodedAt;
  const durations = [...state.blinkCodeDurations];
  recordTestAction({
    type: "blink_code",
    source: "blink",
    label: `短码 ${displayBlinkCode(code)}`,
    code,
    received: overflowed ? "overflow" : code,
    actionStartedAtMs: actionStartedAt,
    actionEndedAtMs: actionEndedAt,
    detectedAtMs: decodedAt,
    durationMs:
      Number.isFinite(actionStartedAt) && Number.isFinite(actionEndedAt) ? actionEndedAt - actionStartedAt : null,
    note: durations.length ? `blinkDurations=${durations.map((duration) => Math.round(duration)).join("|")}` : "",
  });
  clearBlinkCodeBuffer();

  if (overflowed) {
    if (recordGuidedTestCode(code, { overflowed: true, actionStartedAt, actionEndedAt, decodedAt })) {
      return;
    }
    setCommunicationMessage("短码过长，已忽略", "短码");
    addLog(`短码过长 ${code}，已忽略`);
    finishPendingTestRecord({ note: "overflow_ignored" });
    return;
  }

  if (recordGuidedTestCode(code, { actionStartedAt, actionEndedAt, decodedAt })) {
    return;
  }

  if (resolveSecondarySelectionBlinkCode(code)) {
    return;
  }

  if (resolvePendingConfirmation(code)) {
    return;
  }

  if (code === ".") {
    clearSeparatedLongBlink();
    addLog("忽略单次短眨");
    finishPendingTestRecord({ note: "single_short_blink_ignored" });
    return;
  }

  if (code === "-") {
    if (resolveSeparatedLongBlinkRest({ code, actionStartedAt, actionEndedAt, decodedAt })) {
      return;
    }

    addLog("忽略单次长闭眼（仅确认场景中用于取消；校准后两次长闭眼表达我想休息）");
    finishPendingTestRecord({ note: "single_long_blink_ignored" });
    return;
  }

  const gestureId = BLINK_CODE_GESTURE_IDS[code];
  const action = getActionConfigByGestureId(gestureId);
  if (action) {
    clearSeparatedLongBlink();
    if (!hasConfirmedCalibration()) {
      setCommunicationMessage(`短码 ${displayBlinkCode(code)} 已识别；完成并确认引导校准后才播报短语。`, "未确认");
      addLog(`短码 ${displayBlinkCode(code)} 已识别，因引导校准未确认而未播报`);
      finishPendingTestRecord({ note: "calibration_not_confirmed" });
      return;
    }

    executeConfiguredAction(action, action.label || `短码 ${displayBlinkCode(code)}`);
    return;
  }

  setCommunicationMessage(`未识别编码：${displayBlinkCode(code)}`, "短码");
  addLog(`未识别短码 ${code}`);
  finishPendingTestRecord({ note: "unrecognized_code" });
}

function enqueueBlinkSymbol(symbol, meta = {}) {
  if (!blinkCodeToggle.checked || isRecognitionPaused(performance.now())) {
    return;
  }

  if (state.calibration.active && !state.calibration.confirmed && currentCalibrationStep().kind !== "test") {
    return;
  }

  if (state.blinkCodeBuffer.length === 0) {
    state.blinkCodeStartedAt = meta.actionStartedAtMs ?? meta.actionEndedAtMs ?? performance.now();
    state.blinkCodeDurations = [];
  }
  state.blinkCodeLastAt = meta.actionEndedAtMs ?? performance.now();
  if (Number.isFinite(meta.durationMs)) {
    state.blinkCodeDurations.push(meta.durationMs);
  }
  state.blinkCodeBuffer.push(symbol);
  if (state.blinkCodeBuffer.length > 3) {
    state.blinkCodeOverflow = true;
  }

  updateCodeBuffer();
  window.clearTimeout(state.blinkDecodeTimer);
  const decodeDelay = getBlinkDecodeDelay();
  state.blinkDecodeTimer = window.setTimeout(decodeBlinkCode, decodeDelay);
}

function getBlinkDecodeDelay() {
  const code = state.blinkCodeBuffer.join("");

  if (state.blinkCodeOverflow || code.length >= 3) {
    return BLINK_SYMBOLS.finalDecodeDelayMs;
  }

  if (code.length === 1) {
    return BLINK_SYMBOLS.singleSymbolDecodeDelayMs;
  }

  if (BLINK_CODE_GESTURE_IDS[code]) {
    return code === ".." ? BLINK_SYMBOLS.decodeDelayMs : BLINK_SYMBOLS.finalDecodeDelayMs;
  }

  return code.includes("-") ? BLINK_SYMBOLS.longSequenceDecodeDelayMs : BLINK_SYMBOLS.decodeDelayMs;
}

function pauseRecognition({ preserveMessage = false } = {}) {
  state.pausedUntil = Number.POSITIVE_INFINITY;
  clearBlinkCodeBuffer();
  clearSeparatedLongBlink();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  resetDetectionWindow();
  pauseRecognitionButton.querySelector("span").textContent = "继续";
  if (!preserveMessage) {
    setCommunicationMessage("识别已暂停", "休息");
  }
}

function resumeRecognition() {
  state.pausedUntil = 0;
  clearSeparatedLongBlink();
  clearPendingConfirmation();
  clearSecondarySelection();
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

function createHoldDetector({
  name,
  threshold,
  peakThreshold = threshold,
  minHoldMs,
  cooldownMs,
  releaseMinMs = 0,
  onTrigger,
}) {
  let active = false;
  let startedAt = 0;
  let releaseStartedAt = 0;
  let peakValue = 0;
  let lastTriggerAt = 0;

  return {
    reset() {
      active = false;
      startedAt = 0;
      releaseStartedAt = 0;
      peakValue = 0;
    },
    update(value, now, enabled) {
      if (!enabled || isRecognitionPaused(now)) {
        this.reset();
        return;
      }

      if (value >= threshold) {
        releaseStartedAt = 0;
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

      if (!releaseStartedAt) {
        releaseStartedAt = now;
      }

      if (now - releaseStartedAt < releaseMinMs) {
        return;
      }

      const duration = releaseStartedAt - startedAt;
      active = false;
      releaseStartedAt = 0;

      if (duration >= minHoldMs && peakValue >= peakThreshold && now - lastTriggerAt >= cooldownMs) {
        lastTriggerAt = now;
        onTrigger({ name, duration, value: peakValue });
      }
    },
  };
}

const gestureDetectors = {
  brow: createHoldDetector({
    name: "BROW_RAISE",
    threshold: 0.1,
    peakThreshold: 0.14,
    minHoldMs: 250,
    cooldownMs: 1300,
    releaseMinMs: 90,
    onTrigger: (event) => handleGestureEvent(event, "抬眉"),
  }),
  secondaryBrow: createHoldDetector({
    name: "BROW_RAISE",
    threshold: 0.045,
    peakThreshold: 0.065,
    minHoldMs: 120,
    cooldownMs: 900,
    releaseMinMs: 40,
    onTrigger: (event) => handleGestureEvent(event, "抬眉"),
  }),
  mouth: createHoldDetector({
    name: "MOUTH_OPEN",
    threshold: 0.055,
    peakThreshold: 0.075,
    minHoldMs: 180,
    cooldownMs: 300,
    releaseMinMs: 50,
    onTrigger: (event) => handleGestureEvent(event, "张嘴"),
  }),
  smile: createHoldDetector({
    name: "SMILE",
    threshold: 0.09,
    peakThreshold: 0.12,
    minHoldMs: 250,
    cooldownMs: 450,
    releaseMinMs: 120,
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

    const direction = yaw > HEAD_SHAKE_YAW_THRESHOLD ? "right" : yaw < -HEAD_SHAKE_YAW_THRESHOLD ? "left" : "";
    if (!direction) {
      if (this.windowStartedAt && now - this.windowStartedAt > 3200) {
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

    if (this.changeCount >= 2 && now - this.windowStartedAt <= 4000 && now - this.lastTriggerAt >= 1000) {
      const duration = now - this.windowStartedAt;
      const peakValue = Math.abs(yaw);
      this.lastTriggerAt = now;
      this.reset();
      handleGestureEvent({ name: "HEAD_SHAKE", duration, value: peakValue }, "摇头");
    }

    if (this.windowStartedAt && now - this.windowStartedAt > 4000) {
      this.reset();
    }
  },
};

function recordGestureAction(event, label, received = event.name, detectedAt = performance.now()) {
  recordTestAction({
    type: "gesture",
    source: event.name,
    label,
    received,
    actionStartedAtMs: detectedAt - event.duration,
    actionEndedAtMs: detectedAt,
    detectedAtMs: detectedAt,
    durationMs: event.duration,
    note: `peak=${(event.value || 0).toFixed(3)}`,
  });
  return detectedAt;
}

function handleSmileGesture(event, label) {
  const singleSmileAction = getActionConfigByGestureId(EVENT_GESTURE_IDS.SMILE);
  const doubleSmileAction = getActionConfigByGestureId(EVENT_GESTURE_IDS.SMILE_DOUBLE);

  if (!singleSmileAction && !doubleSmileAction) {
    recordGestureAction(event, label);
    addLog(`${label}动作已识别，但没有启用对应语义`);
    finishPendingTestRecord({ note: "action_config_disabled" });
    return;
  }

  if (!doubleSmileAction) {
    recordGestureAction(event, label);
    executeConfiguredAction(singleSmileAction, singleSmileAction.label);
    return;
  }

  if (state.gestureSequences.smileTimer) {
    const pending = state.gestureSequences.smilePending;
    const detectedAt = performance.now();
    const gap = pending ? detectedAt - pending.detectedAt : 0;

    if (gap < SMILE_DOUBLE_MIN_GAP_MS) {
      addLog(`微笑间隔 ${Math.round(gap)}ms 过短，按同一次微笑观察`);
      return;
    }

    window.clearTimeout(state.gestureSequences.smileTimer);
    state.gestureSequences.smileTimer = 0;
    state.gestureSequences.smilePending = null;
    recordGestureAction(event, doubleSmileAction.label, EVENT_GESTURE_IDS.SMILE_DOUBLE, detectedAt);
    executeConfiguredAction(doubleSmileAction, doubleSmileAction.label);
    return;
  }

  state.gestureSequences.smilePending = {
    event: { ...event },
    label,
    detectedAt: performance.now(),
  };
  setCommunicationMessage(`微笑一次已记录；完全放松约半秒后再次微笑会表达“${getActionText(doubleSmileAction)}”。`, "微笑 1/2");
  addLog("微笑 1/2：等待第二次明确微笑");
  state.gestureSequences.smileTimer = window.setTimeout(() => {
    const pending = state.gestureSequences.smilePending;
    state.gestureSequences.smileTimer = 0;
    state.gestureSequences.smilePending = null;

    if (!pending || !singleSmileAction) {
      return;
    }

    recordGestureAction(pending.event, pending.label, EVENT_GESTURE_IDS.SMILE, pending.detectedAt);
    executeConfiguredAction(singleSmileAction, singleSmileAction.label);
  }, SMILE_DOUBLE_WINDOW_MS);
}

function handleGestureEvent(event, label) {
  const gestureId = EVENT_GESTURE_IDS[event.name];
  if (!gestureId) {
    return;
  }

  if (event.name !== "SMILE" || state.calibration.activeTestCode || !hasConfirmedCalibration()) {
    recordGestureAction(event, label);
  }

  if (state.calibration.activeTestCode) {
    setCommunicationMessage(`短码测试中，${label}动作已记录但不执行。`, `${label}测试保护`);
    addLog(`${label}动作：短码测试中未执行`);
    finishPendingTestRecord({ note: "ignored_during_blink_test" });
    return;
  }

  if (!hasConfirmedCalibration()) {
    setCommunicationMessage(`检测到${label}；完成并确认引导校准后才启用动作映射。`, `${label}候选`);
    addLog(`${label}候选：${Math.round(event.duration)}ms，峰值 ${(event.value || 0).toFixed(2)}，校准未确认未播报`);
    finishPendingTestRecord({ note: "calibration_not_confirmed" });
    return;
  }

  if (event.name === "BROW_RAISE") {
    if (selectSecondarySelection(undefined, label)) {
      return;
    }
    if (confirmPendingGesture(label)) {
      return;
    }
    const action = getActionConfigByGestureId(EVENT_GESTURE_IDS.BROW_RAISE);
    executeConfiguredAction(action, action?.label || label);
    return;
  }

  if (event.name === "MOUTH_OPEN") {
    if (getActiveSecondarySelection()) {
      setCommunicationMessage("二级选择中：请用两次短眨或抬眉选择，长闭眼或摇头取消。", "二级选择");
      addLog("二级选择中忽略张嘴动作");
      finishPendingTestRecord({ note: "mouth_ignored_during_secondary_selection" });
      return;
    }

    const now = performance.now();
    const action = getActionConfigByGestureId(EVENT_GESTURE_IDS.MOUTH_DOUBLE_OPEN);
    state.gestureSequences.mouthOpenTimes = state.gestureSequences.mouthOpenTimes.filter(
      (time) => now - time <= MOUTH_DOUBLE_WINDOW_MS,
    );
    state.gestureSequences.mouthOpenTimes.push(now);

    if (state.gestureSequences.mouthOpenTimes.length < 2) {
      const targetText = getActionText(action) || "张嘴两次含义";
      setCommunicationMessage(`张嘴一次已记录，请在 6 秒内再次微张嘴表达“${targetText}”。`, "张嘴 1/2");
      addLog(`${label} 1/2：${Math.round(event.duration)}ms，等待第二次张嘴`);
      finishPendingTestRecord({ note: "mouth_open_1_of_2" });
      return;
    }

    resetGestureSequences();
    executeConfiguredAction(action, action?.label || "张嘴2次");
    return;
  }

  if (event.name === "SMILE") {
    if (getActiveSecondarySelection()) {
      setCommunicationMessage("二级选择中：请用两次短眨或抬眉选择，长闭眼或摇头取消。", "二级选择");
      addLog("二级选择中忽略微笑动作");
      finishPendingTestRecord({ note: "smile_ignored_during_secondary_selection" });
      return;
    }

    handleSmileGesture(event, label);
    return;
  }

  if (event.name === "HEAD_SHAKE") {
    if (cancelSecondarySelection({ sourceLabel: label })) {
      return;
    }
    if (cancelPendingGesture(label)) {
      return;
    }
    const action = getActionConfigByGestureId(EVENT_GESTURE_IDS.HEAD_SHAKE);
    executeConfiguredAction(action, action?.label || label);
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

function estimateHeadPitch(landmarks) {
  if (!hasLandmarkIndices(landmarks, HEAD_YAW_POINTS)) {
    return 0;
  }

  const nose = landmarks[1];
  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];
  const eyeCenterY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
  const eyeWidth = Math.abs(rightEyeOuter.x - leftEyeOuter.x);

  if (eyeWidth === 0) {
    return 0;
  }

  return (nose.y - eyeCenterY) / eyeWidth;
}

function estimateFaceCenterY(landmarks) {
  if (!hasLandmarkIndices(landmarks, [10, 152])) {
    return null;
  }

  return (landmarks[10].y + landmarks[152].y) / 2;
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
      smileBlendshape: 0,
      mouthWidthRatio: 0,
      headYaw: 0,
      headPitch: 0,
      faceScale: null,
      faceCenterY: null,
    };
  }

  const mouthDistance = normalizedLandmarkDistance(landmarks, MOUTH_OPEN_POINTS) ?? 0;
  const mouthWidthDistance = normalizedLandmarkDistance(landmarks, MOUTH_WIDTH_POINTS) ?? 0;
  const referenceWidth = faceReferenceWidth(landmarks);
  const mouthOpenRatio = referenceWidth > 0 ? mouthDistance / referenceWidth : 0;
  const mouthWidthRatio = referenceWidth > 0 ? mouthWidthDistance / referenceWidth : 0;
  const mouthOpenFallback = Math.min(Math.max((mouthOpenRatio - 0.018) / 0.13, 0), 1);
  const mouthOpen = Math.max(getBlendshapeScore(result, "jawOpen"), mouthOpenFallback);
  const smileBlendshape = Math.max(
    getBlendshapeScore(result, "mouthSmileLeft"),
    getBlendshapeScore(result, "mouthSmileRight"),
  );

  return {
    hasFace: true,
    ear: averageEyeAspectRatio(landmarks),
    browUp: Math.max(
      getBlendshapeScore(result, "browInnerUp"),
      getBlendshapeScore(result, "browOuterUpLeft"),
      getBlendshapeScore(result, "browOuterUpRight"),
    ),
    mouthOpen,
    smile: smileBlendshape,
    smileBlendshape,
    mouthWidthRatio,
    headYaw: estimateHeadYaw(landmarks),
    headPitch: estimateHeadPitch(landmarks),
    faceScale: referenceWidth,
    faceCenterY: estimateFaceCenterY(landmarks),
  };
}

function updateSignalBaseline(signals) {
  if (!signals.hasFace) {
    resetSignalBaseline();
    return signals;
  }

  const baseline = state.signalBaseline;
  const smileBlendshape = Number.isFinite(signals.smileBlendshape) ? signals.smileBlendshape : signals.smile;
  const mouthWidthRatio = Number.isFinite(signals.mouthWidthRatio) ? signals.mouthWidthRatio : 0;

  if (!baseline.ready) {
    baseline.ready = true;
    baseline.browUp = signals.browUp;
    baseline.mouthOpen = signals.mouthOpen;
    baseline.smileBlendshape = smileBlendshape;
    baseline.mouthWidthRatio = mouthWidthRatio;
    baseline.headPitch = signals.headPitch;
  } else {
    baseline.browUp += (signals.browUp - baseline.browUp) * 0.015;
    baseline.mouthOpen += (signals.mouthOpen - baseline.mouthOpen) * 0.01;
    baseline.smileBlendshape += (smileBlendshape - baseline.smileBlendshape) * 0.01;
    baseline.mouthWidthRatio += (mouthWidthRatio - baseline.mouthWidthRatio) * 0.01;
    baseline.headPitch += (signals.headPitch - baseline.headPitch) * 0.015;
  }

  const smileBlendshapeDelta = Math.max(0, smileBlendshape - baseline.smileBlendshape);
  const smileWidthDelta = Math.max(0, mouthWidthRatio - baseline.mouthWidthRatio);
  const smileFromWidth = Math.min(smileWidthDelta / SMILE_WIDTH_DELTA_SCALE, 1);

  return {
    ...signals,
    browUp: Math.max(0, signals.browUp - baseline.browUp),
    mouthOpen: Math.max(0, signals.mouthOpen - baseline.mouthOpen),
    smile: Math.max(smileBlendshapeDelta, smileFromWidth),
    smileBlendshapeDelta,
    smileWidthDelta,
    headPitchDelta: signals.headPitch - baseline.headPitch,
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

function isFaceScaleUnstable(signals, now) {
  const scale = signals.faceScale;
  if (!signals.hasFace || !Number.isFinite(scale) || scale <= 0) {
    state.faceStability.lastScale = null;
    state.faceStability.unstableUntil = 0;
    return false;
  }

  const previousScale = state.faceStability.lastScale;
  state.faceStability.lastScale = scale;

  if (Number.isFinite(previousScale) && previousScale > 0) {
    const absoluteJump = Math.abs(scale - previousScale);
    const relativeJump = absoluteJump / previousScale;
    if (
      absoluteJump >= FACE_SCALE_STABILITY.absoluteJump &&
      relativeJump >= FACE_SCALE_STABILITY.relativeJump
    ) {
      state.faceStability.unstableUntil = now + FACE_SCALE_STABILITY.settleMs;
    }
  }

  return now < state.faceStability.unstableUntil;
}

function isHeadMotionSuppressingBrow(signals, detectionSignals, now) {
  const pitch = signals.headPitch;
  const centerY = signals.faceCenterY;
  const guard = state.headMotionGuard;

  if (!signals.hasFace || !Number.isFinite(pitch)) {
    guard.lastPitch = null;
    guard.lastCenterY = null;
    guard.browBlockedUntil = 0;
    return false;
  }

  const pitchDelta = Math.abs(detectionSignals.headPitchDelta || 0);
  const pitchJump = Number.isFinite(guard.lastPitch) ? Math.abs(pitch - guard.lastPitch) : 0;
  const centerJump =
    Number.isFinite(guard.lastCenterY) && Number.isFinite(centerY) ? Math.abs(centerY - guard.lastCenterY) : 0;

  guard.lastPitch = pitch;
  guard.lastCenterY = Number.isFinite(centerY) ? centerY : null;

  if (
    pitchDelta >= BROW_HEAD_MOTION_GUARD.pitchDelta ||
    pitchJump >= BROW_HEAD_MOTION_GUARD.pitchJump ||
    centerJump >= BROW_HEAD_MOTION_GUARD.centerJump
  ) {
    guard.browBlockedUntil = now + BROW_HEAD_MOTION_GUARD.settleMs;
  }

  return now < guard.browBlockedUntil;
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

  if (!window.isSecureContext) {
    setStatus("需要安全连接", "error");
    addLog("摄像头需要 HTTPS 或本机安全环境");
    showDiagnostic(
      "摄像头需要安全连接",
      "请使用 HTTPS 地址，或在本机 localhost/桌面应用中打开。",
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
    clearSecondarySelection();
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
    stopButton.classList.add("is-danger");
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
    updateCalibrationUI();
  }
}

function stopCamera(clearStatus = true) {
  state.running = false;
  cancelAnimationFrame(state.rafId);
  stopButton.classList.remove("is-danger");
  emergencyOverlay.classList.remove("is-active");
  if (emergencyFlashTimer) {
    clearTimeout(emergencyFlashTimer);
    emergencyFlashTimer = null;
  }
  state.stream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
  video.pause();
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  videoEmpty.classList.remove("hidden");
  setControlsBusy(state.starting);
  updateCalibrationUI();

  if (clearStatus) {
    setStatus("已停止", "idle");
    resetDetectionWindow();
    clearBlinkCodeBuffer();
    clearPendingConfirmation();
    clearSecondarySelection();
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
  state.lastFps = average;
  fpsValue.textContent = Math.round(average).toString();
}

function processFaceSignals(signals, now) {
  const detectionSignals = updateSignalBaseline(signals);
  state.lastSignals = { ...signals, ...detectionSignals };
  updateGestureMeters(detectionSignals);

  if (isRecognitionPaused(now)) {
    blinkState.textContent = "暂停";
    resetDetectionWindow();
    resetGestureSequences();
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.reset();
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
    gestureDetectors.secondaryBrow.reset();
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
    gestureDetectors.secondaryBrow.reset();
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

  if (isFaceScaleUnstable(signals, now)) {
    lastGesture.textContent = "画面稳定中";
    resetGestureSequences();
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.reset();
    gestureDetectors.mouth.reset();
    gestureDetectors.smile.reset();
    headShakeDetector.reset();
    return;
  }

  const mouthLooksActive = detectionSignals.mouthOpen >= MOUTH_SMILE_SUPPRESS_THRESHOLD;
  const smileLooksActive = smileToggle.checked && detectionSignals.smile >= SMILE_MOUTH_SUPPRESS_THRESHOLD;
  const headMotionSuppressesBrow = isHeadMotionSuppressingBrow(signals, detectionSignals, now);
  const secondarySelectionActive = Boolean(getActiveSecondarySelection(now));

  gestureDetectors.mouth.update(
    smileLooksActive && !mouthLooksActive ? 0 : detectionSignals.mouthOpen,
    now,
    mouthToggle.checked,
  );

  if (secondarySelectionActive) {
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.update(detectionSignals.browUp, now, browToggle.checked);
  } else if (headMotionSuppressesBrow) {
    if (browToggle.checked) {
      lastGesture.textContent = "点头中，抬眉暂停";
    }
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.reset();
  } else if (detectionSignals.mouthOpen >= MOUTH_BROW_SUPPRESS_THRESHOLD) {
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.reset();
  } else {
    gestureDetectors.secondaryBrow.reset();
    gestureDetectors.brow.update(detectionSignals.browUp, now, browToggle.checked);
  }

  gestureDetectors.smile.update(mouthLooksActive ? 0 : detectionSignals.smile, now, smileToggle.checked);
  headShakeDetector.update(detectionSignals.headYaw, now, headShakeToggle.checked);
}

function handleBlinkReleased(now, ear) {
  const blinkStartedAt = state.blinkClosedAt;
  const duration = blinkStartedAt ? now - blinkStartedAt : 0;
  state.blinkWasClosed = false;
  state.blinkClosedAt = null;

  if (duration >= BLINK_SYMBOLS.restMinMs) {
    addLog(`闭眼休息 ${Math.round(duration)}ms`);
    return;
  }

  if (duration >= BLINK_SYMBOLS.longMinMs && duration <= BLINK_SYMBOLS.longMaxMs) {
    recordCalibrationBlink("-", duration);
    enqueueBlinkSymbol("-", {
      actionStartedAtMs: blinkStartedAt,
      actionEndedAtMs: now,
      durationMs: duration,
    });
    addLog(`长闭眼 ${Math.round(duration)}ms（EAR ${ear.toFixed(3)}）`);
    return;
  }

  if (duration >= BLINK_SYMBOLS.shortMinMs && duration <= BLINK_SYMBOLS.shortMaxMs) {
    recordCalibrationBlink(".", duration);
    enqueueBlinkSymbol(".", {
      actionStartedAtMs: blinkStartedAt,
      actionEndedAtMs: now,
      durationMs: duration,
    });
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
  clearSecondarySelection();
  resetGestureSequences();
  blinkCount.textContent = "0";
  blinkState.textContent = state.running ? "检测中" : "未检测";
  emergencyOverlay.classList.remove("is-active");
  if (emergencyFlashTimer) {
    clearTimeout(emergencyFlashTimer);
    emergencyFlashTimer = null;
  }
  addLog("计数已清零");
}

thresholdRange.addEventListener("input", () => {
  thresholdValue.textContent = Number(thresholdRange.value).toFixed(2);
  if (hasConfirmedCalibration()) {
    saveCalibrationProfile({ silent: true });
  }
});

holdFramesRange.addEventListener("input", () => {
  holdFramesValue.textContent = holdFramesRange.value;
  if (hasConfirmedCalibration()) {
    saveCalibrationProfile({ silent: true });
  }
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

secondarySelectionOptions?.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const optionButton = event.target.closest("button[data-index]");
  if (!optionButton) {
    return;
  }

  selectSecondarySelection(Number(optionButton.dataset.index), "手动点击");
});

secondarySelectionSelectButton?.addEventListener("click", () => {
  selectSecondarySelection(undefined, "手动点击");
});

secondarySelectionCancelButton?.addEventListener("click", () => {
  cancelSecondarySelection({ sourceLabel: "手动取消" });
});

clearSpeechButton.addEventListener("click", () => {
  cancelSpeech();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  setCommunicationMessage("等待输入", "--");
});

blinkCodeToggle.addEventListener("change", () => {
  clearBlinkCodeBuffer();
  clearSeparatedLongBlink();
  clearSecondarySelection();
  updateActionGuide();
});

[browToggle, mouthToggle, smileToggle, headShakeToggle].forEach((toggle) => {
  toggle.addEventListener("change", () => {
    clearSecondarySelection();
    resetGestureSequences();
    updateActionGuide();
  });
});

actionSettingsList?.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  updateActionTextValue(input.dataset.actionId, input.value);
});

actionSettingsList?.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const action = getActionConfigById(button.dataset.actionId);
  if (!action) {
    return;
  }

  if (button.dataset.action === "reset") {
    restoreActionTextDefault(action.id);
    return;
  }

  if (button.dataset.action === "test") {
    const text = getActionText(action);
    if (!text) {
      setActionSettingsStatus(`${action.label} 的表达文字不能为空。`, "error");
      return;
    }
    speak(text);
    setActionSettingsStatus(`正在测试播报：${action.label}`, "success");
  }
});

actionSettingsSaveButton?.addEventListener("click", () => {
  saveActionTextConfig();
});

actionSettingsCancelButton?.addEventListener("click", () => {
  loadSavedActionTextConfig();
  renderActionSettings();
  updateActionGuide();
  setActionSettingsStatus("已取消未保存修改。");
});

actionSettingsExportButton?.addEventListener("click", exportActionTextConfig);

actionSettingsImportButton?.addEventListener("click", () => {
  actionSettingsImportInput?.click();
});

actionSettingsImportInput?.addEventListener("change", () => {
  importActionTextConfig(actionSettingsImportInput.files?.[0]);
});

actionSettingsResetButton?.addEventListener("click", restoreAllActionTextDefaults);

calibrationStartButton.addEventListener("click", startCalibrationGuide);

calibrationCollectButton.addEventListener("click", beginCalibrationCollection);

calibrationNextButton.addEventListener("click", moveToNextCalibrationStep);

calibrationResetButton.addEventListener("click", resetCalibration);

guidedTestButton.addEventListener("click", startGuidedTest);

recordingStartButton.addEventListener("click", startTestRecording);

recordingStopButton.addEventListener("click", stopTestRecording);

recordingMarkCorrectButton.addEventListener("click", () => {
  markLastRecording(true);
});

recordingMarkWrongButton.addEventListener("click", () => {
  markLastRecording(false);
});

recordingExportJsonButton.addEventListener("click", exportRecordingJson);

recordingExportCsvButton.addEventListener("click", exportRecordingCsv);

pauseRecognitionButton.addEventListener("click", () => {
  if (isPausedStateActive()) {
    resumeRecognition();
    addLog("识别已恢复");
    return;
  }

  pauseRecognition();
  addLog("识别已暂停，点击继续后恢复");
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

loadSavedActionTextConfig();
renderActionSettings();
updateActionGuide();
updateRecordingUI();

if (!loadSavedCalibrationProfile()) {
  updateCalibrationUI();
}
