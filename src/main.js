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
import {
  BLINK_CODE_GESTURE_IDS,
  CONSUMED_BLINK_CODE_SUPPRESS_MS,
  DEFAULT_ACTION_CONFIG,
  EVENT_GESTURE_IDS,
  OPTIONAL_INPUT_CHANNEL_DEFINITIONS,
  SECONDARY_SELECTION_SCAN_MS,
  SECONDARY_SELECTION_TIMEOUT_MS,
  SUPPORTED_LANGUAGES,
  applySecondarySelectionGroupLanguage,
  createActionConfig,
  createSecondarySelectionGroups,
  getActionText,
  localizedActionDefault,
  normalizeActionText,
  normalizeLanguage,
  setActionText,
} from "./shared/action-core.js";
import { createFaceQualityTracker } from "./shared/face-quality.js";
import { createFaceRoiPreviewTracker } from "./shared/face-roi-preview.js";
import {
  AAC_COMMANDS,
  AAC_INPUT_EVENTS,
  AAC_INPUT_MODES,
  AAC_QUALITY_STATES,
  DEFAULT_AAC_TIMING,
  createAacInputMachine,
} from "./shared/aac-input-machine.js";
import {
  BROW_HEAD_MOTION_GUARD,
  FACE_SCALE_STABILITY,
  GESTURE_DETECTOR_PARAMS,
  HEAD_SHAKE_PARAMS,
  MOUTH_SEQUENCE_PARAMS,
  SMILE_HEAD_MOTION_GUARD,
  SMILE_SEQUENCE_PARAMS,
} from "./shared/gesture-params.js";
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
const languageToggleButton = document.querySelector("#languageToggleButton");
const runtimeStatus = document.querySelector("#runtimeStatus");
const videoEmpty = document.querySelector("#videoEmpty");
const emergencyOverlay = document.querySelector("#emergencyOverlay");
const cameraSelect = document.querySelector("#cameraSelect");
const thresholdRange = document.querySelector("#thresholdRange");
const thresholdValue = document.querySelector("#thresholdValue");
const holdFramesRange = document.querySelector("#holdFramesRange");
const holdFramesValue = document.querySelector("#holdFramesValue");
const overlayToggle = document.querySelector("#overlayToggle");
const roiPreviewToggle = document.querySelector("#roiPreviewToggle");
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
const faceQualityPanel = document.querySelector("#faceQualityPanel");
const faceQualityLabel = document.querySelector("#faceQualityLabel");
const faceQualityReason = document.querySelector("#faceQualityReason");
const faceQualityBar = document.querySelector("#faceQualityBar");
const faceQualityGateToggle = document.querySelector("#faceQualityGateToggle");
const eventLog = document.querySelector("#eventLog");
const messageText = document.querySelector("#messageText");
const codeBuffer = document.querySelector("#codeBuffer");
const repeatSpeechButton = document.querySelector("#repeatSpeechButton");
const clearSpeechButton = document.querySelector("#clearSpeechButton");
const pauseRecognitionButton = document.querySelector("#pauseRecognitionButton");
const speechStatus = document.querySelector("#speechStatus");
const speechStatusText = document.querySelector("#speechStatusText");
const secondarySelectionPanel = document.querySelector("#secondarySelectionPanel");
const secondarySelectionTitle = document.querySelector("#secondarySelectionTitle");
const secondarySelectionHint = document.querySelector("#secondarySelectionHint");
const secondarySelectionOptions = document.querySelector("#secondarySelectionOptions");
const secondarySelectionSelectButton = document.querySelector("#secondarySelectionSelectButton");
const secondarySelectionCancelButton = document.querySelector("#secondarySelectionCancelButton");
const patientSecondaryBar = document.querySelector("#patientSecondaryBar");
const patientSecondaryTitle = document.querySelector("#patientSecondaryTitle");
const patientSecondaryHint = document.querySelector("#patientSecondaryHint");
const patientSecondaryPrefix = document.querySelector("#patientSecondaryPrefix");
const patientSecondaryCurrent = document.querySelector("#patientSecondaryCurrent");
const patientSecondaryOptions = document.querySelector("#patientSecondaryOptions");
const actionGuideMode = document.querySelector("#actionGuideMode");
const actionGuideList = document.querySelector("#actionGuideList");
const blinkCodeToggle = document.querySelector("#blinkCodeToggle");
const browToggle = document.querySelector("#browToggle");
const mouthToggle = document.querySelector("#mouthToggle");
const smileToggle = document.querySelector("#smileToggle");
const headShakeToggle = document.querySelector("#headShakeToggle");
const inputManagementButton = document.querySelector("#inputManagementButton");
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
const PLATFORM_MODE = new URLSearchParams(window.location.search).get("platform") === "ios" ? "ios" : "mac";
const LANGUAGE_STORAGE_KEY = "alsFacialAac.uiLanguage.v1";

document.documentElement.dataset.platform = PLATFORM_MODE;
document.body.classList.toggle("ios-mode", PLATFORM_MODE === "ios");

const ENGLISH_VOICE_PRIORITY = [
  "Samantha",
  "Alex",
  "Google US English",
  "Microsoft Aria",
  "Microsoft Jenny",
  "Daniel",
  "Karen",
  "Moira",
  "Tessa",
  "Victoria",
  "Fiona",
  "Allison",
];
const AVOIDED_SPEECH_VOICE_PATTERNS = [
  /albert/i,
  /bad news/i,
  /bahh/i,
  /bells/i,
  /boing/i,
  /bubbles/i,
  /cellos/i,
  /deranged/i,
  /fred/i,
  /hysterical/i,
  /jester/i,
  /organ/i,
  /pipe/i,
  /princess/i,
  /ralph/i,
  /superstar/i,
  /trinoids/i,
  /whisper/i,
  /zarvox/i,
];

function readSavedLanguage() {
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return "zh";
  }
}

let currentLanguage = readSavedLanguage();

const UI_TEXT = {
  zh: {
    langCode: "zh-CN",
    speechLang: "zh-CN",
    languageButton: "English",
    appTitle: "ALS 面部微动作 AAC 输入原型",
    appDescription: "ALS 面部微动作 AAC 输入原型，用摄像头识别低疲劳面部动作和眨眼短码。",
    eyebrow: "Personalized Low-Fatigue AAC",
    heading: "面部微动作 AAC 输入原型",
    safetyNotice: "辅助交流工具；不是医疗或紧急救助软件，不可替代护理呼叫、急救电话或专业医疗设备。",
    idleStatus: "待启动",
    cameraPanelLabel: "摄像头预览",
    waitingCamera: "等待摄像头",
    startCamera: "启动",
    stopCamera: "停止",
    resetCounterTitle: "清零计数",
    communicationOutput: "通信输出",
    waitingInput: "等待输入",
    repeatSpeech: "重播",
    repeatSpeechTitle: "重播语音；没有上一句时测试语音",
    speechIdle: "语音待测试",
    speechSpeaking: "正在播报",
    speechOk: "语音正常",
    speechError: "语音不可用，请检查系统音量、输出设备或语音包。",
    speechTestPhrase: "语音测试正常。",
    clearSpeech: "清空",
    pauseRecognition: "暂停",
    secondarySelection: "二级选择",
    secondarySelectionHint: "两次短眨选择，闭眼 3 秒退出",
    patientSecondaryLabel: "患者二级选择",
    patientSecondaryCurrent: "当前选择",
    patientSecondaryHint: "两次短眨或抬眉选择；长闭眼 3 秒退出，8 秒安静",
    selectCurrent: "选择当前",
    cancel: "取消",
    blink: "眨眼",
    state: "状态",
    notDetected: "未检测",
    eyeOpenness: "眼睛开合",
    faceQuality: "人脸质量",
    faceQualityGate: "质量不足时暂停可选面部动作",
    faceQualityInitial: "未见人脸",
    faceQualityInitialReason: "请让患者面部进入画面",
    camera: "摄像头",
    blinkThreshold: "眨眼阈值",
    closedFrames: "闭眼帧数",
    faceOverlay: "面部描边",
    roiPreview: "人脸近景框",
    optionalGestures: "可选动作",
    browMeter: "抬眉 是/确认",
    mouthMeter: "张嘴两次 吸痰",
    smileMeter: "微笑表达",
    headMeter: "摇头取消",
    input: "输入",
    blinkAlwaysOn: "眨眼短码 始终开启",
    browToggle: "抬眉 是/确认",
    mouthToggle: "张嘴两次吸痰",
    headToggle: "摇头 否/取消",
    smileToggle: "微笑表达",
    inputManagement: "输入管理",
    actionGuide: "当前动作说明",
    blinkOnly: "仅眨眼",
    advancedSettings: "高级设置",
    customActionMeaning: "自定义动作含义",
    actionSettingsNote: "只输入一次表达文字；屏幕显示和语音播报使用同一句。",
    save: "保存",
    cancelChanges: "取消修改",
    export: "导出",
    import: "导入",
    resetAllDefaults: "全部默认",
    currentDefaults: "使用当前默认配置。",
    calibration: "引导校准",
    notStarted: "未开始",
    calibrationReadyTitle: "准备画面",
    calibrationReadyInstruction: "启动摄像头后，按提示采集睁眼、闭眼、短眨和长闭眼样本；核心校准完成后即可确认。",
    start: "开始",
    collect: "采集",
    next: "下一步",
    reset: "重置",
    openEye: "睁眼",
    closedEye: "闭眼",
    threshold: "阈值",
    shortBlink: "短眨",
    longBlink: "长闭眼",
    engineerTest: "工程测试",
    testAndExport: "短码验证与记录导出",
    guidedTestLabel: "短码测试项",
    test: "测试",
    engineerTestIdle: "工程测试未启动",
    testRecords: "测试记录",
    notRecording: "未记录",
    entries: "条目",
    accuracy: "正确率",
    textLatency: "文字延迟",
    expectedAction: "预期动作",
    unspecified: "未指定",
    startRecording: "开始记录",
    correct: "正确",
    wrong: "错误",
    cameraNotStarted: "摄像头未启动",
    copyLocalUrl: "复制地址",
    guidedOptions: {
      ".": "单次短眨：应忽略",
      "-": "单次长闭眼：单独不播报",
      "..": "两次短眨：校准后请求帮助",
      "...": "三次短眨：校准后紧急求助",
      "--": "两次长闭眼：应忽略",
      ".-": "短眨+长闭眼：校准后挠痒痒",
      "-.": "长闭眼+短眨：校准后调整体位",
      "--.": "长闭眼+长闭眼+短眨：校准后输入管理",
    },
    expectedOptions: {
      "": "未指定",
      ".": "单次短眨",
      "-": "单次长闭眼",
      "..": "两次短眨",
      "...": "三次短眨",
      "--": "两次长闭眼：应忽略",
      ".-": "短眨+长闭眼",
      "-.": "长闭眼+短眨",
      BROW_RAISE: "抬眉",
      MOUTH_OPEN: "张嘴两次",
      SMILE: "微笑",
      SMILE_DOUBLE: "微笑两次",
      HEAD_SHAKE: "摇头",
    },
  },
  en: {
    langCode: "en",
    speechLang: "en-US",
    languageButton: "Chinese",
    appTitle: "ALS Facial Micro-Movement AAC Input Prototype",
    appDescription: "An ALS facial micro-movement AAC input prototype that detects low-fatigue facial actions and blink codes with a camera.",
    eyebrow: "Personalized Low-Fatigue AAC",
    heading: "Facial Micro-Movement AAC Input",
    safetyNotice: "Communication aid only. Not medical or emergency-response software; do not use it instead of care calls, emergency services, or professional medical devices.",
    idleStatus: "Idle",
    cameraPanelLabel: "Camera preview",
    waitingCamera: "Waiting for camera",
    startCamera: "Start",
    stopCamera: "Stop",
    resetCounterTitle: "Reset counter",
    communicationOutput: "Communication output",
    waitingInput: "Waiting for input",
    repeatSpeech: "Repeat",
    repeatSpeechTitle: "Repeat speech; test speech if no phrase is available",
    speechIdle: "Speech untested",
    speechSpeaking: "Speaking",
    speechOk: "Speech ready",
    speechError: "Speech unavailable. Check system volume, output device, or voice package.",
    speechTestPhrase: "Speech test is working.",
    clearSpeech: "Clear",
    pauseRecognition: "Pause",
    secondarySelection: "Secondary selection",
    secondarySelectionHint: "Double short blink to select; close eyes 3s to exit",
    patientSecondaryLabel: "Patient secondary selection",
    patientSecondaryCurrent: "Current selection",
    patientSecondaryHint: "Double short blink or eyebrow raise to select; 3s exits, 8s quiets",
    selectCurrent: "Select current",
    cancel: "Cancel",
    blink: "Blinks",
    state: "State",
    notDetected: "Not detected",
    eyeOpenness: "Eye openness",
    faceQuality: "Face quality",
    faceQualityGate: "Pause optional facial gestures when quality is poor",
    faceQualityInitial: "No face visible",
    faceQualityInitialReason: "Place the patient’s face in view",
    camera: "Camera",
    blinkThreshold: "Blink threshold",
    closedFrames: "Closed frames",
    faceOverlay: "Face outline",
    roiPreview: "Face ROI preview",
    optionalGestures: "Optional gestures",
    browMeter: "Eyebrow raise Yes/Confirm",
    mouthMeter: "Open mouth twice Suction",
    smileMeter: "Smile expression",
    headMeter: "Head shake cancel",
    input: "Input",
    blinkAlwaysOn: "Blink code always on",
    browToggle: "Eyebrow raise Yes/Confirm",
    mouthToggle: "Open mouth twice for suction",
    headToggle: "Head shake No/Cancel",
    smileToggle: "Smile expression",
    inputManagement: "Input management",
    actionGuide: "Current action guide",
    blinkOnly: "Blink only",
    advancedSettings: "Advanced settings",
    customActionMeaning: "Customize action meanings",
    actionSettingsNote: "Enter the expression once; the same text is used for screen display and speech.",
    save: "Save",
    cancelChanges: "Cancel changes",
    export: "Export",
    import: "Import",
    resetAllDefaults: "Reset all",
    currentDefaults: "Using current defaults.",
    calibration: "Guided calibration",
    notStarted: "Not started",
    calibrationReadyTitle: "Prepare camera view",
    calibrationReadyInstruction: "After starting the camera, collect open-eye, closed-eye, short-blink, and long-closure samples. You can confirm after core calibration is complete.",
    start: "Start",
    collect: "Collect",
    next: "Next",
    reset: "Reset",
    openEye: "Open eye",
    closedEye: "Closed eye",
    threshold: "Threshold",
    shortBlink: "Short blink",
    longBlink: "Long eye closure",
    engineerTest: "Engineering test",
    testAndExport: "Blink-code validation and record export",
    guidedTestLabel: "Blink-code test item",
    test: "Test",
    engineerTestIdle: "Engineering test not started",
    testRecords: "Test records",
    notRecording: "Not recording",
    entries: "Entries",
    accuracy: "Accuracy",
    textLatency: "Text latency",
    expectedAction: "Expected action",
    unspecified: "Unspecified",
    startRecording: "Start recording",
    correct: "Correct",
    wrong: "Wrong",
    cameraNotStarted: "Camera not started",
    copyLocalUrl: "Copy URL",
    guidedOptions: {
      ".": "Single short blink: should be ignored",
      "-": "Single long eye closure: no global speech",
      "..": "Two short blinks: request help after calibration",
      "...": "Three short blinks: emergency after calibration",
      "--": "Two long eye closures: ignored",
      ".-": "Short blink + long eye closure: scratch request after calibration",
      "-.": "Long eye closure + short blink: position adjustment after calibration",
      "--.": "Long + long + short blink: input management after calibration",
    },
    expectedOptions: {
      "": "Unspecified",
      ".": "Single short blink",
      "-": "Single long eye closure",
      "..": "Two short blinks",
      "...": "Three short blinks",
      "--": "Two long eye closures: ignored",
      ".-": "Short blink + long eye closure",
      "-.": "Long eye closure + short blink",
      BROW_RAISE: "Eyebrow raise",
      MOUTH_OPEN: "Open mouth twice",
      SMILE: "Smile",
      SMILE_DOUBLE: "Double smile",
      HEAD_SHAKE: "Head shake",
    },
  },
};

function t(key, params = {}) {
  const dictionary = UI_TEXT[currentLanguage] || UI_TEXT.zh;
  const fallback = UI_TEXT.zh;
  let value = dictionary[key] ?? fallback[key] ?? key;
  Object.entries(params).forEach(([name, replacement]) => {
    value = String(value).replaceAll(`{${name}}`, replacement);
  });
  return value;
}

const STATIC_TEXT_BINDINGS = [
  [".camera-panel", "cameraPanelLabel", "aria-label"],
  [".communication-panel", "communicationOutput", "aria-label"],
  [".patient-secondary-bar", "patientSecondaryLabel", "aria-label"],
  ["#patientSecondaryPrefix", "patientSecondaryCurrent"],
  [".control-panel", "state", "aria-label"],
  [".gesture-panel", "optionalGestures", "aria-label"],
  [".action-guide", "actionGuide", "aria-label"],
  [".action-settings-panel", "advancedSettings", "aria-label"],
  [".calibration-panel", "calibration", "aria-label"],
  [".engineer-panel", "engineerTest", "aria-label"],
  [".recording-panel", "testRecords", "aria-label"],
  [".eyebrow", "eyebrow"],
  ["h1", "heading"],
  [".safety-notice", "safetyNotice"],
  ["#runtimeStatus span:last-child", "idleStatus"],
  ["#videoEmpty span", "waitingCamera"],
  ["#startButton span", "startCamera"],
  ["#stopButton span", "stopCamera"],
  ["#resetButton", "resetCounterTitle", "title"],
  [".message-display .metric-label", "communicationOutput"],
  ["#messageText", "waitingInput"],
  ["#repeatSpeechButton span", "repeatSpeech"],
  ["#repeatSpeechButton", "repeatSpeechTitle", "title"],
  ["#speechStatusText", "speechIdle"],
  ["#clearSpeechButton span", "clearSpeech"],
  ["#clearSpeechButton", "clearSpeech", "title"],
  ["#pauseRecognitionButton span", "pauseRecognition"],
  ["#pauseRecognitionButton", "pauseRecognition", "title"],
  ["#secondarySelectionTitle", "secondarySelection"],
  ["#secondarySelectionHint", "secondarySelectionHint"],
  ["#secondarySelectionSelectButton", "selectCurrent"],
  ["#secondarySelectionCancelButton", "cancel"],
  [".metric:nth-child(1) .metric-label", "blink"],
  [".metric:nth-child(2) .metric-label", "state"],
  ["#blinkState", "notDetected"],
  [".signal-header span:first-child", "eyeOpenness"],
  ["#faceQualityTitle", "faceQuality"],
  ["#faceQualityLabel", "faceQualityInitial"],
  ["#faceQualityReason", "faceQualityInitialReason"],
  ['label:has(#faceQualityGateToggle)', "faceQualityGate", "labelWithInput"],
  ['label[for="cameraSelect"]', "camera"],
  ['label[for="thresholdRange"]', "blinkThreshold"],
  ['label[for="holdFramesRange"]', "closedFrames"],
  ["#overlayToggleText", "faceOverlay"],
  ["#roiPreviewToggleText", "roiPreview"],
  [".gesture-header span:first-child", "optionalGestures"],
  [".gesture-row:nth-child(1) span", "browMeter"],
  [".gesture-row:nth-child(2) span", "mouthMeter"],
  [".gesture-row:nth-child(3) span", "smileMeter"],
  [".gesture-row:nth-child(4) span", "headMeter"],
  ["#inputSectionLabel", "input"],
  [".input-channel-fixed", "blinkAlwaysOn", "labelWithInput"],
  ['label:has(#browToggle)', "browToggle", "labelWithInput"],
  ['label:has(#mouthToggle)', "mouthToggle", "labelWithInput"],
  ['label:has(#headShakeToggle)', "headToggle", "labelWithInput"],
  ['label:has(#smileToggle)', "smileToggle", "labelWithInput"],
  ["#inputManagementButton", "inputManagement"],
  [".action-guide-header span:first-child", "actionGuide"],
  ["#actionGuideMode", "blinkOnly"],
  [".action-settings-panel summary span", "advancedSettings"],
  [".action-settings-panel summary small", "customActionMeaning"],
  [".action-settings-note", "actionSettingsNote"],
  ["#actionSettingsSaveButton span", "save"],
  ["#actionSettingsCancelButton", "cancelChanges"],
  ["#actionSettingsExportButton span", "export"],
  ["#actionSettingsImportButton span", "import"],
  ["#actionSettingsResetButton span", "resetAllDefaults"],
  ["#actionSettingsStatus", "currentDefaults"],
  [".calibration-header span:first-child", "calibration"],
  ["#calibrationStatus", "notStarted"],
  ["#calibrationTitle", "calibrationReadyTitle"],
  ["#calibrationInstruction", "calibrationReadyInstruction"],
  ["#calibrationStartButton", "start"],
  ["#calibrationCollectButton", "collect"],
  ["#calibrationNextButton", "next"],
  ["#calibrationResetButton", "reset"],
  [".calibration-results span:nth-child(1)", "openEye", "prefixStrong"],
  [".calibration-results span:nth-child(2)", "closedEye", "prefixStrong"],
  [".calibration-results span:nth-child(3)", "threshold", "prefixStrong"],
  [".calibration-results span:nth-child(4)", "shortBlink", "prefixStrong"],
  [".calibration-results span:nth-child(5)", "longBlink", "prefixStrong"],
  [".engineer-panel summary span", "engineerTest"],
  [".engineer-panel summary small", "testAndExport"],
  ["#guidedTestSelect", "guidedTestLabel", "aria-label"],
  ["#guidedTestButton", "test"],
  ["#guidedTestStatus", "engineerTestIdle"],
  [".recording-header span:first-child", "testRecords"],
  ["#recordingStatus", "notRecording"],
  [".recording-metrics span:nth-child(1)", "entries", "prefixStrong"],
  [".recording-metrics span:nth-child(2)", "accuracy", "prefixStrong"],
  [".recording-metrics span:nth-child(3)", "textLatency", "prefixStrong"],
  ['label[for="recordingExpectedSelect"]', "expectedAction"],
  ["#recordingStartButton span", "startRecording"],
  ["#recordingStopButton span", "stopCamera"],
  ["#recordingMarkCorrectButton", "correct"],
  ["#recordingMarkWrongButton", "wrong"],
  ["#diagnosticTitle", "cameraNotStarted"],
  ["#copyUrlButton span", "copyLocalUrl"],
  ["#copyUrlButton", "copyLocalUrl", "title"],
];

const RUNTIME_TEXT_EN = {
  "--": "--",
  "待启动": "Idle",
  "等待输入": "Waiting for input",
  "未检测": "Not detected",
  "检测中": "Detecting",
  "记录中": "Recording",
  "已启动": "Started",
  "已停止": "Stopped",
  "已断开": "Disconnected",
  "暂停": "Paused",
  "继续": "Resume",
  "休息": "Rest",
  "安静模式": "Quiet mode",
  "系统安静模式": "System quiet mode",
  "系统安静中": "System quiet mode",
  "系统安静中，连续短眨 4 次恢复文字和语音播报。": "System quiet mode. Blink shortly 4 times in a row to restore text and speech output.",
  "已恢复，等待输入": "Resumed. Waiting for input.",
  "已恢复": "Resumed",
  "指令冷却中，已忽略重复触发": "Action cooldown active. Repeated trigger ignored.",
  "校准完成": "Calibration complete",
  "校准已载入": "Calibration loaded",
  "已取消": "Canceled",
  "已退出": "Exited",
  "确认": "Confirm",
  "未确认": "Not confirmed",
  "短码": "Blink code",
  "二级选择": "Secondary selection",
  "输入管理": "Input management",
  "挠痒痒": "Scratch request",
  "调整体位": "Position adjustment",
  "闭合": "Closed",
  "睁开": "Open",
  "闭眼": "Eyes closed",
  "眨眼": "Blink",
  "睁眼": "Eyes open",
  "未见人脸": "No face visible",
  "请让患者面部进入画面": "Place the patient’s face in view",
  "关键点不足": "Not enough landmarks",
  "画面稳定中": "Stabilizing view",
  "人脸质量": "Face quality",
  "人脸质量良好": "Face quality good",
  "人脸偏小": "Face is too small",
  "人脸略小": "Face is slightly small",
  "人脸偏离中心": "Face is off center",
  "人脸接近画面边缘": "Face is near the edge",
  "人脸检测不稳定": "Face tracking is unstable",
  "眼部关键点不稳定": "Eye landmarks are unstable",
  "仅保留眼部输入": "Eye-only input",
  "质量不足": "Quality low",
  "质量不足，已暂停触发": "Quality too low; trigger paused",
  "人脸质量不足，请调整手机位置。": "Face quality is too low. Please adjust the phone position.",
  "请将手机靠近患者，或使用 2x 镜头。": "Move the phone closer to the patient, or use the 2x lens.",
  "请让患者面部靠近画面中心。": "Keep the patient’s face closer to the center.",
  "请保留完整眉毛、嘴部和下巴，不要贴近边缘。": "Keep the eyebrows, mouth, and chin fully in view, away from the edge.",
  "请固定手机或改善光线，等待画面稳定。": "Stabilize the phone or improve lighting, then wait for the view to settle.",
  "检测质量不足，可选面部动作暂停；仍可使用眨眼短码、长闭眼退出和安静模式恢复。": "Quality is low. Optional facial gestures are paused; blink codes, long eye-closure exit, and quiet-mode recovery remain available.",
  "眼部关键点不可稳定使用，患者动作已暂停。": "Eye landmarks are not stable enough. Patient actions are paused.",
  "人脸质量可用，但建议调整手机距离和角度。": "Face quality is usable, but phone distance and angle could be improved.",
  "人脸质量良好，可以识别。": "Face quality is good. Recognition is available.",
  "人脸质量门控已关闭": "Face quality gate is off",
  "人脸质量门控已开启": "Face quality gate is on",
  "ROI 预览": "ROI preview",
  "人脸近景框已关闭": "Face ROI preview is off",
  "人脸近景框已开启": "Face ROI preview is on",
  "点头中，抬眉暂停": "Nodding detected, eyebrow paused",
  "摇头中，微笑暂停": "Head motion detected, smile paused",
  "输入管理中忽略摇头": "Head shake ignored in input management",
  "抬眉": "Eyebrow raise",
  "张嘴": "Mouth open",
  "微笑": "Smile",
  "摇头": "Head shake",
  "短眨选择": "short-blink selection",
  "手动点击": "manual click",
  "手动取消": "manual cancel",
  "加载模型": "Loading model",
  "请求权限": "Requesting permission",
  "浏览器不支持": "Browser unsupported",
  "需要安全连接": "Secure connection needed",
  "摄像头失败": "Camera failed",
  "启动失败": "Start failed",
  "模型失败": "Model failed",
  "摄像头断开": "Camera disconnected",
  "检测失败": "Detection failed",
  "识别已暂停": "Recognition paused",
  "识别已恢复": "Recognition resumed",
  "检测已停止": "Detection stopped",
  "本地地址已复制": "Local URL copied",
  "已取消未保存修改。": "Canceled unsaved changes.",
  "测试记录已开始": "Test recording started",
  "高级设置已保存到本机": "Advanced settings saved on this device",
  "高级设置已恢复默认": "Advanced settings restored to defaults",
  "高级设置已导入": "Advanced settings imported",
  "输入通道设置已保存": "Input channel settings saved",
  "输入通道设置保存失败": "Input channel settings save failed",
  "输入通道设置读取失败，已切换为仅眨眼": "Could not load input channel settings. Switched to blink-only input.",
  "识别已暂停，点击继续后恢复": "Recognition paused. Click Resume to continue.",
  "摄像头列表更新失败": "Camera list refresh failed",
  "使用当前默认配置。": "Using current defaults.",
  "已保存到本机。": "Saved on this device.",
  "保存失败，请检查浏览器本地存储权限。": "Save failed. Please check browser local storage permissions.",
  "已载入本机自定义含义。": "Loaded custom meanings from this device.",
  "本机自定义含义读取失败，已使用默认配置。": "Could not load custom meanings. Defaults are in use.",
  "有未保存修改。": "Unsaved changes.",
  "全部动作含义已恢复默认并保存。": "All action meanings restored to defaults and saved.",
  "已导出自定义含义。": "Custom meanings exported.",
  "已导入并保存到本机。": "Imported and saved on this device.",
  "导入失败，请检查 JSON 文件。": "Import failed. Please check the JSON file.",
  "当前未启用动作输入。": "No action input is currently enabled.",
  "二级选择已取消": "Secondary selection canceled",
  "二级选择：忽略单次短眨": "Secondary selection: single short blink ignored",
  "二级选择中忽略张嘴动作": "Mouth-open action ignored during secondary selection",
  "二级选择中忽略微笑动作": "Smile action ignored during secondary selection",
  "输入管理中忽略摇头动作，避免刚开启摇头时误退出": "Head shake ignored in input management to avoid accidental exit just after enabling it",
  "已退出输入管理": "Exited input management",
  "已切换为仅用眨眼": "Switched to blink-only input",
  "抬眉识别已开启": "Eyebrow raise detection enabled",
  "抬眉识别已关闭": "Eyebrow raise detection disabled",
  "张嘴识别已开启": "Mouth-open detection enabled",
  "张嘴识别已关闭": "Mouth-open detection disabled",
  "微笑识别已开启": "Smile detection enabled",
  "微笑识别已关闭": "Smile detection disabled",
  "摇头识别已开启": "Head-shake detection enabled",
  "摇头识别已关闭": "Head-shake detection disabled",
  "输入管理：请选择要开启或关闭的动作。眨眼短码始终开启。": "Input management: choose which optional actions to enable or disable. Blink code is always on.",
  "单次短眨已忽略；两次短眨选择当前项，闭眼 3 秒退出。": "Single short blink ignored. Double short blink selects the current item; close eyes for 3 seconds to exit.",
  "单次长闭眼已忽略；两次短眨选择当前项，闭眼 3 秒退出。": "Single long eye closure ignored. Double short blink selects the current item; close eyes for 3 seconds to exit.",
  "二级选择中：请用两次短眨或抬眉选择，闭眼 3 秒或摇头退出。": "Secondary selection: use two short blinks or eyebrow raise to select; close eyes for 3 seconds or shake head to exit.",
  "确认超时，已取消": "Confirmation timed out and was canceled",
  "校准已确认，可以开始通信输入。": "Calibration confirmed. Communication input is ready.",
  "已载入校准档案，可以开始通信输入。": "Calibration profile loaded. Communication input is ready.",
  "校准已重置。点击“开始校准”后按提示采集。": "Calibration reset. Click Start calibration and follow the prompts.",
  "核心校准已完成，可直接点“完成确认”。短码测试是可选验证。": "Core calibration is complete. You can confirm now; blink-code testing is optional.",
  "请先启动摄像头": "Please start the camera first",
  "请先启动摄像头，再采集校准样本。": "Please start the camera before collecting calibration samples.",
  "请先启动摄像头再测试短码": "Please start the camera before testing blink codes",
  "请先完成前面校准步骤，并进入“测试短码”。": "Please complete the earlier calibration steps and enter Blink-code testing.",
  "请先完成睁眼、闭眼、短眨和长闭眼样本采集。": "Please complete open-eye, closed-eye, short-blink, and long-closure samples.",
  "全部短码测试已通过，可以点击“完成确认”。": "All blink-code tests passed. You can click Confirm.",
  "输入管理短码已识别；完成并确认引导校准后才打开菜单。": "Input-management blink code recognized. The menu opens only after guided calibration is confirmed.",
  "单次短眨已忽略，请连续两次短眨确认，闭眼 3 秒取消。": "Single short blink ignored. Use two short blinks to confirm, or close eyes for 3 seconds to cancel.",
  "单次长闭眼已忽略，请连续两次短眨确认，闭眼 3 秒取消。": "Single long eye closure ignored. Use two short blinks to confirm, or close eyes for 3 seconds to cancel.",
  "确认未识别：请连续两次短眨确认，闭眼 3 秒取消。": "Confirmation not recognized. Use two short blinks to confirm, or close eyes for 3 seconds to cancel.",
  "摄像头正在启动": "Camera is starting",
  "采集中，暂不能进入下一步": "Collecting; cannot move to the next step yet",
  "短码测试等待输入中，暂不能完成确认": "Blink-code test is waiting for input; cannot confirm yet",
  "当前校准步骤尚未完成": "Current calibration step is not complete",
  "核心校准未完成，暂不能测试短码": "Core calibration is incomplete; blink-code testing is not available yet",
  "尚未进入短码测试步骤": "Blink-code test step has not started yet",
  "引导校准已开始": "Guided calibration started",
  "引导校准已确认完成": "Guided calibration confirmed",
  "引导校准已重置，本地校准档案已清除": "Guided calibration reset; local calibration profile cleared",
  "本地校准档案读取失败，已忽略": "Could not read local calibration profile; ignored",
  "本地校准档案清除失败": "Could not clear local calibration profile",
  "校准档案已保存，本机下次会自动沿用": "Calibration profile saved; this device will reuse it next time",
  "校准档案保存失败，请检查浏览器本地存储权限": "Calibration profile save failed. Please check browser local storage permissions.",
  "已载入本机保存的校准档案": "Loaded calibration profile saved on this device",
  "差异不足": "Insufficient difference",
  "睁眼/闭眼 EAR 差异不足，未更新阈值": "Open/closed-eye EAR difference is insufficient; threshold not updated",
  "当前浏览器不支持摄像头": "This browser does not support camera access",
  "当前浏览器无法访问摄像头": "This browser cannot access the camera",
  "摄像头需要 HTTPS 或本机安全环境": "Camera access requires HTTPS or a local secure context",
  "摄像头需要安全连接": "Camera requires a secure connection",
  "人脸模型加载失败": "Face model failed to load",
  "摄像头权限被拒绝": "Camera permission denied",
  "没有找到可用摄像头": "No available camera found",
  "摄像头被占用": "Camera is in use",
  "指定摄像头不可用": "Selected camera unavailable",
  "指定摄像头不可用，已准备切回默认摄像头": "Selected camera unavailable; ready to switch back to the default camera",
  "指定摄像头不可用，切回系统默认摄像头": "Selected camera unavailable; switching to the system default camera",
  "摄像头启动失败": "Camera start failed",
  "检测循环出现错误": "Detection loop error",
  "检测循环出现错误，已暂停": "Detection loop error, paused",
  "摄像头已断开": "Camera disconnected",
  "摄像头列表已更新": "Camera list refreshed",
};

function localizeRuntimeText(text) {
  if (currentLanguage === "zh" || text === null || text === undefined) {
    return text ?? "";
  }

  const source = String(text);
  if (RUNTIME_TEXT_EN[source]) {
    return RUNTIME_TEXT_EN[source];
  }

  return source
    .replace(/^已启用 (\d+) 类可选输入$/, "$1 optional input type(s) enabled")
    .replace(/^(\S+) 的表达文字不能为空。$/, "$1 expression text cannot be empty.")
    .replace(/^(\S+) 已恢复默认并保存。$/, "$1 restored to default and saved.")
    .replace(/^正在测试播报：(.+)$/, "Testing speech: $1")
    .replace(/^已载入同一患者本地校准档案（(.+)）。更换患者或状态变化时请重置。$/, "Loaded this patient’s local calibration profile ($1). Reset if the patient or condition changes.")
    .replace(/^等待输入：(.+)$/, "Waiting for input: $1")
    .replace(/^通过：收到 (.+)。可点“完成确认”，也可继续测试 (.+)。进度 (.+)。$/, "Passed: received $1. You can confirm now or continue testing $2. Progress $3.")
    .replace(/^不匹配：期望 (.+)，收到 (.+)。请重新点“测试”。$/, "Mismatch: expected $1, received $2. Click Test again.")
    .replace(/^短码 (.+) 已识别；完成并确认引导校准后才播报短语。$/, "Blink code $1 recognized. Phrases are spoken only after guided calibration is confirmed.")
    .replace(/^短码过长 (.+)，已静默忽略$/, "Blink code too long ($1), silently ignored")
    .replace(/^未识别短码 (.+)，已静默忽略$/, "Unrecognized blink code ($1), silently ignored")
    .replace(/^系统安静中，连续短眨 4 次恢复（(\d+)\/4）$/, "System quiet mode. Blink shortly 4 times to resume ($1/4).")
    .replace(/^微笑一次已记录；完全放松约半秒后再次微笑会表达“(.+)”。$/, "One smile recorded. Relax fully for about half a second, then smile again to express “$1.”")
    .replace(/^检测到(.+)；完成并确认引导校准后才启用动作映射。$/, "$1 detected. Action mapping is enabled only after guided calibration is confirmed.")
    .replace(/^短码测试中，(.+)动作已记录但不执行。$/, "$1 recorded during blink-code testing but not executed.")
    .replace(/^(.+)：指令冷却中，已忽略重复触发$/, "$1: action cooldown active; repeated trigger ignored.")
    .replace(/^(.+)：质量不足，已暂停触发$/, "$1: face quality too low; trigger paused.")
    .replace(/^(.+)：质量不足，未进入动作组合$/, "$1: face quality too low; action sequence not started.")
    .replace(/^(.+)：当前模式中因人脸质量不足已忽略$/, "$1 ignored in the current mode because face quality is too low.")
    .replace(/^(.+)超时，已取消$/, "$1 timed out and was canceled");
}

function setElementText(selector, key, mode = "text") {
  let element = null;
  try {
    element = document.querySelector(selector);
  } catch {
    return;
  }
  if (!element) {
    return;
  }

  const value = t(key);
  if (mode === "title" || mode === "aria-label") {
    element.setAttribute(mode, value);
    return;
  }

  if (mode === "labelWithInput") {
    const input = element.querySelector("input");
    element.textContent = "";
    if (input) {
      element.append(input);
    }
    element.append(document.createTextNode(value));
    return;
  }

  if (mode === "prefixStrong") {
    const strong = element.querySelector("strong");
    element.textContent = `${value} `;
    if (strong) {
      element.append(strong);
    }
    return;
  }

  element.textContent = value;
}

function localizeCameraOptionLabels() {
  let genericCameraIndex = 1;
  Array.from(cameraSelect.options).forEach((option) => {
    if (!option.value && /授权后显示摄像头名称|Camera names appear after permission|等待权限|Waiting for permission/.test(option.textContent)) {
      option.textContent = currentLanguage === "en" ? "Camera names appear after permission" : "授权后显示摄像头名称";
      return;
    }

    if (/^摄像头 \d+$|^Camera \d+$/.test(option.textContent)) {
      option.textContent = currentLanguage === "en" ? `Camera ${genericCameraIndex}` : `摄像头 ${genericCameraIndex}`;
      genericCameraIndex += 1;
    }
  });
}

function findSelectOptionByValue(select, value) {
  return Array.from(select.options).find((option) => option.value === value) || null;
}

function applyStaticLanguage() {
  document.documentElement.lang = t("langCode");
  document.title = t("appTitle");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("appDescription"));
  languageToggleButton.querySelector("span").textContent = t("languageButton");

  STATIC_TEXT_BINDINGS.forEach(([selector, key, mode]) => setElementText(selector, key, mode));

  Object.entries(UI_TEXT[currentLanguage].guidedOptions).forEach(([value, label]) => {
    const option = findSelectOptionByValue(guidedTestSelect, value);
    if (option) {
      option.textContent = label;
    }
  });

  Object.entries(UI_TEXT[currentLanguage].expectedOptions).forEach(([value, label]) => {
    const option = findSelectOptionByValue(recordingExpectedSelect, value);
    if (option) {
      option.textContent = label;
    }
  });

  localizeCameraOptionLabels();
}

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
  shortMinMs: 70,
  shortMaxMs: 500,
  longMinMs: 700,
  longMaxMs: 2800,
  decodeDelayMs: DEFAULT_AAC_TIMING.shortDecodeMs,
  closedDeferMs: 120,
  finalDecodeDelayMs: DEFAULT_AAC_TIMING.finalDecodeMs,
  inputManagementContinuationMs: DEFAULT_AAC_TIMING.inputManagementContinuationMs,
  longSequenceDecodeDelayMs: DEFAULT_AAC_TIMING.longDecodeMs,
};
const BLINK_SEQUENCE_TIMING = {
  maxGapAfterShortMs: DEFAULT_AAC_TIMING.maxGapAfterShortMs,
  maxGapAfterLongMs: DEFAULT_AAC_TIMING.maxGapAfterLongMs,
  maxTotalMs: DEFAULT_AAC_TIMING.ordinaryMaxTotalMs,
};
const BLINK_CODE_MAX_TOTAL_MS = DEFAULT_AAC_TIMING.codeMaxTotalMs;
const CALIBRATION_BLINK_SAMPLE = {
  longAutoRecordMs: 900,
  longMaxMs: 5000,
  timeoutMs: 10000,
};
const LONG_CLOSE_CONTROL = {
  exitMinMs: 3000,
  quietMinMs: 8000,
  maxObservedFrameGapMs: 500,
  resumeBlinkCount: DEFAULT_AAC_TIMING.quietResumeBlinkCount,
  resumeMaxGapMs: DEFAULT_AAC_TIMING.quietResumeMaxGapMs,
  resumeWindowMs: DEFAULT_AAC_TIMING.quietResumeWindowMs,
  resumeBlinkMinMs: BLINK_SYMBOLS.shortMinMs,
  resumeBlinkMaxMs: 1000,
};
const ACTION_COOLDOWN_MS = {
  default: 1500,
  terminal: DEFAULT_AAC_TIMING.actionCooldownMs,
  secondarySelection: 1000,
};
const RECOVERY_COOLDOWN_MS = DEFAULT_AAC_TIMING.recoveryCooldownMs;
const MENU_ACTION_COOLDOWN_MS = DEFAULT_AAC_TIMING.menuActionCooldownMs;
const EMERGENCY_BLINK_CODE = "...";
const SECONDARY_SELECTION_BLINK_LOCK_MS =
  BLINK_SEQUENCE_TIMING.maxGapAfterShortMs + BLINK_SYMBOLS.shortMaxMs + BLINK_SYMBOLS.decodeDelayMs + 250;
const SECONDARY_SELECTION_INTRO_FALLBACK_MS = 7000;
const SECONDARY_SELECTION_OPTION_SPEECH_FALLBACK_MS = 5000;
const SECONDARY_SELECTION_POST_SPEECH_DWELL_MS = 2000;
const BROW_BLINK_PRIORITY_GUARD_MS = 650;

const ACTION_CONFIG = createActionConfig(currentLanguage);
const SECONDARY_SELECTION_GROUPS = createSecondarySelectionGroups(currentLanguage);
const faceQualityTracker = createFaceQualityTracker();
const faceRoiPreviewTracker = createFaceRoiPreviewTracker();

function applySecondarySelectionLanguage() {
  applySecondarySelectionGroupLanguage(SECONDARY_SELECTION_GROUPS, currentLanguage);
}

const OPTIONAL_INPUT_CHANNELS = {
  brow: { toggle: browToggle, ...OPTIONAL_INPUT_CHANNEL_DEFINITIONS.brow },
  mouth: { toggle: mouthToggle, ...OPTIONAL_INPUT_CHANNEL_DEFINITIONS.mouth },
  smile: { toggle: smileToggle, ...OPTIONAL_INPUT_CHANNEL_DEFINITIONS.smile },
  head: { toggle: headShakeToggle, ...OPTIONAL_INPUT_CHANNEL_DEFINITIONS.head },
};
const CONFIRMATION_TIMEOUT_MS = 10 * 1000;
const MOUTH_DOUBLE_WINDOW_MS = MOUTH_SEQUENCE_PARAMS.doubleWindowMs;
const MOUTH_BROW_SUPPRESS_THRESHOLD = MOUTH_SEQUENCE_PARAMS.browSuppressThreshold;
const MOUTH_SMILE_SUPPRESS_THRESHOLD = MOUTH_SEQUENCE_PARAMS.smileSuppressThreshold;
const SMILE_MOUTH_SUPPRESS_THRESHOLD = SMILE_SEQUENCE_PARAMS.mouthSuppressThreshold;
const SMILE_DOUBLE_WINDOW_MS = SMILE_SEQUENCE_PARAMS.doubleWindowMs;
const SMILE_DOUBLE_MIN_GAP_MS = SMILE_SEQUENCE_PARAMS.doubleMinGapMs;
const SMILE_WIDTH_DELTA_SCALE = SMILE_SEQUENCE_PARAMS.widthDeltaScale;
const HEAD_SHAKE_YAW_THRESHOLD = HEAD_SHAKE_PARAMS.yawThreshold;
const CALIBRATION_STORAGE_KEY = "alsFacialAac.defaultPatientCalibration.v1";
const ACTION_TEXT_STORAGE_KEY = "alsFacialAac.actionText.v1";
const INPUT_CHANNEL_STORAGE_KEY = "alsFacialAac.inputChannels.v1";
const LEGACY_ACTION_CONFIG_STORAGE_KEYS = ["alsFacialAac.actionConfig.v2"];

function actionTextStorageKey(lang = currentLanguage) {
  return lang === "zh" ? ACTION_TEXT_STORAGE_KEY : `${ACTION_TEXT_STORAGE_KEY}.${lang}`;
}
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
    timeoutMs: 16000,
  },
  {
    id: "long",
    title: "4. 长闭眼样本",
    instruction: "点击“开始记录”后闭眼并保持约 1 秒；系统达到时会自动记录，看到进度完成后再睁开。",
    kind: "blink",
    sampleKey: "longBlinkDurations",
    targetCount: 1,
    timeoutMs: CALIBRATION_BLINK_SAMPLE.timeoutMs,
  },
  {
    id: "review",
    title: "5. 确认校准",
    instruction: "核心校准完成后即可点击“完成确认”。下方短码测试是可选验证，用来继续观察误触和准确率。",
    kind: "test",
  },
];
const CALIBRATION_STEP_LOCALIZATION = {
  en: {
    position: {
      title: "Prepare camera view",
      instruction: "Confirm the full face is visible, facial outlines match, and lighting is stable. Then continue.",
    },
    open: {
      title: "1. Natural open-eye baseline",
      instruction: "Keep the eyes naturally open. Click Collect and the system will collect a 2-second EAR baseline.",
    },
    closed: {
      title: "2. Gentle closed-eye baseline",
      instruction: "Gently close the eyes. Click Collect and the system will collect a 1.5-second closed-eye EAR baseline and update the blink threshold.",
    },
    short: {
      title: "3. Intentional short-blink samples",
      instruction: "After clicking Collect, do 3 low-fatigue short blinks, about 1 second apart.",
    },
    long: {
      title: "4. Long eye-closure sample",
      instruction: "After clicking Start recording, close the eyes and hold for about 1 second. The sample records automatically when the progress completes.",
    },
    review: {
      title: "5. Confirm calibration",
      instruction: "After core calibration is complete, click Confirm. The blink-code tests below are optional checks for accuracy and false triggers.",
    },
  },
};
const CALIBRATION_STEPS_BASE = structuredClone(CALIBRATION_STEPS);

function applyCalibrationLanguage() {
  CALIBRATION_STEPS.forEach((step, index) => {
    const base = CALIBRATION_STEPS_BASE[index];
    const localized = CALIBRATION_STEP_LOCALIZATION[currentLanguage]?.[base.id] || {};
    step.title = localized.title || base.title;
    step.instruction = localized.instruction || base.instruction;
  });
}
const GUIDED_TEST_CODES = [".", "-", "..", "...", "--", ".-", "-.", "--."];

const state = {
  faceLandmarker: null,
  stream: null,
  starting: false,
  running: false,
  rafId: 0,
  lastVideoTime: -1,
  detectionErrorCount: 0,
  selectedDeviceId: "",
  blinkTotal: 0,
  closedFrames: 0,
  openFrames: 0,
  blinkArmed: true,
  blinkClosedAt: null,
  blinkClosedObservedMs: 0,
  blinkClosedLastObservedAt: 0,
  blinkWasClosed: false,
  blinkClosureConsumed: false,
  lastBlinkReleasedAt: 0,
  blinkCodeBuffer: [],
  blinkDecodeTimer: 0,
  blinkCodeOverflow: false,
  blinkCodeEmergencyOnly: false,
  blinkCodeStartedAt: null,
  blinkCodeLastAt: null,
  blinkCodeDurations: [],
  actionCooldownUntil: 0,
  recoveryCooldownUntil: 0,
  menuActionCooldownUntil: 0,
  secondarySelection: {
    active: false,
    phase: "idle",
    sessionId: 0,
    groupId: "",
    index: 0,
    startedAt: 0,
    expiresAt: 0,
    introTimer: 0,
    scanTimer: 0,
    lockedIndex: null,
    lockTimer: 0,
    lockStartedAt: 0,
  },
  recentlyConsumedBlinkCode: {
    code: "",
    until: 0,
    reason: "",
  },
  lastCalibrationGateFeedbackAt: 0,
  fpsSamples: [],
  lastFps: null,
  lastSignals: null,
  faceQuality: faceQualityTracker.reset(),
  faceRoiPreview: faceRoiPreviewTracker.reset(),
  lastFrameAt: 0,
  cameraLabelsReady: false,
  pausedUntil: 0,
  quietMode: {
    active: false,
    resumeBlinkCount: 0,
    resumeStartedAt: 0,
    resumeLastAt: 0,
    resumeTimer: 0,
  },
  speechRequestId: 0,
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
  smileHeadMotionGuard: {
    smileBlockedUntil: 0,
  },
  gestureSequences: {
    mouthOpenTimes: [],
    mouthOpenTimer: 0,
    smileTimer: 0,
    smilePending: null,
  },
  calibration: {
    active: false,
    stepIndex: 0,
    collecting: false,
    collectStartedAt: 0,
    blinkFeedbackAt: 0,
    confirmed: false,
    completedStepIds: [],
    activeTestCode: "",
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
  runtimeStatus.innerHTML = `<span class="dot dot-${mode}"></span><span>${localizeRuntimeText(label)}</span>`;
}

function isPausedStateActive() {
  return state.pausedUntil !== 0;
}

function addLog(message) {
  const displayMessage = localizeRuntimeText(message);
  state.sessionEvents.push({
    time: new Date().toISOString(),
    message: displayMessage,
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
  item.textContent = `${new Date().toLocaleTimeString(t("langCode"), {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}  ${displayMessage}`;
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
    faceQualityLevel: state.faceQuality?.level || null,
    faceQualityReason: state.faceQuality?.reason || null,
    faceQualityTriggerPolicy: state.faceQuality?.triggerPolicy || null,
    eyesUsable: typeof state.faceQuality?.eyesUsable === "boolean" ? state.faceQuality.eyesUsable : null,
    faceQualityScore: Number.isFinite(state.faceQuality?.score) ? Number(state.faceQuality.score.toFixed(4)) : null,
    faceHeightRatio: Number.isFinite(state.faceQuality?.metrics?.heightRatio)
      ? Number(state.faceQuality.metrics.heightRatio.toFixed(4))
      : null,
    faceCenterOffset: Number.isFinite(state.faceQuality?.metrics?.centerOffset)
      ? Number(state.faceQuality.metrics.centerOffset.toFixed(4))
      : null,
    faceJitter: Number.isFinite(state.faceQuality?.metrics?.jitter)
      ? Number(state.faceQuality.metrics.jitter.toFixed(4))
      : null,
    faceEyeSpanRatio: Number.isFinite(state.faceQuality?.metrics?.eyeSpanRatio)
      ? Number(state.faceQuality.metrics.eyeSpanRatio.toFixed(4))
      : null,
    currentMode: getInteractionMode(),
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

  recordingStatus.textContent = state.recording.active
    ? localizeRuntimeText("记录中")
    : records.length > 0
      ? localizeRuntimeText("已停止")
      : t("notRecording");
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
      faceQualityGate: isFaceQualityGateEnabled(),
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
    "faceQualityLevel",
    "faceQualityReason",
    "faceQualityTriggerPolicy",
    "eyesUsable",
    "faceQualityScore",
    "faceHeightRatio",
    "faceCenterOffset",
    "faceJitter",
    "faceEyeSpanRatio",
    "currentMode",
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
  diagnosticTitle.textContent = localizeRuntimeText(title);
  diagnosticMessage.textContent = localizeRuntimeText(message);
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
  state.blinkClosedObservedMs = 0;
  state.blinkClosedLastObservedAt = 0;
  state.blinkWasClosed = false;
  state.blinkClosureConsumed = false;
}

function resetLiveMetrics(status = "未检测") {
  blinkState.textContent = localizeRuntimeText(status);
  earValue.textContent = "--";
  fpsValue.textContent = "--";
  confidenceLabel.textContent = "--";
  lastGesture.textContent = "--";
  earBar.style.width = "0%";
  resetFaceQuality();
  resetFaceRoiPreview();
  updateGestureMeters({ browUp: 0, mouthOpen: 0, smile: 0, headYaw: 0 });
}

function faceQualityCopy(quality = state.faceQuality) {
  if (!quality) {
    return {
      label: "未见人脸",
      reason: "请让患者面部进入画面",
    };
  }

  if (quality.level === "good") {
    return {
      label: "人脸质量良好",
      reason: "人脸质量良好，可以识别。",
    };
  }

  if (quality.triggerPolicy === "eyesOnly") {
    return {
      label: "仅保留眼部输入",
      reason: "检测质量不足，可选面部动作暂停；仍可使用眨眼短码、长闭眼退出和安静模式恢复。",
    };
  }

  const labelByReason = {
    missing: "未见人脸",
    tooSmall: "人脸偏小",
    small: "人脸略小",
    offCenter: "人脸偏离中心",
    nearEdge: "人脸接近画面边缘",
    unstable: "人脸检测不稳定",
    slightlyUnstable: "人脸检测不稳定",
    eyesUnstable: "眼部关键点不稳定",
  };

  const reasonByReason = {
    missing: "请让患者面部进入画面",
    tooSmall: "请将手机靠近患者，或使用 2x 镜头。",
    small: "人脸质量可用，但建议调整手机距离和角度。",
    offCenter: "请让患者面部靠近画面中心。",
    nearEdge: "请保留完整眉毛、嘴部和下巴，不要贴近边缘。",
    unstable: "请固定手机或改善光线，等待画面稳定。",
    slightlyUnstable: "请固定手机或改善光线，等待画面稳定。",
    eyesUnstable: "眼部关键点不可稳定使用，患者动作已暂停。",
  };

  return {
    label: labelByReason[quality.reason] || "人脸质量",
    reason: reasonByReason[quality.reason] || "人脸质量可用，但建议调整手机距离和角度。",
  };
}

function renderFaceQuality(quality = state.faceQuality) {
  if (!faceQualityPanel || !faceQualityLabel || !faceQualityReason || !faceQualityBar) {
    return;
  }

  const copy = faceQualityCopy(quality);
  faceQualityPanel.dataset.level = quality?.level || "missing";
  faceQualityLabel.textContent = localizeRuntimeText(copy.label);
  faceQualityReason.textContent = localizeRuntimeText(copy.reason);
  faceQualityBar.style.width = `${Math.round((quality?.score || 0) * 100)}%`;
}

function updateFaceQuality(landmarks) {
  state.faceQuality = faceQualityTracker.update(landmarks);
  renderFaceQuality();
  return state.faceQuality;
}

function resetFaceQuality() {
  state.faceQuality = faceQualityTracker.reset();
  renderFaceQuality();
}

function updateFaceRoiPreview(landmarks) {
  state.faceRoiPreview = faceRoiPreviewTracker.update(landmarks);
  return state.faceRoiPreview;
}

function resetFaceRoiPreview() {
  state.faceRoiPreview = faceRoiPreviewTracker.reset();
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
  state.smileHeadMotionGuard.smileBlockedUntil = 0;
}

function resetGestureSequences() {
  if (state.gestureSequences.mouthOpenTimer) {
    window.clearTimeout(state.gestureSequences.mouthOpenTimer);
  }
  state.gestureSequences.mouthOpenTimes = [];
  state.gestureSequences.mouthOpenTimer = 0;
  resetSmileSequence();
}

function resetSmileSequence() {
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
  const base = DEFAULT_ACTION_CONFIG.find((action) => action.id === id);
  return base ? localizedActionDefault(base, currentLanguage) : null;
}

function getActionConfigById(id) {
  return ACTION_CONFIG.find((action) => action.id === id) || null;
}

function getActionConfigByGestureId(gestureId) {
  return ACTION_CONFIG.find((action) => action.gestureId === gestureId && action.enabled) || null;
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

function applyActionConfigLanguage() {
  ACTION_CONFIG.forEach((action) => {
    const defaults = getDefaultActionConfigById(action.id);
    if (!defaults) {
      return;
    }

    action.label = defaults.label;
    action.instruction = defaults.instruction;
    action.category = defaults.category;
    action.displayText = defaults.displayText;
    action.speechText = defaults.speechText;
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

  actionSettingsStatus.textContent = localizeRuntimeText(text);
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
      window.localStorage.removeItem(actionTextStorageKey());
    } else {
      window.localStorage.setItem(actionTextStorageKey(), JSON.stringify(overrides, null, 2));
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
    applyActionConfigLanguage();
    const raw = window.localStorage.getItem(actionTextStorageKey());
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
    caption.textContent = currentLanguage === "en" ? "Expression text" : "表达文字";

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
    testButton.textContent = currentLanguage === "en" ? "Test speech" : "测试播报";

    const resetButton = document.createElement("button");
    resetButton.className = "ghost-action compact-action";
    resetButton.type = "button";
    resetButton.dataset.actionId = action.id;
    resetButton.dataset.action = "reset";
    resetButton.textContent = currentLanguage === "en" ? "Restore default" : "恢复默认";

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

function forceBlinkCodeEnabled() {
  blinkCodeToggle.checked = true;
}

function resetOptionalGestureState() {
  resetGestureSequences();
  gestureDetectors.brow.reset();
  gestureDetectors.secondaryBrow.reset();
  gestureDetectors.mouth.reset();
  gestureDetectors.smile.reset();
  headShakeDetector.reset();
}

function saveInputChannelConfig({ silent = false } = {}) {
  forceBlinkCodeEnabled();
  const payload = Object.fromEntries(
    Object.entries(OPTIONAL_INPUT_CHANNELS).map(([channel, config]) => [channel, Boolean(config.toggle.checked)]),
  );

  try {
    window.localStorage.setItem(INPUT_CHANNEL_STORAGE_KEY, JSON.stringify(payload, null, 2));
    if (!silent) {
      addLog("输入通道设置已保存");
    }
    return true;
  } catch {
    if (!silent) {
      addLog("输入通道设置保存失败");
    }
    return false;
  }
}

function loadSavedInputChannelConfig() {
  forceBlinkCodeEnabled();
  try {
    const raw = window.localStorage.getItem(INPUT_CHANNEL_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    Object.entries(OPTIONAL_INPUT_CHANNELS).forEach(([channel, config]) => {
      config.toggle.checked = Boolean(saved[channel]);
    });
    return true;
  } catch {
    Object.values(OPTIONAL_INPUT_CHANNELS).forEach((config) => {
      config.toggle.checked = false;
    });
    addLog("输入通道设置读取失败，已切换为仅眨眼");
    return false;
  }
}

function setOptionalInputChannel(channel, enabled, { save = true } = {}) {
  const config = OPTIONAL_INPUT_CHANNELS[channel];
  if (!config) {
    return false;
  }

  config.toggle.checked = Boolean(enabled);
  resetOptionalGestureState();
  updateActionGuide();
  if (save) {
    saveInputChannelConfig({ silent: true });
  }
  return true;
}

function setOnlyBlinkInput({ save = true } = {}) {
  forceBlinkCodeEnabled();
  Object.keys(OPTIONAL_INPUT_CHANNELS).forEach((channel) => {
    setOptionalInputChannel(channel, false, { save: false });
  });
  updateActionGuide();
  if (save) {
    saveInputChannelConfig({ silent: true });
  }
}

function isActionGuideVisible(action) {
  if (!action.enabled) {
    return false;
  }

  if (action.input === "blink") {
    return true;
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
  actionGuideMode.textContent =
    optionalInputCount > 0
      ? localizeRuntimeText(`已启用 ${optionalInputCount} 类可选输入`)
      : t("blinkOnly");
  actionGuideList.innerHTML = "";

  if (visibleActions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "action-guide-empty";
    empty.textContent = localizeRuntimeText("当前未启用动作输入。");
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
  const label = group
    ? currentLanguage === "en"
      ? `${group.label} timed out`
      : `${group.label}超时`
    : currentLanguage === "en"
      ? "Secondary selection timed out"
      : "二级选择超时";
  clearSecondarySelection();
  setCommunicationMessage("二级选择已取消", label);
  addLog(`${label}，已取消`);
  finishPendingTestRecord({ text: "二级选择已取消", label });
  finishInputTurnAfterTerminalAction();
  return null;
}

function activeSecondarySelectionGroup() {
  const selection = getActiveSecondarySelection();
  return selection ? SECONDARY_SELECTION_GROUPS[selection.groupId] || null : null;
}

function isSecondarySelectionIntro() {
  return state.secondarySelection.active && state.secondarySelection.phase === "intro";
}

function isSecondarySelectionScanning() {
  return state.secondarySelection.active && state.secondarySelection.phase === "scan";
}

function secondarySelectionIntroHint() {
  return currentLanguage === "en"
    ? "Voice guide is playing. Selection will start from the first item after it finishes."
    : "正在播报引导。播报结束后会从第一项开始轮询。";
}

function secondarySelectionIntroCurrentText() {
  return currentLanguage === "en" ? "Ready to start" : "准备开始选择";
}

function secondarySelectionOptionLabel(group, option) {
  if (group.id !== "inputChannels") {
    return option.label;
  }

  if (option.type === "blinkOnly") {
    return currentLanguage === "en" ? "Blink only" : "仅用眨眼";
  }

  if (option.type === "toggleInput") {
    const checked = Boolean(OPTIONAL_INPUT_CHANNELS[option.channel]?.toggle.checked);
    if (currentLanguage === "en") {
      return `${option.label}: ${checked ? "On" : "Off"}`;
    }
    return `${option.label}：${checked ? "开启" : "关闭"}`;
  }

  return option.label || "退出";
}

function renderSecondarySelectionOptionButton(group, option, index) {
  const optionButton = document.createElement("button");
  const isActive = isSecondarySelectionScanning() && index === secondarySelectionCurrentIndex();
  optionButton.className = `secondary-selection-option${isActive ? " is-active" : ""}`;
  optionButton.type = "button";
  optionButton.dataset.index = String(index);
  optionButton.textContent = secondarySelectionOptionLabel(group, option);
  return optionButton;
}

function renderPatientSecondaryOption(group, option, index) {
  const item = document.createElement("span");
  const isActive = isSecondarySelectionScanning() && index === secondarySelectionCurrentIndex();
  item.className = `patient-secondary-option${isActive ? " is-active" : ""}`;
  item.textContent = secondarySelectionOptionLabel(group, option);
  return item;
}

function renderSecondarySelectionPanel(group) {
  if (!secondarySelectionPanel || !secondarySelectionOptions) {
    return;
  }

  if (!group) {
    secondarySelectionPanel.hidden = true;
    secondarySelectionOptions.innerHTML = "";
    if (secondarySelectionSelectButton) {
      secondarySelectionSelectButton.disabled = false;
    }
    return;
  }

  const isIntro = isSecondarySelectionIntro();
  secondarySelectionPanel.hidden = false;
  secondarySelectionTitle.textContent = group.title;
  secondarySelectionHint.textContent = isIntro ? secondarySelectionIntroHint() : group.hint;
  if (secondarySelectionSelectButton) {
    secondarySelectionSelectButton.disabled = isIntro;
  }
  secondarySelectionOptions.innerHTML = "";

  group.options.forEach((option, index) => {
    secondarySelectionOptions.append(renderSecondarySelectionOptionButton(group, option, index));
  });
}

function renderPatientSecondarySelectionBar(group) {
  if (!patientSecondaryBar || !patientSecondaryOptions || !patientSecondaryCurrent) {
    return;
  }

  if (!group) {
    patientSecondaryBar.hidden = true;
    patientSecondaryTitle.textContent = t("secondarySelection");
    patientSecondaryHint.textContent = t("patientSecondaryHint");
    patientSecondaryCurrent.textContent = "--";
    patientSecondaryOptions.innerHTML = "";
    return;
  }

  const isIntro = isSecondarySelectionIntro();
  const activeOption = isIntro ? null : group.options[secondarySelectionCurrentIndex()] || group.options[0];
  patientSecondaryBar.hidden = false;
  patientSecondaryTitle.textContent = group.label;
  patientSecondaryHint.textContent = isIntro ? secondarySelectionIntroHint() : t("patientSecondaryHint");
  patientSecondaryPrefix.textContent = t("patientSecondaryCurrent");
  patientSecondaryCurrent.textContent = isIntro
    ? secondarySelectionIntroCurrentText()
    : activeOption ? secondarySelectionOptionLabel(group, activeOption) : "--";
  patientSecondaryOptions.innerHTML = "";

  group.options.forEach((option, index) => {
    patientSecondaryOptions.append(renderPatientSecondaryOption(group, option, index));
  });
}

function renderSecondarySelection() {
  const group = activeSecondarySelectionGroup();
  renderSecondarySelectionPanel(group);
  renderPatientSecondarySelectionBar(group);
}

function shouldSpeakSecondarySelectionScan(group) {
  return group?.id === "scratch" || group?.id === "position";
}

function secondarySelectionQuestionText(group, option) {
  if (!group || !option) {
    return "";
  }

  if (option.question) {
    return option.question;
  }

  const label = secondarySelectionOptionLabel(group, option);
  return currentLanguage === "en" ? `${label}?` : `${label}吗？`;
}

function speakSecondarySelectionCurrentOption({ includeIntro = false } = {}) {
  const group = activeSecondarySelectionGroup();
  if (!isSecondarySelectionScanning() || !shouldSpeakSecondarySelectionScan(group) || state.quietMode.active) {
    return Promise.resolve({ ok: false, skipped: true });
  }

  const option = group.options[secondarySelectionCurrentIndex()] || group.options[0];
  const question = secondarySelectionQuestionText(group, option);
  if (!question) {
    return Promise.resolve({ ok: false, skipped: true });
  }

  const text = includeIntro
    ? currentLanguage === "en"
      ? `${group.label} selection. ${question}`
      : `${group.label}选择。${question}`
    : question;
  return speak(text);
}

function clearSecondarySelectionTimer() {
  window.clearTimeout(state.secondarySelection.scanTimer);
  state.secondarySelection.scanTimer = 0;
}

function clearSecondarySelectionIntroTimer() {
  window.clearTimeout(state.secondarySelection.introTimer);
  state.secondarySelection.introTimer = 0;
}

function finishSecondarySelectionIntro(sessionId) {
  if (
    !state.secondarySelection.active ||
    state.secondarySelection.phase !== "intro" ||
    state.secondarySelection.sessionId !== sessionId
  ) {
    return;
  }

  clearSecondarySelectionIntroTimer();
  const now = performance.now();
  state.secondarySelection.phase = "scan";
  state.secondarySelection.index = 0;
  state.secondarySelection.startedAt = now;
  state.secondarySelection.expiresAt = now + SECONDARY_SELECTION_TIMEOUT_MS;
  renderSecondarySelection();
  scheduleSecondarySelectionScanAfterCurrentOption();
}

function startSecondarySelectionIntro(prompt) {
  clearSecondarySelectionTimer();
  clearSecondarySelectionIntroTimer();
  state.secondarySelection.phase = "intro";
  state.secondarySelection.sessionId += 1;
  const sessionId = state.secondarySelection.sessionId;
  renderSecondarySelection();

  state.secondarySelection.introTimer = window.setTimeout(() => {
    finishSecondarySelectionIntro(sessionId);
  }, SECONDARY_SELECTION_INTRO_FALLBACK_MS);

  Promise.resolve(speak(prompt)).finally(() => {
    finishSecondarySelectionIntro(sessionId);
  });
}

function clearSecondarySelectionLock({ resumeScan = false, render = false } = {}) {
  window.clearTimeout(state.secondarySelection.lockTimer);
  state.secondarySelection.lockTimer = 0;
  state.secondarySelection.lockedIndex = null;
  state.secondarySelection.lockStartedAt = 0;
  if (render) {
    renderSecondarySelection();
  }
  if (resumeScan && state.secondarySelection.active) {
    scheduleSecondarySelectionScan();
  }
}

function secondarySelectionCurrentIndex() {
  return state.secondarySelection.lockedIndex ?? state.secondarySelection.index;
}

function applySecondarySelectionLockCommand(command, now = performance.now()) {
  const group = getActiveSecondarySelection(now);
  if (!group || !isSecondarySelectionScanning() || state.secondarySelection.lockedIndex !== null) {
    return false;
  }

  const requestedIndex = Number.isFinite(Number(command?.index)) ? Math.trunc(Number(command.index)) : state.secondarySelection.index;
  const index = Math.min(Math.max(0, requestedIndex), Math.max(group.options.length - 1, 0));
  state.secondarySelection.lockedIndex = index;
  state.secondarySelection.lockStartedAt = now;
  clearSecondarySelectionTimer();
  window.clearTimeout(state.secondarySelection.lockTimer);
  state.secondarySelection.lockTimer = window.setTimeout(() => {
    clearSecondarySelectionLock({ resumeScan: true, render: true });
    addLog("二级选择：单次短眨超时，已解除锁定并继续轮询");
  }, SECONDARY_SELECTION_BLINK_LOCK_MS);
  renderSecondarySelection();
  const lockedOption = group.options[state.secondarySelection.lockedIndex];
  addLog(`二级选择：已锁定当前项 ${lockedOption ? secondarySelectionOptionLabel(group, lockedOption) : "--"}`);
  return true;
}

function rememberConsumedBlinkCode(code, reason = "") {
  state.recentlyConsumedBlinkCode.code = code;
  state.recentlyConsumedBlinkCode.until = performance.now() + CONSUMED_BLINK_CODE_SUPPRESS_MS;
  state.recentlyConsumedBlinkCode.reason = reason;
}

function clearRecentlyConsumedBlinkCode() {
  state.recentlyConsumedBlinkCode.code = "";
  state.recentlyConsumedBlinkCode.until = 0;
  state.recentlyConsumedBlinkCode.reason = "";
}

function shouldSuppressRecentlyConsumedBlinkCode(code, now = performance.now()) {
  const consumed = state.recentlyConsumedBlinkCode;
  if (!consumed.code || consumed.code !== code || now > consumed.until) {
    return false;
  }

  addLog(
    currentLanguage === "en"
      ? `Suppressed repeated consumed blink code ${displayBlinkCode(code)}`
      : `已抑制已被场景消费的重复短码 ${displayBlinkCode(code)}`,
  );
  finishPendingTestRecord({ note: consumed.reason || "consumed_blink_code_suppressed" });
  return true;
}

function scheduleSecondarySelectionScan(delayMs = SECONDARY_SELECTION_SCAN_MS) {
  clearSecondarySelectionTimer();
  if (
    !state.secondarySelection.active ||
    !isSecondarySelectionScanning() ||
    state.secondarySelection.lockedIndex !== null
  ) {
    return;
  }

  state.secondarySelection.scanTimer = window.setTimeout(() => {
    const group = getActiveSecondarySelection();
    if (!group) {
      renderSecondarySelection();
      return;
    }

    advanceSecondarySelection();
  }, Math.max(0, delayMs));
}

function waitForSecondarySelectionCurrentOptionSpeech() {
  let timeoutId = 0;
  const speechPromise = Promise.resolve(speakSecondarySelectionCurrentOption());
  const fallbackPromise = new Promise((resolve) => {
    timeoutId = window.setTimeout(
      () => resolve({ ok: true, timedOut: true }),
      SECONDARY_SELECTION_OPTION_SPEECH_FALLBACK_MS,
    );
  });

  return Promise.race([speechPromise, fallbackPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function scheduleSecondarySelectionScanAfterCurrentOption() {
  clearSecondarySelectionTimer();
  if (
    !state.secondarySelection.active ||
    !isSecondarySelectionScanning() ||
    state.secondarySelection.lockedIndex !== null
  ) {
    return;
  }

  const sessionId = state.secondarySelection.sessionId;
  waitForSecondarySelectionCurrentOptionSpeech()
    .then((result = {}) => {
      if (
        !state.secondarySelection.active ||
        !isSecondarySelectionScanning() ||
        state.secondarySelection.sessionId !== sessionId ||
        state.secondarySelection.lockedIndex !== null
      ) {
        return;
      }

      if (result.timedOut) {
        addLog("二级选择：选项语音等待超时，继续轮询");
      }
      const delayMs = result.ok ? SECONDARY_SELECTION_POST_SPEECH_DWELL_MS : SECONDARY_SELECTION_SCAN_MS;
      scheduleSecondarySelectionScan(delayMs);
    })
    .catch(() => {
      if (
        state.secondarySelection.active &&
        isSecondarySelectionScanning() &&
        state.secondarySelection.sessionId === sessionId &&
        state.secondarySelection.lockedIndex === null
      ) {
        scheduleSecondarySelectionScan(SECONDARY_SELECTION_SCAN_MS);
      }
    });
}

function advanceSecondarySelection() {
  const group = activeSecondarySelectionGroup();
  if (!group || !isSecondarySelectionScanning()) {
    return;
  }

  state.secondarySelection.index = (state.secondarySelection.index + 1) % group.options.length;
  renderSecondarySelection();
  scheduleSecondarySelectionScanAfterCurrentOption();
}

function clearSecondarySelection({ render = true } = {}) {
  clearSecondarySelectionTimer();
  clearSecondarySelectionIntroTimer();
  clearSecondarySelectionLock();
  state.secondarySelection.active = false;
  state.secondarySelection.phase = "idle";
  state.secondarySelection.sessionId += 1;
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
  state.secondarySelection.phase = "intro";
  state.secondarySelection.groupId = group.id;
  state.secondarySelection.index = 0;
  state.secondarySelection.startedAt = now;
  state.secondarySelection.expiresAt = now + SECONDARY_SELECTION_TIMEOUT_MS;

  const actionText = getActionText(action);
  const prompt = currentLanguage === "en" ? `${actionText} ${group.promptSuffix}.` : `${actionText}，${group.promptSuffix}`;
  setCommunicationMessage(prompt, label);
  if (shouldSpeakSecondarySelectionScan(group)) {
    startSecondarySelectionIntro(prompt);
  } else {
    state.secondarySelection.phase = "scan";
    renderSecondarySelection();
    scheduleSecondarySelectionScan();
    speak(prompt);
  }
  addLog(`${label}：进入二级选择`);
  finishPendingTestRecord({ text: prompt, label, note: "secondary_selection_started" });
  return true;
}

function startInputManagementSelection() {
  const group = SECONDARY_SELECTION_GROUPS.inputChannels;
  clearPendingConfirmation();
  clearSecondarySelection({ render: false });
  forceBlinkCodeEnabled();

  const now = performance.now();
  state.secondarySelection.active = true;
  state.secondarySelection.groupId = group.id;
  state.secondarySelection.index = 0;
  state.secondarySelection.startedAt = now;
  state.secondarySelection.expiresAt = now + SECONDARY_SELECTION_TIMEOUT_MS;
  state.secondarySelection.phase = "intro";

  const prompt = "输入管理：请选择要开启或关闭的动作。眨眼短码始终开启。";
  setCommunicationMessage(prompt, group.label);
  startSecondarySelectionIntro(prompt);
  addLog("进入输入管理");
  return true;
}

function selectInputManagementOption(option, sourceLabel = "短眨选择") {
  const group = SECONDARY_SELECTION_GROUPS.inputChannels;
  if (!option) {
    return false;
  }

  if (isMenuActionCooldownActive() && sourceLabel !== "手动点击") {
    clearSecondarySelectionLock({ resumeScan: true, render: true });
    addLog(`输入管理：菜单内冷却中，已忽略 ${sourceLabel}`);
    finishPendingTestRecord({ note: "menu_action_cooldown_suppressed" });
    return true;
  }

  if (option.type === "exit") {
    clearSecondarySelection();
    announce("已退出输入管理", group.label, { shouldSpeak: true });
    addLog(`输入管理已退出（${sourceLabel}）`);
    finishInputTurnAfterTerminalAction();
    return true;
  }

  let text = "";
  if (option.type === "blinkOnly") {
    setOnlyBlinkInput();
    text = "已切换为仅用眨眼";
  } else if (option.type === "toggleInput") {
    const config = OPTIONAL_INPUT_CHANNELS[option.channel];
    if (!config) {
      return false;
    }
    const nextChecked = !config.toggle.checked;
    setOptionalInputChannel(option.channel, nextChecked);
    text = nextChecked ? option.onText : option.offText;
  }

  if (!text) {
    return false;
  }

  clearSecondarySelectionLock();
  clearSecondarySelectionTimer();
  renderSecondarySelection();
  scheduleSecondarySelectionScan();
  announce(text, group.label, { shouldSpeak: true });
  addLog(`输入管理：${text}（${sourceLabel}）`);
  startMenuActionCooldown();
  startActionCooldown(MENU_ACTION_COOLDOWN_MS);
  return true;
}

function selectSecondarySelection(index = secondarySelectionCurrentIndex(), sourceLabel = "短眨选择") {
  const group = activeSecondarySelectionGroup();
  if (!group) {
    return false;
  }

  if (!isSecondarySelectionScanning()) {
    addLog(`二级选择引导中，已忽略 ${sourceLabel}`);
    finishPendingTestRecord({ note: "secondary_selection_intro_ignored_selection" });
    return true;
  }

  const option = group.options[index] || group.options[state.secondarySelection.index];
  if (!option) {
    return false;
  }

  if (group.id === "inputChannels") {
    return selectInputManagementOption(option, sourceLabel);
  }

  clearSecondarySelection();
  announce(option.text, `${group.label}：${option.label}`, { shouldSpeak: true });
  addLog(`${group.label}二级选择：${option.label}（${sourceLabel}）`);
  finishInputTurnAfterTerminalAction();
  return true;
}

function cancelSecondarySelection({ reason = "cancel", shouldSpeak = true, sourceLabel = t("cancel") } = {}) {
  const group = activeSecondarySelectionGroup();
  if (!group) {
    return false;
  }

  clearSecondarySelection();
  if (group.id === "inputChannels") {
    const text = "已退出输入管理";
    if (shouldSpeak) {
      announce(text, group.label, { shouldSpeak: true });
    } else {
      setCommunicationMessage(text, group.label);
      addLog("输入管理已退出");
      finishPendingTestRecord({ text, label: group.label });
    }
    finishInputTurnAfterTerminalAction();
    return true;
  }

  const label =
    reason === "timeout"
      ? currentLanguage === "en"
        ? `${group.label} timed out`
        : `${group.label}超时`
      : currentLanguage === "en"
        ? `${group.label}: ${sourceLabel}`
        : `${group.label}：${sourceLabel}`;
  if (shouldSpeak) {
    announce("已取消", label, { shouldSpeak: true });
  } else {
    setCommunicationMessage("二级选择已取消", label);
    addLog(`${group.label}二级选择已取消`);
    finishPendingTestRecord({ text: "二级选择已取消", label });
  }
  finishInputTurnAfterTerminalAction();
  return true;
}

function handleSecondarySelectionIgnoredBlinkCode(code) {
  if (!getActiveSecondarySelection()) {
    return false;
  }

  if (code === ".") {
    clearSecondarySelectionLock({ resumeScan: true, render: true });
    setCommunicationMessage("单次短眨已忽略；两次短眨选择当前项，闭眼 3 秒退出。", "二级选择");
    addLog("二级选择：忽略单次短眨");
    finishPendingTestRecord({ note: "single_short_blink_ignored_in_secondary_selection" });
    return true;
  }

  if (code === "-") {
    clearSecondarySelectionLock({ resumeScan: true, render: true });
    setCommunicationMessage("单次长闭眼已忽略；两次短眨选择当前项，闭眼 3 秒退出。", "二级选择");
    addLog("二级选择：忽略单次长闭眼");
    finishPendingTestRecord({ note: "single_long_blink_ignored_in_secondary_selection" });
    return true;
  }

  if (code === "..") {
    clearSecondarySelectionLock({ resumeScan: true, render: true });
    addLog("二级选择：两次短眨未被执行，已交由输入内核忽略");
    finishPendingTestRecord({ note: "secondary_selection_code_ignored_by_input_machine" });
    return true;
  }

  addLog(`二级选择：短码 ${code} 已静默忽略`);
  clearSecondarySelectionLock({ resumeScan: true, render: true });
  finishPendingTestRecord({ note: "unrecognized_code_in_secondary_selection" });
  return true;
}

function startActionConfirmation(action, label = action?.label || "") {
  state.pendingConfirmation = {
    label,
    confirmedText: getActionText(action),
    expiresAt: performance.now() + CONFIRMATION_TIMEOUT_MS,
  };
  const prompt =
    currentLanguage === "en"
      ? `Detected: ${getActionText(action)} Use two short blinks to confirm, or close the eyes for 3 seconds to cancel.`
      : `检测到：${getActionText(action)}。连续两次短眨确认，闭眼 3 秒取消。`;
  announce(prompt, currentLanguage === "en" ? `${label} pending confirmation` : `${label}待确认`, { shouldSpeak: true });
}

function announceAction(action, label = action?.label || "") {
  const text = getActionText(action);
  announce(text, label, { shouldSpeak: true });
  if (action.flash) {
    triggerEmergencyFlash();
  }
}

function executeConfiguredAction(
  action,
  label = action?.label || "",
  { bypassCooldown = false, candidateType = "ordinaryBlinkCode" } = {},
) {
  if (!action) {
    return false;
  }

  if (!bypassCooldown && isActionCooldownActive()) {
    addLog(`${label}：指令冷却中，已忽略重复触发`);
    finishPendingTestRecord({ note: "action_cooldown_suppressed" });
    return true;
  }

  if (shouldBlockActionForFaceQuality(action, candidateType)) {
    return blockActionForFaceQuality(label, action?.category === "emergency" ? "emergencyBlink" : candidateType);
  }

  const secondaryGroup = secondarySelectionGroupForAction(action);
  if (secondaryGroup) {
    const started = startSecondarySelection(secondaryGroup, action, label);
    if (started) {
      startActionCooldown(ACTION_COOLDOWN_MS.default);
    }
    return started;
  }

  if (action.requiresConfirmation) {
    startActionConfirmation(action, label);
    startActionCooldown(ACTION_COOLDOWN_MS.default);
    return true;
  }

  announceAction(action, label);
  finishInputTurnAfterTerminalAction();
  return true;
}

function setCommunicationMessage(text, gestureLabel = "") {
  const displayText = localizeRuntimeText(text);
  const displayLabel = localizeRuntimeText(gestureLabel);
  state.lastPhrase = displayText;
  messageText.textContent = displayText;
  if (gestureLabel) {
    lastGesture.textContent = displayLabel;
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
        text: displayText,
        label: displayLabel || record.label,
      });
    }
  }
}

function setSpeechStatus(stateName, message) {
  if (!speechStatus || !speechStatusText) {
    return;
  }

  speechStatus.dataset.state = stateName;
  speechStatusText.textContent = message || t(`speech${stateName[0].toUpperCase()}${stateName.slice(1)}`);
}

function visibleSpeechFailureMessage(error) {
  const detail = error?.message || String(error || "");
  if (!detail) {
    return t("speechError");
  }

  return currentLanguage === "en" ? `${t("speechError")} ${detail}` : `${t("speechError")} ${detail}`;
}

function cancelSpeech({ markIdle = false, invalidate = true } = {}) {
  if (invalidate) {
    state.speechRequestId += 1;
  }
  if (window.alsAacSpeech?.cancel) {
    window.alsAacSpeech.cancel().catch(() => {});
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (markIdle) {
    setSpeechStatus("idle");
  }
}

function englishSpeechVoiceScore(voice, lang) {
  const normalizedName = voice.name || "";
  const normalizedLang = (voice.lang || "").toLowerCase();
  const targetLang = lang.toLowerCase();

  if (AVOIDED_SPEECH_VOICE_PATTERNS.some((pattern) => pattern.test(normalizedName))) {
    return Number.POSITIVE_INFINITY;
  }

  let score = 0;
  if (normalizedLang === targetLang) {
    score += 0;
  } else if (normalizedLang.startsWith("en-") || normalizedLang === "en") {
    score += 50;
  } else {
    score += 1000;
  }

  const priorityIndex = ENGLISH_VOICE_PRIORITY.findIndex((name) =>
    normalizedName.toLowerCase().includes(name.toLowerCase()),
  );
  score += priorityIndex >= 0 ? priorityIndex * 2 : 80;

  if (voice.localService) {
    score -= 4;
  }

  if (voice.default) {
    score += 6;
  }

  return score;
}

function preferredEnglishSpeechVoice(lang = t("speechLang")) {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return null;
  }

  const candidates = voices.filter((voice) => (voice.lang || "").toLowerCase().startsWith("en"));
  const sorted = (candidates.length ? candidates : voices)
    .map((voice) => ({ voice, score: englishSpeechVoiceScore(voice, lang) }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score);

  return sorted[0]?.voice || null;
}

function warmSpeechVoices() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

function markSpeechQueued(recordId) {
  if (!recordId) {
    return;
  }

  const queuedAt = performance.now();
  const record = state.recording.records.find((item) => item.id === recordId);
  updateTestRecord(recordId, {
    speechQueuedAtMs: Math.round(queuedAt),
    speechQueueLatencyFromDisplayMs:
      record && Number.isFinite(record.displayAtMs) ? Math.round(queuedAt - record.displayAtMs) : null,
  });
}

function markSpeechStarted(recordId) {
  if (!recordId) {
    return;
  }

  const startedAt = performance.now();
  const latestRecord = state.recording.records.find((item) => item.id === recordId);
  updateTestRecord(recordId, {
    speechStartedAtMs: Math.round(startedAt),
    speechStartLatencyFromQueueMs:
      latestRecord && Number.isFinite(latestRecord.speechQueuedAtMs)
        ? Math.round(startedAt - latestRecord.speechQueuedAtMs)
        : null,
  });
}

function speak(text = state.lastPhrase, { onComplete } = {}) {
  return new Promise((resolve) => {
    const speechText = localizeRuntimeText(text);
    if (state.quietMode.active || !speechText || speechText === t("waitingInput")) {
      resolve({ ok: false, skipped: true });
      return;
    }

    const requestId = state.speechRequestId + 1;
    state.speechRequestId = requestId;
    const isCurrentSpeechRequest = () => state.speechRequestId === requestId;
    let completed = false;
    const completeSpeech = (result = { ok: true }) => {
      if (completed) {
        return;
      }
      completed = true;
      if (isCurrentSpeechRequest() && typeof onComplete === "function") {
        window.setTimeout(() => onComplete(result), 0);
      }
      resolve(isCurrentSpeechRequest() ? result : { ok: false, cancelled: true });
    };

    cancelSpeech({ invalidate: false });
    const speechLang = t("speechLang");
    const speechRate = currentLanguage === "en" ? 0.86 : 0.9;
    const recordId = state.recording.pendingRecordId;
    markSpeechQueued(recordId);

    const speakWithBrowser = () => {
      if (!isCurrentSpeechRequest()) {
        completeSpeech({ ok: false, cancelled: true });
        return false;
      }

      if (!("speechSynthesis" in window)) {
        setSpeechStatus("error");
        completeSpeech({ ok: false, skipped: true });
        return false;
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = speechLang;
      if (currentLanguage === "en") {
        const voice = preferredEnglishSpeechVoice(speechLang);
        if (voice) {
          utterance.voice = voice;
        }
      }
      utterance.rate = speechRate;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (recordId) {
        utterance.onstart = () => {
          if (isCurrentSpeechRequest()) {
            markSpeechStarted(recordId);
            setSpeechStatus("speaking");
          }
        };
      } else {
        utterance.onstart = () => {
          if (isCurrentSpeechRequest()) {
            setSpeechStatus("speaking");
          }
        };
      }
      utterance.onend = () => {
        if (isCurrentSpeechRequest()) {
          setSpeechStatus("ok");
        }
        completeSpeech({ ok: true });
      };
      utterance.onerror = (event) => {
        if (isCurrentSpeechRequest()) {
          setSpeechStatus("error");
        }
        completeSpeech({ ok: false, error: event?.error || "browser_speech_error" });
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        if (isCurrentSpeechRequest()) {
          setSpeechStatus("error", visibleSpeechFailureMessage(error));
        }
        completeSpeech({ ok: false, error });
        return false;
      }
      return true;
    };

    if (window.alsAacSpeech?.speak) {
      markSpeechStarted(recordId);
      setSpeechStatus("speaking");
      window.alsAacSpeech
        .speak({
          text: speechText,
          lang: speechLang,
          rate: speechRate,
          volume: 1,
        })
        .then(() => {
          if (!isCurrentSpeechRequest()) {
            completeSpeech({ ok: false, cancelled: true });
            return;
          }
          setSpeechStatus("ok");
          completeSpeech({ ok: true });
        })
        .catch((error) => {
          if (!isCurrentSpeechRequest()) {
            completeSpeech({ ok: false, cancelled: true, error });
            return;
          }
          const failureMessage = visibleSpeechFailureMessage(error);
          addLog(`语音播报失败：${error?.message || error || "系统语音不可用"}`);
          if (!speakWithBrowser()) {
            setSpeechStatus("error", failureMessage);
            completeSpeech({ ok: false, error });
          }
        });
      return;
    }

    if (!speakWithBrowser()) {
      setSpeechStatus("error");
    }
  });
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
  state.blinkCodeEmergencyOnly = false;
  state.blinkCodeStartedAt = null;
  state.blinkCodeLastAt = null;
  state.blinkCodeDurations = [];
  updateCodeBuffer();
}

function blinkSequenceMaxGapAfter(symbol) {
  return symbol === "-" ? BLINK_SEQUENCE_TIMING.maxGapAfterLongMs : BLINK_SEQUENCE_TIMING.maxGapAfterShortMs;
}

function blinkSequenceMaxTotalForCode(code) {
  return BLINK_CODE_MAX_TOTAL_MS[code] ?? BLINK_SEQUENCE_TIMING.maxTotalMs;
}

function blinkSequenceGapDescription(previousSymbol, gap) {
  const previousLabel = previousSymbol === "-" ? "长闭眼" : "短眨眼";
  return `${previousLabel}后间隔 ${Math.round(gap)}ms 超时，已静默清空短码`;
}

function resetBlinkCodeBufferIfSequenceIsStale(meta, now, nextSymbol = "") {
  if (state.blinkCodeBuffer.length === 0) {
    return false;
  }

  const previousSymbol = state.blinkCodeBuffer[state.blinkCodeBuffer.length - 1];
  const previousEndedAt = state.blinkCodeLastAt ?? now;
  const nextStartedAt = meta.actionStartedAtMs ?? meta.actionEndedAtMs ?? now;
  const gap = nextStartedAt - previousEndedAt;

  if (Number.isFinite(gap) && gap > blinkSequenceMaxGapAfter(previousSymbol)) {
    addLog(blinkSequenceGapDescription(previousSymbol, gap));
    clearBlinkCodeBuffer();
    return true;
  }

  const sequenceStartedAt = state.blinkCodeStartedAt ?? nextStartedAt;
  const sequenceEndedAt = meta.actionEndedAtMs ?? now;
  const totalDuration = sequenceEndedAt - sequenceStartedAt;
  const candidateCode = `${state.blinkCodeBuffer.join("")}${nextSymbol}`;
  if (Number.isFinite(totalDuration) && totalDuration > blinkSequenceMaxTotalForCode(candidateCode)) {
    addLog(`短码组合总时长 ${Math.round(totalDuration)}ms 超时，已静默清空短码`);
    clearBlinkCodeBuffer();
    return true;
  }

  return false;
}

function isActionCooldownActive(now = performance.now()) {
  return now < state.actionCooldownUntil;
}

function startActionCooldown(ms = ACTION_COOLDOWN_MS.default) {
  state.actionCooldownUntil = Math.max(state.actionCooldownUntil, performance.now() + ms);
}

function clearRecoveryCooldown() {
  state.recoveryCooldownUntil = 0;
}

function isRecoveryCooldownActive(now = performance.now()) {
  return now < state.recoveryCooldownUntil;
}

function startRecoveryCooldown(ms = RECOVERY_COOLDOWN_MS) {
  state.recoveryCooldownUntil = Math.max(state.recoveryCooldownUntil, performance.now() + ms);
}

function clearMenuActionCooldown() {
  state.menuActionCooldownUntil = 0;
}

function isMenuActionCooldownActive(now = performance.now()) {
  return now < state.menuActionCooldownUntil;
}

function startMenuActionCooldown(ms = MENU_ACTION_COOLDOWN_MS) {
  state.menuActionCooldownUntil = Math.max(state.menuActionCooldownUntil, performance.now() + ms);
}

function shouldPrioritizeBlinkOverOrdinaryBrow(
  now = performance.now(),
  { isClosed = false, activeSecondary = Boolean(getActiveSecondarySelection(now)), activeConfirmation = Boolean(state.pendingConfirmation) } = {},
) {
  if (activeSecondary || activeConfirmation) {
    return false;
  }

  const recentlyReleasedBlink =
    state.lastBlinkReleasedAt > 0 && now - state.lastBlinkReleasedAt <= BROW_BLINK_PRIORITY_GUARD_MS;

  return (
    isClosed ||
    !state.blinkArmed ||
    state.closedFrames > 0 ||
    state.blinkWasClosed ||
    state.blinkClosedAt !== null ||
    state.blinkCodeBuffer.length > 0 ||
    recentlyReleasedBlink
  );
}

function getInteractionMode(now = performance.now()) {
  if (state.quietMode.active) {
    return "QUIET";
  }

  if (isGuidedCalibrationInProgress() || state.calibration.activeTestCode) {
    return "CALIBRATION_OR_TEST";
  }

  if (state.secondarySelection.active && state.secondarySelection.groupId === "inputChannels") {
    return "INPUT_MANAGEMENT";
  }

  if (state.secondarySelection.active) {
    return "SECONDARY_MENU";
  }

  if (state.pendingConfirmation) {
    return "CONFIRM_WINDOW";
  }

  if (isRecoveryCooldownActive(now)) {
    return "RECOVERY_COOLDOWN";
  }

  if (isActionCooldownActive(now)) {
    return "COOLDOWN";
  }

  return "WAITING";
}

function faceQualityTriggerPolicy(quality = state.faceQuality) {
  if (!isFaceQualityGateEnabled()) {
    return "all";
  }

  return quality?.triggerPolicy || (quality?.blocking ? "none" : "all");
}

const EYE_INPUT_CANDIDATES = new Set([
  "ordinaryBlinkCode",
  "emergencyBlink",
  "inputManagement",
  "secondarySelect",
  "confirmation",
  "longCloseExit",
  "longCloseQuiet",
  "quietRecovery",
]);

function canTriggerCandidate(candidate, { quality = state.faceQuality } = {}) {
  const policy = faceQualityTriggerPolicy(quality);
  if (policy === "all") {
    return true;
  }
  if (policy === "eyesOnly") {
    return EYE_INPUT_CANDIDATES.has(candidate);
  }

  return false;
}

function currentAacQualityState(quality = state.faceQuality) {
  const policy = faceQualityTriggerPolicy(quality);
  if (policy === "all") {
    return quality?.level === "usable" ? AAC_QUALITY_STATES.USABLE_WARN : AAC_QUALITY_STATES.GOOD;
  }
  if (policy === "eyesOnly") {
    return AAC_QUALITY_STATES.UNSTABLE_EYES_OK;
  }
  return quality?.reason === "missing" ? AAC_QUALITY_STATES.NO_FACE : AAC_QUALITY_STATES.UNSTABLE_EYES_BAD;
}

function faceQualityBlockReason(quality = state.faceQuality) {
  return quality?.triggerPolicy || quality?.reason || "unknown";
}

function blockCandidateForFaceQuality(candidate, label = "动作", { preserveMessage = true } = {}) {
  const reason = faceQualityBlockReason();
  if (!preserveMessage) {
    setCommunicationMessage("人脸质量不足，请调整手机位置。", "人脸质量");
  } else {
    lastGesture.textContent = localizeRuntimeText("质量不足，已暂停触发");
  }
  addLog(`${label}：质量策略 ${reason} 已阻断 ${candidate}`);
  finishPendingTestRecord({
    label,
    text: preserveMessage ? undefined : "人脸质量不足，请调整手机位置。",
    note: `face_quality_blocked:${candidate}:${reason}`,
  });
  return true;
}

function isFaceQualityGateEnabled() {
  return faceQualityGateToggle?.checked ?? true;
}

function shouldBlockActionForFaceQuality(action, candidate = "ordinaryBlinkCode") {
  if (!isFaceQualityGateEnabled()) {
    return false;
  }

  const candidateType = action?.category === "emergency" ? "emergencyBlink" : candidate;
  return !canTriggerCandidate(candidateType);
}

function blockActionForFaceQuality(label = "动作", candidate = "ordinaryBlinkCode") {
  setCommunicationMessage("人脸质量不足，请调整手机位置。", "人脸质量");
  addLog(`${label}：质量不足，已暂停触发`);
  finishPendingTestRecord({
    label,
    text: "人脸质量不足，请调整手机位置。",
    note: `face_quality_blocked:${candidate}:${faceQualityBlockReason()}`,
  });
  clearBlinkCodeBuffer();
  resetGestureSequences();
  markInputWaiting({ preserveMessage: true });
  return true;
}

function suppressGestureEventForFaceQuality(event, label = "动作") {
  if (!isFaceQualityGateEnabled() || faceQualityTriggerPolicy() === "all") {
    return false;
  }

  const activeSecondary = Boolean(getActiveSecondarySelection());
  const activeConfirmation = Boolean(state.pendingConfirmation);

  if (event.name === "BROW_RAISE" && (activeSecondary || activeConfirmation)) {
    lastGesture.textContent = localizeRuntimeText("质量不足，已暂停触发");
    addLog(`${label}：当前模式中因人脸质量不足已忽略`);
    finishPendingTestRecord({ note: `face_quality_blocked:secondary_or_confirmation:${faceQualityBlockReason()}` });
    return true;
  }

  if (event.name === "HEAD_SHAKE" && (activeSecondary || activeConfirmation)) {
    lastGesture.textContent = localizeRuntimeText("质量不足，已暂停触发");
    addLog(`${label}：当前模式中因人脸质量不足已忽略`);
    finishPendingTestRecord({ note: `face_quality_blocked:secondary_or_confirmation:${faceQualityBlockReason()}` });
    return true;
  }

  if (event.name === "MOUTH_OPEN" || event.name === "SMILE") {
    setCommunicationMessage("人脸质量不足，请调整手机位置。", "人脸质量");
    addLog(`${label}：质量不足，未进入动作组合`);
    finishPendingTestRecord({ note: `face_quality_blocked:optionalGesture:${faceQualityBlockReason()}` });
    resetGestureSequences();
    markInputWaiting({ preserveMessage: true });
    return true;
  }

  return false;
}

function resetPatientInputForBlockedFaceQuality() {
  clearBlinkCodeBuffer();
  resetDetectionWindow();
  resetGestureSequences();
  gestureDetectors.brow.reset();
  gestureDetectors.secondaryBrow.reset();
  gestureDetectors.mouth.reset();
  gestureDetectors.smile.reset();
  headShakeDetector.reset();
}

function clearActionCooldown() {
  state.actionCooldownUntil = 0;
}

function clearTransientCooldowns() {
  clearActionCooldown();
  clearRecoveryCooldown();
  clearMenuActionCooldown();
}

function markInputWaiting({ preserveMessage = true } = {}) {
  if (preserveMessage) {
    lastGesture.textContent = localizeRuntimeText("等待输入");
    updateCodeBuffer();
    return;
  }

  setCommunicationMessage("等待输入", "等待输入");
  updateCodeBuffer();
}

function finishInputTurnAfterTerminalAction({ cooldownMs = ACTION_COOLDOWN_MS.terminal, preserveMessage = true } = {}) {
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  resetDetectionWindow();
  clearRecoveryCooldown();
  clearMenuActionCooldown();
  startActionCooldown(cooldownMs);
  markInputWaiting({ preserveMessage });
}

function clearQuietModeRecovery() {
  window.clearTimeout(state.quietMode.resumeTimer);
  state.quietMode.resumeTimer = 0;
  state.quietMode.resumeBlinkCount = 0;
  state.quietMode.resumeStartedAt = 0;
  state.quietMode.resumeLastAt = 0;
}

function clearQuietMode() {
  state.quietMode.active = false;
  clearQuietModeRecovery();
}

function isGuidedCalibrationInProgress() {
  return state.calibration.active && !state.calibration.confirmed;
}

function recordLongCloseControl({ label, received, duration, startedAt, endedAt, note = "" }) {
  recordTestAction({
    type: "control",
    source: "long_eye_closure",
    label,
    received,
    actionStartedAtMs: startedAt,
    actionEndedAtMs: endedAt,
    detectedAtMs: endedAt,
    durationMs: duration,
    note,
  });
}

function returnToWaitingInputFromLongClose({ duration, startedAt, endedAt }) {
  recordLongCloseControl({
    label: currentLanguage === "en" ? "Exit to waiting" : "闭眼 3 秒退出",
    received: "long_close_exit",
    duration,
    startedAt,
    endedAt,
    note: "long_close_3_to_under_8_seconds",
  });
  cancelSpeech();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  clearTransientCooldowns();
  markInputWaiting({ preserveMessage: false });
  addLog(`长闭眼 ${Math.round(duration)}ms：已退出当前模式，返回待输入`);
  finishPendingTestRecord({ text: "等待输入", label: "已退出", note: "long_close_exit_to_waiting" });
  return true;
}

function enterQuietModeFromLongClose({ duration, startedAt, endedAt }) {
  recordLongCloseControl({
    label: currentLanguage === "en" ? "System quiet mode" : "系统安静模式",
    received: "long_close_quiet_mode",
    duration,
    startedAt,
    endedAt,
    note: "long_close_over_8_seconds",
  });
  cancelSpeech();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  clearRecoveryCooldown();
  clearMenuActionCooldown();
  state.quietMode.active = true;
  clearQuietModeRecovery();
  setCommunicationMessage("系统安静中，连续短眨 4 次恢复文字和语音播报。", "系统安静模式");
  addLog(`长闭眼 ${Math.round(duration)}ms：进入系统安静模式，仅监听连续 4 次短眨恢复`);
  finishPendingTestRecord({ text: "系统安静中", label: "系统安静模式", note: "quiet_mode_started" });
  return true;
}

function startObservedEyeClosure(now) {
  state.blinkWasClosed = true;
  state.blinkClosedAt = now;
  state.blinkClosedObservedMs = 0;
  state.blinkClosedLastObservedAt = now;
}

function updateObservedEyeClosure(now) {
  if (!state.blinkWasClosed) {
    startObservedEyeClosure(now);
    return;
  }

  const previousObservedAt = state.blinkClosedLastObservedAt || now;
  const observedGap = Math.max(0, now - previousObservedAt);
  state.blinkClosedObservedMs += Math.min(observedGap, LONG_CLOSE_CONTROL.maxObservedFrameGapMs);
  state.blinkClosedLastObservedAt = now;
}

function handleSustainedLongCloseWhileClosed(now) {
  if (
    state.blinkClosureConsumed ||
    state.quietMode.active ||
    isGuidedCalibrationInProgress() ||
    state.blinkClosedObservedMs < LONG_CLOSE_CONTROL.quietMinMs ||
    !canTriggerCandidate("longCloseQuiet")
  ) {
    return false;
  }

  state.blinkClosureConsumed = true;
  enterQuietModeFromLongClose({
    duration: state.blinkClosedObservedMs,
    startedAt: state.blinkClosedAt,
    endedAt: now,
  });
  blinkState.textContent = localizeRuntimeText("闭眼");
  return true;
}

function handleLongCloseControl(duration, startedAt, endedAt) {
  if (isGuidedCalibrationInProgress()) {
    return false;
  }

  if (duration >= LONG_CLOSE_CONTROL.quietMinMs) {
    if (!canTriggerCandidate("longCloseQuiet")) {
      blockCandidateForFaceQuality("longCloseQuiet", "长闭眼安静模式");
      return true;
    }
    return enterQuietModeFromLongClose({ duration, startedAt, endedAt });
  }

  if (duration >= LONG_CLOSE_CONTROL.exitMinMs) {
    if (!canTriggerCandidate("longCloseExit")) {
      blockCandidateForFaceQuality("longCloseExit", "长闭眼退出");
      return true;
    }
    return returnToWaitingInputFromLongClose({ duration, startedAt, endedAt });
  }

  return false;
}

function resumeFromQuietMode() {
  clearQuietMode();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  startRecoveryCooldown();
  announce("已恢复，等待输入", "已恢复", { shouldSpeak: true });
  addLog("连续 4 次短眨：已恢复文字和语音播报");
}

function handleQuietModeRecoveryTimeout(expectedCount) {
  state.quietMode.resumeTimer = 0;
  if (!state.quietMode.active || state.quietMode.resumeBlinkCount !== expectedCount) {
    return;
  }

  if (state.blinkWasClosed || state.blinkClosedAt !== null) {
    state.quietMode.resumeTimer = window.setTimeout(
      () => handleQuietModeRecoveryTimeout(expectedCount),
      BLINK_SYMBOLS.closedDeferMs,
    );
    return;
  }

  clearQuietModeRecovery();
  if (expectedCount === 3) {
    executeBlinkEmergencyCode({ note: "quiet_mode_emergency_after_three_short_blinks" });
    return;
  }

  setCommunicationMessage("系统安静中，连续短眨 4 次恢复文字和语音播报。", "系统安静模式");
  addLog("系统安静模式恢复短眨超时，已重新计数");
}

function scheduleQuietModeRecoveryTimeout(count) {
  window.clearTimeout(state.quietMode.resumeTimer);
  state.quietMode.resumeTimer = window.setTimeout(
    () => handleQuietModeRecoveryTimeout(count),
    LONG_CLOSE_CONTROL.resumeMaxGapMs,
  );
}

function handleQuietModeBlinkCandidate(duration, now) {
  if (!state.quietMode.active) {
    return false;
  }

  if (!canTriggerCandidate("quietRecovery")) {
    addLog(`安静模式恢复短眨因质量策略 ${faceQualityBlockReason()} 已忽略`);
    return true;
  }

  if (duration < LONG_CLOSE_CONTROL.resumeBlinkMinMs || duration > LONG_CLOSE_CONTROL.resumeBlinkMaxMs) {
    addLog(`安静模式中忽略非恢复短眨 ${Math.round(duration)}ms`);
    return true;
  }

  const gapFromLast = state.quietMode.resumeLastAt ? now - state.quietMode.resumeLastAt : 0;
  if (
    !state.quietMode.resumeStartedAt ||
    now - state.quietMode.resumeStartedAt > LONG_CLOSE_CONTROL.resumeWindowMs ||
    gapFromLast > LONG_CLOSE_CONTROL.resumeMaxGapMs
  ) {
    window.clearTimeout(state.quietMode.resumeTimer);
    state.quietMode.resumeTimer = 0;
    state.quietMode.resumeStartedAt = now;
    state.quietMode.resumeBlinkCount = 0;
  }

  state.quietMode.resumeBlinkCount += 1;
  state.quietMode.resumeLastAt = now;
  const count = state.quietMode.resumeBlinkCount;
  if (count >= LONG_CLOSE_CONTROL.resumeBlinkCount) {
    resumeFromQuietMode();
    return true;
  }

  scheduleQuietModeRecoveryTimeout(count);

  setCommunicationMessage(`系统安静中，连续短眨 4 次恢复（${count}/4）`, "系统安静模式");
  addLog(`系统安静模式恢复短眨 ${count}/${LONG_CLOSE_CONTROL.resumeBlinkCount}`);
  return true;
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

function requiresConfirmedCalibrationForActionMapping() {
  return true;
}

function canUseActionMapping() {
  return !requiresConfirmedCalibrationForActionMapping() || hasConfirmedCalibration();
}

function isActionMappingBlockedByCalibration() {
  if (state.calibration.collecting && currentCalibrationStep().kind !== "test") {
    return true;
  }

  return requiresConfirmedCalibrationForActionMapping() && state.calibration.active && !state.calibration.confirmed;
}

function showCalibrationActionGateFeedback(sourceLabel = "动作") {
  const now = performance.now();
  if (now - state.lastCalibrationGateFeedbackAt < 1500) {
    return;
  }

  state.lastCalibrationGateFeedbackAt = now;
  setCommunicationMessage(
    `${sourceLabel}已识别；当前仍在校准流程中，不触发通信动作。完成核心校准后请点击“完成确认”。`,
    "校准保护",
  );
  addLog(`${sourceLabel}已识别，但校准尚未确认，未触发通信动作`);
}

function showIosCalibrationGateHint({ afterCameraStart = false } = {}) {
  if (PLATFORM_MODE !== "ios" || hasConfirmedCalibration()) {
    return;
  }

  const text =
    currentLanguage === "en"
      ? afterCameraStart
        ? "Camera is running. On iPhone, complete Guided calibration and tap Confirm before actions trigger text or speech. Blink code is always on; eyebrow, mouth, smile, and head shake must also be enabled in Input."
        : "iPhone first use: complete Guided calibration and tap Confirm before actions trigger text or speech. Blink code is always on; optional facial actions must be enabled in Input."
      : afterCameraStart
        ? "摄像头已启动。iPhone 首次使用请先完成引导校准并点击“完成确认”，动作才会触发文字和语音。眨眼短码始终开启；抬眉、张嘴、微笑、摇头还需要在“输入”里开启。"
        : "iPhone 首次使用请先完成引导校准并点击“完成确认”，动作才会触发文字和语音。眨眼短码始终开启；抬眉、张嘴、微笑、摇头还需要在“输入”里开启。";
  const label = currentLanguage === "en" ? "Not calibrated" : "未校准";
  setCommunicationMessage(text, label);
  addLog(
    currentLanguage === "en"
      ? "iPhone first-use hint shown: calibration is required before action mapping."
      : "已提示 iPhone 首次使用需要先完成校准和输入开关设置",
  );
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
    const clampedHoldFrames = Math.min(
      2,
      Math.round(clamp(holdFrames, Number(holdFramesRange.min), Number(holdFramesRange.max))),
    );
    holdFramesRange.value = clampedHoldFrames.toString();
    holdFramesValue.textContent = clampedHoldFrames.toString();
  }

  state.calibration.active = true;
  state.calibration.stepIndex = CALIBRATION_STEPS.findIndex((step) => step.id === "review");
  state.calibration.collecting = false;
  state.calibration.collectStartedAt = 0;
  state.calibration.blinkFeedbackAt = 0;
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
      : currentLanguage === "en" ? "local" : "本地";
  guidedTestStatus.textContent = localizeRuntimeText(`已载入同一患者本地校准档案（${savedDateText}）。更换患者或状态变化时请重置。`);
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
      ? currentLanguage === "en" ? "Confirmed" : "已确认"
      : `${activeCalibrationStepIndex}/${activeCalibrationStepCount}${state.calibration.collecting ? currentLanguage === "en" ? " collecting" : " 采集中" : ""}`
    : t("notStarted");
  if (!state.calibration.active) {
    calibrationTitle.textContent = currentLanguage === "en" ? "Prepare calibration" : "准备校准";
    calibrationInstruction.textContent =
      currentLanguage === "en"
        ? "First click Start in the camera area. After the full face is visible and lighting is stable, click Start calibration."
        : "先点击摄像头区域的“启动”，确认人脸完整、光线稳定后点击“开始校准”。";
  } else if (isConfirmed) {
    calibrationTitle.textContent = currentLanguage === "en" ? "Calibration complete" : "校准已完成";
    calibrationInstruction.textContent =
      currentLanguage === "en"
        ? "Communication input is ready. The same patient profile will be reused next time; recalibrate if the condition changes noticeably."
        : "可以开始通信输入；同一患者下次打开会自动沿用，状态变化明显时再重新校准。";
  } else if (isWaitingForCamera) {
    calibrationTitle.textContent = step.title;
    calibrationInstruction.textContent =
      currentLanguage === "en"
        ? "Click Start in the camera area and allow camera permission. Collect after the face is visible."
        : "请先点击摄像头区域的“启动”并允许摄像头权限，看到人脸后再采集。";
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
  calibrationStartButton.textContent = state.calibration.active
    ? currentLanguage === "en" ? "Recalibrate" : "重新校准"
    : currentLanguage === "en" ? "Start calibration" : "开始校准";
  calibrationCollectButton.textContent = isWaitingForCamera
    ? currentLanguage === "en" ? "Waiting for camera" : "等待摄像头"
    : state.calibration.collecting
      ? currentLanguage === "en" ? "Stop" : "停止"
      : step.kind === "blink"
        ? currentLanguage === "en" ? "Start recording" : "开始记录"
        : t("collect");
  calibrationCollectButton.hidden =
    !state.calibration.active || isConfirmed || isTestStep || step.kind === "check";
  calibrationCollectButton.disabled = !canCollect;
  calibrationNextButton.hidden = !state.calibration.active || !isTestStep || isConfirmed;
  calibrationNextButton.textContent = isTestStep
    ? isConfirmed
      ? currentLanguage === "en" ? "Confirmed" : "已确认"
      : currentLanguage === "en" ? "Confirm" : "完成确认"
    : t("next");
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
  clearQuietMode();
  clearTransientCooldowns();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  clearSavedCalibrationProfile();
  state.calibration.active = false;
  state.calibration.stepIndex = 0;
  state.calibration.collecting = false;
  state.calibration.collectStartedAt = 0;
  state.calibration.blinkFeedbackAt = 0;
  state.calibration.confirmed = false;
  state.calibration.completedStepIds = [];
  state.calibration.activeTestCode = "";
  state.calibration.guidedTestResults = {};
  state.calibration.samples.openEar = [];
  state.calibration.samples.closedEar = [];
  state.calibration.samples.shortBlinkDurations = [];
  state.calibration.samples.longBlinkDurations = [];
  calibratedThresholdResult.textContent = "--";
  guidedTestStatus.textContent = localizeRuntimeText("校准已重置。点击“开始校准”后按提示采集。");
  updateCalibrationUI();
  addLog("引导校准已重置，本地校准档案已清除");
}

function startCalibrationGuide() {
  cancelSpeech();
  clearQuietMode();
  clearTransientCooldowns();
  clearBlinkCodeBuffer();
  clearPendingConfirmation();
  resetGestureSequences();
  state.calibration.active = true;
  state.calibration.stepIndex = CALIBRATION_STEPS.findIndex((step) => step.id === "open");
  state.calibration.collecting = false;
  state.calibration.collectStartedAt = 0;
  state.calibration.blinkFeedbackAt = 0;
  state.calibration.confirmed = false;
  state.calibration.completedStepIds = [];
  state.calibration.activeTestCode = "";
  state.calibration.guidedTestResults = {};
  state.calibration.samples.openEar = [];
  state.calibration.samples.closedEar = [];
  state.calibration.samples.shortBlinkDurations = [];
  state.calibration.samples.longBlinkDurations = [];
  calibratedThresholdResult.textContent = "--";
  markCalibrationStepComplete("position");
  guidedTestStatus.textContent = state.running
    ? currentLanguage === "en"
      ? "Keep the eyes naturally open. Click Collect when ready."
      : "请保持自然睁眼，准备好后点击“采集”。"
    : currentLanguage === "en"
      ? "Click Start in the camera area first. Collect after the face is visible."
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
      ? currentLanguage === "en"
        ? "All blink-code tests have passed. You can also choose an item to retest."
        : "短码测试已全部通过，也可以重新选择项目复测。"
      : currentLanguage === "en"
        ? `Core calibration is complete. You can click Confirm now. Blink-code testing is optional. Progress ${guidedTestProgressText()}.`
        : `核心校准完成，可直接点“完成确认”。短码测试可选，当前进度 ${guidedTestProgressText()}。`;
    return;
  }

  guidedTestStatus.textContent =
    step.kind === "blink"
      ? currentLanguage === "en"
        ? `${step.title}: click Start recording and follow the prompt.`
        : `${step.title}：点击“开始记录”后按提示做动作。`
      : currentLanguage === "en"
        ? `${step.title}: click Collect when ready.`
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
      guidedTestStatus.textContent =
        currentLanguage === "en"
          ? "The current test is still waiting for input. Complete it or reset calibration first."
          : "当前测试还在等待输入，请先完成或重置校准。";
      addLog("短码测试等待输入中，暂不能完成确认");
      return;
    }

    markCalibrationStepComplete(step.id);
    state.calibration.confirmed = true;
    guidedTestStatus.textContent = hasCompletedGuidedTests()
      ? currentLanguage === "en"
        ? "All blink-code tests passed. Calibration is confirmed. Engineering tests can still be repeated."
        : "全部短码测试已通过，校准已确认。工程测试仍可继续复测。"
      : currentLanguage === "en"
        ? `Calibration confirmed. Engineering tests can continue checking blink codes. Progress ${guidedTestProgressText()}.`
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

  if (state.calibration.collecting) {
    stopCalibrationCollection(
      currentLanguage === "en"
        ? "Collection stopped. Click Start recording again when ready."
        : "采集已停止。准备好后可再次点击“开始记录”。",
    );
    return;
  }

  if (!state.running) {
    guidedTestStatus.textContent = localizeRuntimeText("请先启动摄像头，再采集校准样本。");
    addLog("请先启动摄像头再采集校准样本");
    return;
  }

  const step = currentCalibrationStep();
  if (step.kind === "check") {
    advanceToNextCalibrationStep();
    return;
  }

  if (step.kind === "test") {
    guidedTestStatus.textContent = localizeRuntimeText("核心校准已完成，可直接点“完成确认”。短码测试是可选验证。");
    return;
  }

  state.calibration.active = true;
  state.calibration.collecting = true;
  state.calibration.collectStartedAt = performance.now();
  state.calibration.blinkFeedbackAt = 0;
  if (step.sampleKey) {
    state.calibration.samples[step.sampleKey] = [];
  }
  if (step.kind === "blink") {
    resetDetectionWindow();
    clearBlinkCodeBuffer();
  }
  calibrationProgress.style.width = "0%";
  calibrationProgress.classList.add("is-collecting");
  if (step.id === "long") {
    guidedTestStatus.textContent =
      currentLanguage === "en"
        ? "Long eye-closure collection started. Close the eyes and hold for about 1 second; it will record automatically."
        : "长闭眼采集已开始。请闭眼并保持约 1 秒，系统会自动记录。";
  } else if (step.kind === "blink") {
    guidedTestStatus.textContent =
      currentLanguage === "en"
        ? `${step.title}: collecting. Follow the action prompt.`
        : `${step.title}采集中，请按提示做动作。`;
  } else {
    guidedTestStatus.textContent =
      currentLanguage === "en"
        ? `${step.title}: collecting. Please hold the pose.`
        : `${step.title}采集中，请保持姿势。`;
  }
  addLog(`开始采集：${step.title}`);
  updateCalibrationUI();
}

function stopCalibrationCollection(message, { resetProgress = true } = {}) {
  if (!state.calibration.collecting) {
    return;
  }

  state.calibration.collecting = false;
  state.calibration.collectStartedAt = 0;
  state.calibration.blinkFeedbackAt = 0;
  calibrationProgress.classList.remove("is-collecting");
  if (resetProgress) {
    calibrationProgress.style.width = isCalibrationStepComplete(currentCalibrationStep().id) ? "100%" : "0%";
  }
  guidedTestStatus.textContent = localizeRuntimeText(message);
  addLog(message);
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
  state.calibration.blinkFeedbackAt = 0;
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

function isCollectingLongBlinkCalibration() {
  const step = currentCalibrationStep();
  return state.calibration.collecting && step.kind === "blink" && step.id === "long";
}

function updateCalibrationBlinkBlockFeedback(now, zhMessage, enMessage) {
  const step = currentCalibrationStep();
  if (!state.calibration.collecting || step.kind !== "blink" || now - state.calibration.blinkFeedbackAt < 600) {
    return;
  }

  guidedTestStatus.textContent = currentLanguage === "en" ? enMessage : zhMessage;
  state.calibration.blinkFeedbackAt = now;
}

function maybeRecordHeldLongBlinkCalibration(now) {
  if (!isCollectingLongBlinkCalibration() || !state.blinkWasClosed) {
    return false;
  }

  const duration = state.blinkClosedObservedMs;
  if (duration <= 0) {
    return false;
  }

  const targetMs = CALIBRATION_BLINK_SAMPLE.longAutoRecordMs;
  const progress = clamp(duration / targetMs, 0, 1);
  calibrationProgress.style.width = `${Math.max(8, Math.round(progress * 100))}%`;

  if (duration < targetMs) {
    if (now - state.calibration.blinkFeedbackAt >= 300) {
      const remainingSeconds = Math.max(0.1, (targetMs - duration) / 1000).toFixed(1);
      guidedTestStatus.textContent =
        currentLanguage === "en"
          ? `Long eye closure detected. Hold for about ${remainingSeconds}s more.`
          : `已检测到闭眼，继续保持约 ${remainingSeconds} 秒即可自动记录。`;
      state.calibration.blinkFeedbackAt = now;
    }
    return false;
  }

  recordCalibrationBlink("-", duration);
  state.blinkClosureConsumed = true;
  state.calibration.blinkFeedbackAt = 0;
  guidedTestStatus.textContent =
    currentLanguage === "en"
      ? "Long eye-closure sample recorded. You can reopen now and confirm calibration."
      : "长闭眼样本已自动记录。现在可以睁开，并完成校准确认。";
  addLog(`长闭眼样本自动记录：${Math.round(duration)}ms`);
  return true;
}

function checkCalibrationBlinkCollectionTimeout(now) {
  const step = currentCalibrationStep();
  if (!state.calibration.collecting || step.kind !== "blink") {
    return;
  }

  const timeoutMs = step.timeoutMs || CALIBRATION_BLINK_SAMPLE.timeoutMs;
  if (now - state.calibration.collectStartedAt < timeoutMs) {
    return;
  }

  stopCalibrationCollection(
    step.id === "long"
      ? currentLanguage === "en"
        ? "Long eye-closure sample timed out. Reopen clearly, start again, then hold the eyes closed for about 1 second until progress completes."
        : "长闭眼样本超时。请先明显睁开，再重新开始；闭眼保持约 1 秒，看到进度完成即可。"
      : currentLanguage === "en"
        ? "Short-blink sample timed out. Try again with three clear short blinks, about 1 second apart."
        : "短眨样本超时。请重新开始，做 3 次清楚的短眨，每次间隔约 1 秒。",
  );
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

function recordCalibrationBlinkCandidate(duration) {
  const step = currentCalibrationStep();
  if (!state.calibration.collecting || step.kind !== "blink") {
    return false;
  }

  if (step.id === "short") {
    if (duration >= BLINK_SYMBOLS.shortMinMs && duration <= BLINK_SYMBOLS.shortMaxMs) {
      recordCalibrationBlink(".", duration);
    } else {
      guidedTestStatus.textContent =
        duration > BLINK_SYMBOLS.shortMaxMs
          ? localizeRuntimeText("这次闭眼偏长。短眨样本请快速闭眼并明显睁开。")
          : localizeRuntimeText("这次闭眼太短，未计入。请再做一次清楚的短眨。");
      addLog(`短眨样本未计入：${Math.round(duration)}ms`);
    }
    return true;
  }

  if (step.id === "long") {
    if (duration >= BLINK_SYMBOLS.longMinMs && duration <= CALIBRATION_BLINK_SAMPLE.longMaxMs) {
      recordCalibrationBlink("-", duration);
    } else {
      guidedTestStatus.textContent =
        duration > CALIBRATION_BLINK_SAMPLE.longMaxMs
          ? localizeRuntimeText("这次闭眼太久，未计入。请重新做一次约 1 秒的长闭眼，闭完要明显睁开。")
          : localizeRuntimeText("这次闭眼太短，未计入。长闭眼请保持约 1 秒后再睁开。");
      addLog(`长闭眼样本未计入：${Math.round(duration)}ms`);
    }
    return true;
  }

  return false;
}

function startGuidedTest() {
  if (!state.running) {
    guidedTestStatus.textContent = localizeRuntimeText("请先启动摄像头");
    addLog("请先启动摄像头再测试短码");
    return;
  }

  if (!state.calibration.active || currentCalibrationStep().kind !== "test") {
    guidedTestStatus.textContent = localizeRuntimeText("请先完成前面校准步骤，并进入“测试短码”。");
    addLog("尚未进入短码测试步骤");
    return;
  }

  if (!hasCompletedCoreCalibration()) {
    guidedTestStatus.textContent = localizeRuntimeText("请先完成睁眼、闭眼、短眨和长闭眼样本采集。");
    addLog("核心校准未完成，暂不能测试短码");
    return;
  }

  clearBlinkCodeBuffer();
  clearTransientCooldowns();
  clearPendingConfirmation();
  resetGestureSequences();
  state.calibration.activeTestCode = guidedTestSelect.value;
  guidedTestStatus.textContent = localizeRuntimeText(`等待输入：${displayBlinkCode(state.calibration.activeTestCode)}`);
  addLog(`开始测试短码 ${state.calibration.activeTestCode}`);
  updateCalibrationUI();
}

function recordGuidedTestCode(
  code,
  { overflowed = false } = {},
) {
  if (!state.calibration.activeTestCode) {
    return false;
  }

  const expected = state.calibration.activeTestCode;

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
      guidedTestStatus.textContent = localizeRuntimeText(`通过：收到 ${displayBlinkCode(code)}。可点“完成确认”，也可继续测试 ${displayBlinkCode(nextCode)}。进度 ${guidedTestProgressText()}。`);
    } else {
      guidedTestStatus.textContent = localizeRuntimeText("全部短码测试已通过，可以点击“完成确认”。");
    }
  } else {
    guidedTestStatus.textContent = localizeRuntimeText(`不匹配：期望 ${displayBlinkCode(expected)}，收到 ${overflowed ? "过长短码" : displayBlinkCode(code)}。请重新点“测试”。`);
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
  finishInputTurnAfterTerminalAction();
  return true;
}

function cancelPendingGesture(label) {
  const pending = getActiveConfirmation();
  if (!pending) {
    return false;
  }

  clearPendingConfirmation();
  announce("已取消", `${pending.label}${label}取消`, { shouldSpeak: true });
  finishInputTurnAfterTerminalAction();
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
  finishInputTurnAfterTerminalAction();
  return null;
}

function openInputManagementFromBlinkCode({ note = "input_management_started" } = {}) {
  if (!canTriggerCandidate("inputManagement")) {
    blockCandidateForFaceQuality("inputManagement", "输入管理");
    return true;
  }

  if (!canUseActionMapping()) {
    setCommunicationMessage("输入管理短码已识别；完成并确认引导校准后才打开菜单。", "未确认");
    addLog("输入管理短码已识别，因引导校准未确认而未打开");
    finishPendingTestRecord({ note: "calibration_not_confirmed" });
    return true;
  }

  startInputManagementSelection();
  startActionCooldown(ACTION_COOLDOWN_MS.default);
  finishPendingTestRecord({ text: "进入输入管理", label: "输入管理", note });
  return true;
}

function executeBlinkEmergencyCode({ note = "emergency_blink_code" } = {}) {
  const action = getActionConfigByGestureId(BLINK_CODE_GESTURE_IDS[EMERGENCY_BLINK_CODE]);
  if (!action) {
    addLog("紧急求助短码已识别，但没有启用对应语义");
    finishPendingTestRecord({ note: "emergency_action_config_missing" });
    return true;
  }

  if (!canUseActionMapping()) {
    setCommunicationMessage(`短码 ${displayBlinkCode(EMERGENCY_BLINK_CODE)} 已识别；完成并确认引导校准后才播报短语。`, "未确认");
    addLog("紧急求助短码已识别，因引导校准未确认而未播报");
    finishPendingTestRecord({ note: "calibration_not_confirmed" });
    return true;
  }

  if (shouldBlockActionForFaceQuality(action, "emergencyBlink")) {
    blockCandidateForFaceQuality("emergencyBlink", action.label || `短码 ${displayBlinkCode(EMERGENCY_BLINK_CODE)}`, {
      preserveMessage: false,
    });
    return true;
  }

  clearQuietMode();
  clearTransientCooldowns();
  clearPendingConfirmation();
  clearSecondarySelection();
  addLog(`紧急求助短码已触发（${note}）`);
  executeConfiguredAction(action, action.label || `短码 ${displayBlinkCode(EMERGENCY_BLINK_CODE)}`, {
    bypassCooldown: true,
    candidateType: "emergencyBlink",
  });
  return true;
}

function executePendingConfirmationFromInputMachine(code = "..") {
  const pending = getActiveConfirmation();
  if (!pending) {
    return false;
  }

  if (!canTriggerCandidate("confirmation")) {
    blockCandidateForFaceQuality("confirmation", pending.label || "确认");
    return true;
  }

  clearPendingConfirmation();
  announce(pending.confirmedText, `${pending.label}已确认`, { shouldSpeak: true });
  rememberConsumedBlinkCode(code, "pending_confirmation_confirmed");
  finishInputTurnAfterTerminalAction();
  return true;
}

function handlePendingConfirmationIgnoredBlinkCode(code) {
  const pending = getActiveConfirmation();
  if (!pending) {
    return false;
  }

  if (code === ".") {
    setCommunicationMessage("单次短眨已忽略，请连续两次短眨确认，闭眼 3 秒取消。", pending.label);
    addLog(`${pending.label}：单次短眨已忽略`);
    finishPendingTestRecord({ note: "single_short_blink_ignored_in_confirmation" });
    return true;
  }

  if (code === "-") {
    setCommunicationMessage("单次长闭眼已忽略，请连续两次短眨确认，闭眼 3 秒取消。", pending.label);
    addLog(`${pending.label}：单次长闭眼已忽略`);
    finishPendingTestRecord({ note: "single_long_blink_ignored_in_confirmation" });
    return true;
  }

  if (code === "..") {
    addLog(`${pending.label}：两次短眨未被执行，已交由输入内核忽略`);
    finishPendingTestRecord({ note: "confirmation_code_ignored_by_input_machine" });
    return true;
  }

  setCommunicationMessage("确认未识别：请连续两次短眨确认，闭眼 3 秒取消。", pending.label);
  addLog(`${pending.label}：未识别确认短码 ${code}`);
  finishPendingTestRecord({ note: "unrecognized_confirmation_code" });
  return true;
}

function aacBlinkDecodeMenuOptions() {
  return Object.fromEntries(
    Object.entries(SECONDARY_SELECTION_GROUPS).map(([groupId, group]) => [
      groupId,
      group.options.map((option) => option.id),
    ]),
  );
}

function aacBlinkDecodeMode(now, emergencyOnly) {
  const activeSecondary = getActiveSecondarySelection(now);
  if (activeSecondary?.groupId === "inputChannels") {
    return AAC_INPUT_MODES.INPUT_MANAGEMENT;
  }
  if (activeSecondary) {
    return AAC_INPUT_MODES.SECONDARY_MENU;
  }
  if (getActiveConfirmation(now)) {
    return AAC_INPUT_MODES.CONFIRM_WINDOW;
  }
  if (emergencyOnly) {
    return AAC_INPUT_MODES.COOLDOWN;
  }
  return AAC_INPUT_MODES.WAITING;
}

function createAacBlinkDecodeMachine({ decodedAt, emergencyOnly }) {
  const mode = aacBlinkDecodeMode(decodedAt, emergencyOnly);
  const activeSecondary = getActiveSecondarySelection(decodedAt);
  const activeConfirmation = getActiveConfirmation(decodedAt);
  const initialState = { mode };

  if (activeSecondary) {
    initialState.menu = {
      groupId: activeSecondary.groupId,
      index: state.secondarySelection.index,
      lockedIndex: state.secondarySelection.lockedIndex,
    };
  }

  if (activeConfirmation) {
    initialState.confirmation = {
      id: activeConfirmation.label || "confirmation",
    };
  }

  if (emergencyOnly) {
    initialState.cooldownUntil = decodedAt + 1;
    initialState.menuActionCooldownUntil = decodedAt + 1;
  }

  return createAacInputMachine({
    nowMs: decodedAt,
    qualityState: currentAacQualityState(),
    inputChannels: {
      brow: browToggle.checked,
      mouth: mouthToggle.checked,
      smile: smileToggle.checked,
      head: headShakeToggle.checked,
    },
    menuOptions: aacBlinkDecodeMenuOptions(),
    initialState,
  });
}

function replayBlinkCodeThroughAacMachine(code, { decodedAt, emergencyOnly }) {
  const machine = createAacBlinkDecodeMachine({ decodedAt, emergencyOnly });
  const commands = [];
  let eventAt = decodedAt;

  code.split("").forEach((symbol) => {
    commands.push(
      ...machine.send(
        {
          type: symbol === "." ? AAC_INPUT_EVENTS.SHORT_BLINK : AAC_INPUT_EVENTS.LONG_BLINK,
        },
        eventAt,
      ),
    );
    eventAt += symbol === "." ? 150 : 900;
  });

  commands.push(...machine.advance(2500));
  return commands;
}

function applyImmediateAacBlinkBufferCommands({ now = performance.now(), emergencyOnly = false } = {}) {
  const code = state.blinkCodeBuffer.join("");
  if (
    code !== ".." ||
    emergencyOnly ||
    !getActiveSecondarySelection(now) ||
    isSecondarySelectionIntro()
  ) {
    return false;
  }

  const machine = createAacBlinkDecodeMachine({ decodedAt: now, emergencyOnly: false });
  const commands = [];
  code.split("").forEach((symbol) => {
    commands.push(...machine.send({ type: symbol === "." ? AAC_INPUT_EVENTS.SHORT_BLINK : AAC_INPUT_EVENTS.LONG_BLINK }, now));
  });

  let handled = false;
  commands.forEach((command) => {
    if (command.type === AAC_COMMANDS.LOCK_MENU_ITEM) {
      handled = applySecondarySelectionLockCommand(command, now) || handled;
    }
  });

  return handled;
}

function executeBlinkGestureFromMachine(gestureId, code, { emergencyOnly = false } = {}) {
  if (gestureId === BLINK_CODE_GESTURE_IDS[EMERGENCY_BLINK_CODE]) {
    executeBlinkEmergencyCode({ note: emergencyOnly ? "cooldown_emergency_bypass" : "input_machine_emergency" });
    return true;
  }

  const action = getActionConfigByGestureId(gestureId);
  if (!action) {
    addLog(`短码 ${displayBlinkCode(code)} 已识别，但没有启用对应语义`);
    finishPendingTestRecord({ note: "action_config_missing" });
    return true;
  }

  if (!canUseActionMapping()) {
    setCommunicationMessage(`短码 ${displayBlinkCode(code)} 已识别；完成并确认引导校准后才播报短语。`, "未确认");
    addLog(`短码 ${displayBlinkCode(code)} 已识别，因引导校准未确认而未播报`);
    finishPendingTestRecord({ note: "calibration_not_confirmed" });
    return true;
  }

  executeConfiguredAction(action, action.label || `短码 ${displayBlinkCode(code)}`);
  return true;
}

function handleAacBlinkMachineIgnoredCode(code, { emergencyOnly = false } = {}) {
  if (emergencyOnly && code !== EMERGENCY_BLINK_CODE) {
    addLog(`当前仅监听紧急短码，${displayBlinkCode(code)} 已静默忽略`);
    clearSecondarySelectionLock({ resumeScan: true, render: true });
    finishPendingTestRecord({ note: "emergency_only_buffer_ignored" });
    return true;
  }

  if (getActiveSecondarySelection() && handleSecondarySelectionIgnoredBlinkCode(code)) {
    return true;
  }

  if (getActiveConfirmation() && handlePendingConfirmationIgnoredBlinkCode(code)) {
    return true;
  }

  if (code === ".") {
    addLog("忽略单次短眨");
    finishPendingTestRecord({ note: "single_short_blink_ignored" });
    return true;
  }

  if (code === "-") {
    addLog("忽略单次长闭眼");
    finishPendingTestRecord({ note: "single_long_blink_ignored" });
    return true;
  }

  if (code === "--") {
    addLog("忽略两次长闭眼；该短码当前无默认动作");
    finishPendingTestRecord({ note: "double_long_blink_ignored" });
    return true;
  }

  addLog(`未识别短码 ${code}，已静默忽略`);
  finishPendingTestRecord({ note: "unrecognized_code" });
  return true;
}

function applyAacBlinkMachineCommand(command, code, context) {
  switch (command.type) {
    case AAC_COMMANDS.ACTION:
      return executeBlinkGestureFromMachine(command.gestureId, code, context);
    case AAC_COMMANDS.ENTER_SECONDARY_MENU: {
      const group = SECONDARY_SELECTION_GROUPS[command.groupId];
      const action = group ? getActionConfigByGestureId(group.triggerGestureId) : null;
      return executeBlinkGestureFromMachine(action?.gestureId, code, context);
    }
    case AAC_COMMANDS.ENTER_INPUT_MANAGEMENT:
      return openInputManagementFromBlinkCode({ note: "input_machine_input_management" });
    case AAC_COMMANDS.SELECT_MENU_ITEM:
      if (isSecondarySelectionIntro()) {
        addLog("二级选择引导播报中，已忽略普通选择短码");
        rememberConsumedBlinkCode(code, "secondary_selection_intro_select_ignored");
        return true;
      }
      if (selectSecondarySelection(command.index, currentLanguage === "en" ? "two short blinks" : "两次短眨")) {
        rememberConsumedBlinkCode(code, "secondary_selection_select");
      }
      return true;
    case AAC_COMMANDS.TOGGLE_INPUT_CHANNEL:
      if (selectSecondarySelection(command.index, currentLanguage === "en" ? "two short blinks" : "两次短眨")) {
        rememberConsumedBlinkCode(code, "input_management_select");
      }
      return true;
    case AAC_COMMANDS.EXIT_TO_WAITING:
      if (command.groupId === "inputChannels") {
        if (selectSecondarySelection(command.index, currentLanguage === "en" ? "two short blinks" : "两次短眨")) {
          rememberConsumedBlinkCode(code, "input_management_exit");
        }
        return true;
      }
      return false;
    case AAC_COMMANDS.CONFIRM:
      return executePendingConfirmationFromInputMachine("..");
    case AAC_COMMANDS.BLOCKED:
      blockCandidateForFaceQuality(command.candidate || "ordinaryBlinkCode", "短码");
      return true;
    default:
      return false;
  }
}

function resolveBlinkCodeWithAacInputMachine(code, context) {
  const commands = replayBlinkCodeThroughAacMachine(code, context);
  let ignored = false;

  for (const command of commands) {
    if (command.type === AAC_COMMANDS.LOCK_MENU_ITEM || command.type === AAC_COMMANDS.MODE_CHANGED) {
      continue;
    }

    if (command.type === AAC_COMMANDS.IGNORED) {
      ignored = true;
      continue;
    }

    if (applyAacBlinkMachineCommand(command, code, context)) {
      return true;
    }
  }

  if (ignored || commands.length === 0) {
    return handleAacBlinkMachineIgnoredCode(code, context);
  }

  return false;
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
  const emergencyOnly = state.blinkCodeEmergencyOnly;
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
    addLog(`短码过长 ${code}，已静默忽略`);
    finishPendingTestRecord({ note: "overflow_ignored" });
    return;
  }

  if (recordGuidedTestCode(code, { actionStartedAt, actionEndedAt, decodedAt })) {
    return;
  }

  if (shouldSuppressRecentlyConsumedBlinkCode(code, decodedAt)) {
    return;
  }

  if (resolveBlinkCodeWithAacInputMachine(code, { decodedAt, emergencyOnly })) {
    return;
  }

  handleAacBlinkMachineIgnoredCode(code, { emergencyOnly });
}

function enqueueBlinkSymbol(symbol, meta = {}) {
  forceBlinkCodeEnabled();
  const now = performance.now();
  if (isRecognitionPaused(now)) {
    return;
  }

  if (isActionMappingBlockedByCalibration()) {
    showCalibrationActionGateFeedback(`短码 ${displayBlinkCode(symbol)}`);
    return;
  }

  const isGuidedBlinkTest = state.calibration.activeTestCode && currentCalibrationStep().kind === "test";
  const modalConsumesBlink = Boolean(getActiveSecondarySelection(now) || getActiveConfirmation(now));
  const menuCooldownEmergencyOnly = modalConsumesBlink && isMenuActionCooldownActive(now);
  const emergencyOnlyBuffer =
    !isGuidedBlinkTest &&
    (menuCooldownEmergencyOnly ||
      (!modalConsumesBlink && (isActionCooldownActive(now) || isRecoveryCooldownActive(now))));
  if (emergencyOnlyBuffer && symbol !== ".") {
    return;
  }

  resetBlinkCodeBufferIfSequenceIsStale(meta, now, symbol);

  if (state.blinkCodeBuffer.length === 0) {
    state.blinkCodeStartedAt = meta.actionStartedAtMs ?? meta.actionEndedAtMs ?? now;
    state.blinkCodeDurations = [];
  }
  if (emergencyOnlyBuffer) {
    state.blinkCodeEmergencyOnly = true;
  }
  state.blinkCodeLastAt = meta.actionEndedAtMs ?? now;
  if (Number.isFinite(meta.durationMs)) {
    state.blinkCodeDurations.push(meta.durationMs);
  }
  state.blinkCodeBuffer.push(symbol);
  applyImmediateAacBlinkBufferCommands({ now, emergencyOnly: emergencyOnlyBuffer });
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
    return blinkSequenceMaxGapAfter(code);
  }

  if (code === "--") {
    return BLINK_SYMBOLS.inputManagementContinuationMs;
  }

  if (BLINK_CODE_GESTURE_IDS[code]) {
    return code === ".." ? BLINK_SYMBOLS.decodeDelayMs : BLINK_SYMBOLS.finalDecodeDelayMs;
  }

  return code.includes("-") ? BLINK_SYMBOLS.longSequenceDecodeDelayMs : BLINK_SYMBOLS.decodeDelayMs;
}

function pauseRecognition({ preserveMessage = false } = {}) {
  state.pausedUntil = Number.POSITIVE_INFINITY;
  clearTransientCooldowns();
  clearBlinkCodeBuffer();
  clearRecentlyConsumedBlinkCode();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  resetDetectionWindow();
  pauseRecognitionButton.querySelector("span").textContent = localizeRuntimeText("继续");
  if (!preserveMessage) {
    setCommunicationMessage("识别已暂停", "休息");
  }
}

function resumeRecognition() {
  state.pausedUntil = 0;
  clearTransientCooldowns();
  clearBlinkCodeBuffer();
  clearRecentlyConsumedBlinkCode();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  resetDetectionWindow();
  pauseRecognitionButton.querySelector("span").textContent = t("pauseRecognition");
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
    ...GESTURE_DETECTOR_PARAMS.brow,
    onTrigger: (event) => handleGestureEvent(event, "抬眉"),
  }),
  secondaryBrow: createHoldDetector({
    name: "BROW_RAISE",
    ...GESTURE_DETECTOR_PARAMS.secondaryBrow,
    onTrigger: (event) => handleGestureEvent(event, "抬眉"),
  }),
  mouth: createHoldDetector({
    name: "MOUTH_OPEN",
    ...GESTURE_DETECTOR_PARAMS.mouth,
    onTrigger: (event) => handleGestureEvent(event, "张嘴"),
  }),
  smile: createHoldDetector({
    name: "SMILE",
    ...GESTURE_DETECTOR_PARAMS.smile,
    onTrigger: (event) => handleGestureEvent(event, "微笑"),
  }),
};

const headShakeDetector = {
  direction: "",
  changeCount: 0,
  windowStartedAt: 0,
  lastTriggerAt: 0,
  motionUntil: 0,
  reset({ clearMotion = true } = {}) {
    this.direction = "";
    this.changeCount = 0;
    this.windowStartedAt = 0;
    if (clearMotion) {
      this.motionUntil = 0;
    }
  },
  isTracking(now) {
    return now < this.motionUntil;
  },
  update(yaw, now, enabled) {
    if (!enabled || isRecognitionPaused(now)) {
      this.reset();
      return;
    }

    const direction = yaw > HEAD_SHAKE_YAW_THRESHOLD ? "right" : yaw < -HEAD_SHAKE_YAW_THRESHOLD ? "left" : "";
    if (!direction) {
      if (this.windowStartedAt && now - this.windowStartedAt > HEAD_SHAKE_PARAMS.idleResetMs) {
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
      this.motionUntil = now + SMILE_HEAD_MOTION_GUARD.settleMs;
    }

    if (
      this.changeCount >= HEAD_SHAKE_PARAMS.requiredDirectionChanges &&
      now - this.windowStartedAt <= HEAD_SHAKE_PARAMS.windowMs &&
      now - this.lastTriggerAt >= HEAD_SHAKE_PARAMS.cooldownMs
    ) {
      const duration = now - this.windowStartedAt;
      const peakValue = Math.abs(yaw);
      this.lastTriggerAt = now;
      this.motionUntil = now + SMILE_HEAD_MOTION_GUARD.settleMs;
      this.reset({ clearMotion: false });
      handleGestureEvent({ name: "HEAD_SHAKE", duration, value: peakValue }, "摇头");
    }

    if (this.windowStartedAt && now - this.windowStartedAt > HEAD_SHAKE_PARAMS.windowMs) {
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
    executeConfiguredAction(singleSmileAction, singleSmileAction.label, { candidateType: "optionalGesture" });
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
    executeConfiguredAction(doubleSmileAction, doubleSmileAction.label, { candidateType: "optionalGesture" });
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
    executeConfiguredAction(singleSmileAction, singleSmileAction.label, { candidateType: "optionalGesture" });
  }, SMILE_DOUBLE_WINDOW_MS);
}

function handleGestureEvent(event, label) {
  const gestureId = EVENT_GESTURE_IDS[event.name];
  if (!gestureId) {
    return;
  }

  if (event.name !== "SMILE" || state.calibration.activeTestCode || !canUseActionMapping()) {
    recordGestureAction(event, label);
  }

  if (state.calibration.activeTestCode) {
    setCommunicationMessage(`短码测试中，${label}动作已记录但不执行。`, `${label}测试保护`);
    addLog(`${label}动作：短码测试中未执行`);
    finishPendingTestRecord({ note: "ignored_during_blink_test" });
    return;
  }

  if (!canUseActionMapping()) {
    setCommunicationMessage(`检测到${label}；完成并确认引导校准后才启用动作映射。`, `${label}候选`);
    addLog(`${label}候选：${Math.round(event.duration)}ms，峰值 ${(event.value || 0).toFixed(2)}，校准未确认未播报`);
    finishPendingTestRecord({ note: "calibration_not_confirmed" });
    return;
  }

  const activeSecondary = Boolean(getActiveSecondarySelection());
  const activeConfirmation = Boolean(state.pendingConfirmation);

  if (isRecoveryCooldownActive()) {
    addLog(`${label}动作：恢复冷却中，已忽略`);
    finishPendingTestRecord({ note: "recovery_cooldown_suppressed" });
    return;
  }

  if (isMenuActionCooldownActive() && activeSecondary) {
    addLog(`${label}动作：菜单内冷却中，已忽略`);
    finishPendingTestRecord({ note: "menu_action_cooldown_suppressed" });
    return;
  }

  if (isActionCooldownActive() && !activeSecondary && !activeConfirmation) {
    addLog(`${label}动作：输入回合冷却中，已忽略`);
    finishPendingTestRecord({ note: "action_cooldown_suppressed" });
    return;
  }

  if (
    event.name === "BROW_RAISE" &&
    shouldPrioritizeBlinkOverOrdinaryBrow(performance.now(), { activeSecondary, activeConfirmation })
  ) {
    addLog(`${label}候选：近期有眨眼或短码窗口，已让位给眨眼输入`);
    finishPendingTestRecord({ note: "brow_suppressed_for_blink_priority" });
    return;
  }

  if (suppressGestureEventForFaceQuality(event, label)) {
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
    executeConfiguredAction(action, action?.label || label, { candidateType: "optionalGesture" });
    return;
  }

  if (event.name === "MOUTH_OPEN") {
    if (getActiveSecondarySelection()) {
      setCommunicationMessage("二级选择中：请用两次短眨或抬眉选择，闭眼 3 秒或摇头退出。", "二级选择");
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
      window.clearTimeout(state.gestureSequences.mouthOpenTimer);
      state.gestureSequences.mouthOpenTimer = window.setTimeout(() => {
        state.gestureSequences.mouthOpenTimes = [];
        state.gestureSequences.mouthOpenTimer = 0;
        addLog("张嘴 1/2 超时，已静默清空");
      }, MOUTH_DOUBLE_WINDOW_MS);
      addLog(`${label} 1/2：${Math.round(event.duration)}ms，等待 ${MOUTH_DOUBLE_WINDOW_MS}ms 内第二次张嘴`);
      finishPendingTestRecord({ note: "mouth_open_1_of_2" });
      return;
    }

    window.clearTimeout(state.gestureSequences.mouthOpenTimer);
    state.gestureSequences.mouthOpenTimer = 0;
    resetGestureSequences();
    executeConfiguredAction(action, action?.label || "张嘴2次", { candidateType: "optionalGesture" });
    return;
  }

  if (event.name === "SMILE") {
    if (getActiveSecondarySelection()) {
      setCommunicationMessage("二级选择中：请用两次短眨或抬眉选择，闭眼 3 秒或摇头退出。", "二级选择");
      addLog("二级选择中忽略微笑动作");
      finishPendingTestRecord({ note: "smile_ignored_during_secondary_selection" });
      return;
    }

    handleSmileGesture(event, label);
    return;
  }

  if (event.name === "HEAD_SHAKE") {
    const activeGroup = activeSecondarySelectionGroup();
    if (activeGroup?.id === "inputChannels") {
      lastGesture.textContent = localizeRuntimeText("输入管理中忽略摇头");
      addLog("输入管理中忽略摇头动作，避免刚开启摇头时误退出");
      finishPendingTestRecord({ note: "head_shake_ignored_during_input_management" });
      return;
    }

    if (cancelSecondarySelection({ sourceLabel: label })) {
      return;
    }
    if (cancelPendingGesture(label)) {
      return;
    }
    const action = getActionConfigByGestureId(EVENT_GESTURE_IDS.HEAD_SHAKE);
    executeConfiguredAction(action, action?.label || label, { candidateType: "optionalGesture" });
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

  const pitchJump = Number.isFinite(guard.lastPitch) ? Math.abs(pitch - guard.lastPitch) : 0;
  const centerJump =
    Number.isFinite(guard.lastCenterY) && Number.isFinite(centerY) ? Math.abs(centerY - guard.lastCenterY) : 0;
  const pitchDelta = Math.abs(detectionSignals.headPitchDelta || 0);

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

function isHeadMotionSuppressingSmile(now) {
  const guard = state.smileHeadMotionGuard;

  if (!smileToggle.checked || !headShakeToggle.checked) {
    guard.smileBlockedUntil = 0;
    return false;
  }

  if (headShakeDetector.isTracking(now)) {
    guard.smileBlockedUntil = now + SMILE_HEAD_MOTION_GUARD.settleMs;
  }

  return now < guard.smileBlockedUntil;
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
    option.textContent = currentLanguage === "en" ? "No available camera" : "没有可用摄像头";
    cameraSelect.append(option);
    state.selectedDeviceId = "";
    return cameras;
  }

  cameras.forEach((device, index) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.textContent = device.label || (currentLanguage === "en" ? `Camera ${index + 1}` : `摄像头 ${index + 1}`);
    cameraSelect.append(option);
  });

  if (!state.cameraLabelsReady && !preferredDeviceId) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = currentLanguage === "en" ? "Camera names appear after permission" : "授权后显示摄像头名称";
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
    width: { ideal: 960, max: 1280 },
    height: { ideal: 540, max: 720 },
    frameRate: { ideal: 30, max: 30 },
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
    video: base,
    audio: false,
  };
}

async function getInitialPermission() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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
      currentLanguage === "en" ? "This browser does not support camera access" : "当前浏览器不支持摄像头",
      currentLanguage === "en"
        ? `Open ${window.location.href} in Chrome or Safari, then allow camera permission.`
        : `请用 Chrome 或 Safari 打开 ${window.location.href}，再允许摄像头权限。`,
    );
    return;
  }

  if (!window.isSecureContext) {
    setStatus("需要安全连接", "error");
    addLog("摄像头需要 HTTPS 或本机安全环境");
    showDiagnostic(
      currentLanguage === "en" ? "Camera requires a secure connection" : "摄像头需要安全连接",
      currentLanguage === "en"
        ? "Use an HTTPS address, or open it from localhost / the desktop app on this computer."
        : "请使用 HTTPS 地址，或在本机 localhost/桌面应用中打开。",
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
      const canRetryDefault =
        preferredDeviceId && ["OverconstrainedError", "NotFoundError", "NotReadableError"].includes(error.name);
      if (!canRetryDefault) {
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
    state.detectionErrorCount = 0;
    state.lastVideoTime = -1;
    state.lastFrameAt = performance.now();
    state.fpsSamples = [];
    resetDetectionWindow();
    clearTransientCooldowns();
    clearBlinkCodeBuffer();
    clearRecentlyConsumedBlinkCode();
    clearPendingConfirmation();
    clearSecondarySelection();
    resetGestureSequences();
    resetSignalBaseline();
    resetLiveMetrics("检测中");
    setCommunicationMessage("等待输入", "已启动");
    showIosCalibrationGateHint({ afterCameraStart: true });
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
    clearRecentlyConsumedBlinkCode();
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
  showDiagnostic(
    currentLanguage === "en" ? "Camera disconnected" : "摄像头已断开",
    currentLanguage === "en"
      ? "The camera was disconnected by the system or taken over by another app. Confirm the device is available, then restart."
      : "摄像头设备被系统断开或被其他应用接管。请确认设备可用后重新启动。",
  );
}

function formatCameraError(error) {
  if (error.name === "ModelLoadError") {
    return {
      status: "模型失败",
      log: "人脸模型加载失败",
      title: currentLanguage === "en" ? "Face model failed to load" : "人脸模型加载失败",
      message:
        currentLanguage === "en"
          ? "The local model or WASM files did not load correctly. Run npm install again and make sure the dev server is running in the current project folder."
          : "本地模型或 wasm 文件没有正确加载。请重新运行 npm install，并确认开发服务器仍在当前项目目录启动。",
    };
  }
  if (error.name === "NotAllowedError") {
    return {
      status: "摄像头失败",
      log: "摄像头权限被拒绝",
      title: currentLanguage === "en" ? "Camera permission denied" : "摄像头权限被拒绝",
      message:
        currentLanguage === "en"
          ? `This browser does not have camera permission. Open ${window.location.href} in Chrome or Safari, or allow camera access in macOS Privacy & Security > Camera, then retry.`
          : `当前浏览器没有摄像头权限。请用 Chrome 或 Safari 打开 ${window.location.href}，或在 macOS「隐私与安全性 > 相机」允许当前浏览器后重试。`,
    };
  }
  if (error.name === "NotFoundError") {
    return {
      status: "摄像头失败",
      log: "没有找到可用摄像头",
      title: currentLanguage === "en" ? "No available camera found" : "没有找到可用摄像头",
      message:
        currentLanguage === "en"
          ? "Make sure the MacBook camera is available and not disabled by the system."
          : "请确认 MacBook 摄像头可用，且没有被系统禁用。",
    };
  }
  if (error.name === "NotReadableError") {
    return {
      status: "摄像头失败",
      log: "摄像头被其他应用占用",
      title: currentLanguage === "en" ? "Camera is in use" : "摄像头被占用",
      message:
        currentLanguage === "en"
          ? "Close FaceTime, Zoom, Teams, WeChat video, or any other app using the camera, then click Start."
          : "请先关闭 FaceTime、Zoom、Teams、微信视频等正在使用摄像头的应用，再点击启动。",
    };
  }
  if (error.name === "OverconstrainedError") {
    return {
      status: "摄像头失败",
      log: "指定摄像头不可用，已准备切回默认摄像头",
      title: currentLanguage === "en" ? "Selected camera unavailable" : "指定摄像头不可用",
      message:
        currentLanguage === "en"
          ? "Switch devices in the camera dropdown, or click Start again to use the system default camera."
          : "请在摄像头下拉框里切换设备，或重新点击启动使用系统默认摄像头。",
    };
  }
  return {
    status: "启动失败",
    log: error.message || "摄像头启动失败",
    title: currentLanguage === "en" ? "Camera start failed" : "摄像头启动失败",
    message:
      currentLanguage === "en"
        ? `${error.name || "UnknownError"}: ${error.message || "No further error information"}`
        : `${error.name || "UnknownError"}：${error.message || "没有更多错误信息"}`,
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
      const faceQuality = updateFaceQuality(landmarks);
      updateFaceRoiPreview(landmarks);
      const signals = extractFaceSignals(result, landmarks);
      signals.faceQuality = faceQuality;
      updateFps();
      drawOverlay(landmarks);
      processFaceSignals(signals, performance.now());
      state.detectionErrorCount = 0;
    } catch (error) {
      console.error(error);
      state.detectionErrorCount += 1;
      if (state.detectionErrorCount <= 5) {
        addLog(`检测循环短暂错误 ${state.detectionErrorCount}/5：${error.message || error.name || "未知错误"}`);
        state.rafId = requestAnimationFrame(detectLoop);
        return;
      }
      setStatus("检测失败", "error");
      addLog("检测循环出现错误，已暂停");
      stopCamera(false);
      showDiagnostic(
        currentLanguage === "en" ? "Detection loop error" : "检测循环出现错误",
        error.message || (currentLanguage === "en" ? "Refresh the page and try again." : "请刷新页面后重试。"),
      );
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
  checkCalibrationBlinkCollectionTimeout(now);

  if (isRecognitionPaused(now)) {
    blinkState.textContent = localizeRuntimeText("暂停");
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
    blinkState.textContent = localizeRuntimeText("未见人脸");
    earValue.textContent = "--";
    confidenceLabel.textContent = "--";
    earBar.style.width = "0%";
    updateCalibrationBlinkBlockFeedback(
      now,
      "未见人脸，暂不能采集眨眼样本。请让患者面部进入画面。",
      "No face is visible, so blink samples cannot be collected. Place the patient’s face in view.",
    );
    resetPatientInputForBlockedFaceQuality();
    return;
  }

  const threshold = Number(thresholdRange.value);
  const holdFrames = Number(holdFramesRange.value);
  const ear = signals.ear;

  if (ear === null) {
    blinkState.textContent = localizeRuntimeText("关键点不足");
    earValue.textContent = "--";
    confidenceLabel.textContent = "--";
    earBar.style.width = "0%";
    updateCalibrationBlinkBlockFeedback(
      now,
      "眼部关键点不足，暂不能采集眨眼样本。请调整摄像头角度或光线。",
      "Eye landmarks are insufficient, so blink samples cannot be collected. Adjust camera angle or lighting.",
    );
    resetPatientInputForBlockedFaceQuality();
    return;
  }

  const isClosed = ear < threshold;
  const openness = Math.min(Math.max((ear - 0.12) / 0.24, 0), 1);

  earValue.textContent = ear.toFixed(3);
  earBar.style.width = `${Math.round(openness * 100)}%`;
  confidenceLabel.textContent = localizeRuntimeText(isClosed ? "闭合" : "睁开");
  collectCalibrationFrame(signals, now);

  if (faceQualityTriggerPolicy() === "none") {
    blinkState.textContent = localizeRuntimeText("质量不足");
    lastGesture.textContent = localizeRuntimeText("质量不足，已暂停触发");
    updateCalibrationBlinkBlockFeedback(
      now,
      "眼部关键点不稳定，暂不能采集眨眼样本。请调整摄像头距离、角度或光线。",
      "Eye landmarks are unstable, so blink samples cannot be collected. Adjust camera distance, angle, or lighting.",
    );
    resetPatientInputForBlockedFaceQuality();
    return;
  }

  if (isClosed) {
    updateObservedEyeClosure(now);
    maybeRecordHeldLongBlinkCalibration(now);
    handleSustainedLongCloseWhileClosed(now);
    state.closedFrames += 1;
    state.openFrames = 0;
  } else {
    state.openFrames += 1;
  }

  if (state.closedFrames >= holdFrames && state.blinkArmed) {
    state.blinkArmed = false;
    blinkState.textContent = localizeRuntimeText("闭眼");
  }

  if (!isClosed && !state.blinkArmed && state.openFrames >= 1) {
    state.blinkTotal += 1;
    blinkCount.textContent = state.blinkTotal.toString();
    blinkState.textContent = localizeRuntimeText("眨眼");
    state.blinkArmed = true;
    handleBlinkReleased(now, ear);
    state.closedFrames = 0;
    return;
  }

  if (!isClosed && state.blinkArmed) {
    blinkState.textContent = localizeRuntimeText("睁眼");
    state.closedFrames = 0;
    state.blinkWasClosed = false;
    state.blinkClosedAt = null;
    state.blinkClosedObservedMs = 0;
    state.blinkClosedLastObservedAt = 0;
  }

  if (state.quietMode.active) {
    lastGesture.textContent = localizeRuntimeText("系统安静模式");
    resetGestureSequences();
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.reset();
    gestureDetectors.mouth.reset();
    gestureDetectors.smile.reset();
    headShakeDetector.reset();
    return;
  }

  if (isFaceScaleUnstable(signals, now)) {
    lastGesture.textContent = localizeRuntimeText("画面稳定中");
    resetGestureSequences();
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.reset();
    gestureDetectors.mouth.reset();
    gestureDetectors.smile.reset();
    headShakeDetector.reset();
    return;
  }

  if (faceQualityTriggerPolicy() === "eyesOnly") {
    lastGesture.textContent = localizeRuntimeText("仅保留眼部输入");
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
  const blinkSuppressesOrdinaryBrow = shouldPrioritizeBlinkOverOrdinaryBrow(now, {
    isClosed,
    activeSecondary: secondarySelectionActive,
    activeConfirmation: Boolean(state.pendingConfirmation),
  });

  headShakeDetector.update(detectionSignals.headYaw, now, headShakeToggle.checked);
  const headMotionSuppressesSmile = isHeadMotionSuppressingSmile(now);

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
      lastGesture.textContent = localizeRuntimeText("点头中，抬眉暂停");
    }
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.reset();
  } else if (detectionSignals.mouthOpen >= MOUTH_BROW_SUPPRESS_THRESHOLD) {
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.reset();
  } else if (blinkSuppressesOrdinaryBrow) {
    gestureDetectors.brow.reset();
    gestureDetectors.secondaryBrow.reset();
  } else {
    gestureDetectors.secondaryBrow.reset();
    gestureDetectors.brow.update(detectionSignals.browUp, now, browToggle.checked);
  }

  if (headMotionSuppressesSmile) {
    if (smileToggle.checked && now - headShakeDetector.lastTriggerAt > 250) {
      lastGesture.textContent = localizeRuntimeText("摇头中，微笑暂停");
    }
    resetSmileSequence();
    gestureDetectors.smile.reset();
  } else {
    gestureDetectors.smile.update(mouthLooksActive ? 0 : detectionSignals.smile, now, smileToggle.checked);
  }
}

function handleBlinkReleased(now, ear) {
  const blinkStartedAt = state.blinkClosedAt;
  const wallDuration = blinkStartedAt ? now - blinkStartedAt : 0;
  const duration = state.blinkClosedObservedMs;
  const closureConsumed = state.blinkClosureConsumed;
  state.lastBlinkReleasedAt = now;
  state.blinkWasClosed = false;
  state.blinkClosedAt = null;
  state.blinkClosedObservedMs = 0;
  state.blinkClosedLastObservedAt = 0;
  state.blinkClosureConsumed = false;

  if (closureConsumed) {
    return;
  }

  if (handleQuietModeBlinkCandidate(duration, now)) {
    return;
  }

  if (recordCalibrationBlinkCandidate(duration)) {
    return;
  }

  if (handleLongCloseControl(duration, blinkStartedAt, now)) {
    return;
  }

  if (duration >= BLINK_SYMBOLS.longMinMs && duration <= BLINK_SYMBOLS.longMaxMs) {
    recordCalibrationBlink("-", duration);
    enqueueBlinkSymbol("-", {
      actionStartedAtMs: blinkStartedAt,
      actionEndedAtMs: now,
      durationMs: duration,
    });
    addLog(`长闭眼 ${Math.round(duration)}ms（实际 ${Math.round(wallDuration)}ms，EAR ${ear.toFixed(3)}）`);
    return;
  }

  if (duration >= BLINK_SYMBOLS.shortMinMs && duration <= BLINK_SYMBOLS.shortMaxMs) {
    recordCalibrationBlink(".", duration);
    enqueueBlinkSymbol(".", {
      actionStartedAtMs: blinkStartedAt,
      actionEndedAtMs: now,
      durationMs: duration,
    });
    addLog(`短眨眼 ${Math.round(duration)}ms（实际 ${Math.round(wallDuration)}ms，EAR ${ear.toFixed(3)}）`);
    return;
  }

  addLog(`眨眼 ${Math.round(duration)}ms（实际 ${Math.round(wallDuration)}ms，EAR ${ear.toFixed(3)}）`);
}

function drawOverlay(landmarks) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const shouldDrawLandmarks = Boolean(landmarks && overlayToggle.checked);
  const shouldDrawRoi = Boolean(roiPreviewToggle?.checked && state.faceRoiPreview?.visible);

  if (!shouldDrawLandmarks && !shouldDrawRoi) {
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

  const drawRoiPreview = (preview) => {
    const roi = preview?.roi;
    if (!roi) {
      return;
    }

    const x = roi.x * canvas.width;
    const y = roi.y * canvas.height;
    const width = roi.width * canvas.width;
    const height = roi.height * canvas.height;
    const color = preview.stable ? "rgba(167, 139, 250, 0.95)" : "rgba(251, 191, 36, 0.9)";
    const fill = preview.stable ? "rgba(167, 139, 250, 0.08)" : "rgba(251, 191, 36, 0.08)";

    ctx.save();
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);
    ctx.setLineDash([16, 10]);
    ctx.lineWidth = Math.max(3, canvas.width * 0.0025);
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    ctx.font = `${Math.max(16, canvas.width * 0.014)}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(localizeRuntimeText("ROI 预览"), x + 10, Math.max(22, y + 24));
    ctx.restore();
  };

  if (shouldDrawLandmarks) {
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

  if (shouldDrawRoi) {
    drawRoiPreview(state.faceRoiPreview);
  }
}

function resetCounters() {
  state.blinkTotal = 0;
  clearQuietMode();
  clearTransientCooldowns();
  resetDetectionWindow();
  clearBlinkCodeBuffer();
  clearRecentlyConsumedBlinkCode();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  blinkCount.textContent = "0";
  blinkState.textContent = localizeRuntimeText(state.running ? "检测中" : "未检测");
  emergencyOverlay.classList.remove("is-active");
  if (emergencyFlashTimer) {
    clearTimeout(emergencyFlashTimer);
    emergencyFlashTimer = null;
  }
  addLog("计数已清零");
}

function applyLanguage({ loadActionText = true } = {}) {
  applyStaticLanguage();
  applySecondarySelectionLanguage();
  applyCalibrationLanguage();

  if (loadActionText) {
    loadSavedActionTextConfig();
  } else {
    applyActionConfigLanguage();
  }

  renderActionSettings();
  updateActionGuide();
  renderFaceQuality();
  updateRecordingUI();
  updateCalibrationUI();
  renderSecondarySelection();
  pauseRecognitionButton.querySelector("span").textContent = isPausedStateActive()
    ? localizeRuntimeText("继续")
    : t("pauseRecognition");
}

function switchLanguage(nextLanguage) {
  if (!SUPPORTED_LANGUAGES.includes(nextLanguage) || nextLanguage === currentLanguage) {
    return;
  }

  saveActionTextConfig({ silent: true });
  currentLanguage = nextLanguage;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  } catch {
    // Language still changes for the current session.
  }
  applyLanguage();
  setCommunicationMessage(t("waitingInput"), "--");
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

languageToggleButton?.addEventListener("click", () => {
  switchLanguage(currentLanguage === "zh" ? "en" : "zh");
});

faceQualityGateToggle?.addEventListener("change", () => {
  const message = faceQualityGateToggle.checked ? "人脸质量门控已开启" : "人脸质量门控已关闭";
  addLog(message);
  if (!faceQualityGateToggle.checked) {
    lastGesture.textContent = localizeRuntimeText(message);
  }
});

roiPreviewToggle?.addEventListener("change", () => {
  addLog(roiPreviewToggle.checked ? "人脸近景框已开启" : "人脸近景框已关闭");
  if (!roiPreviewToggle.checked) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
});

repeatSpeechButton.addEventListener("click", () => {
  const phrase = state.lastPhrase && state.lastPhrase !== t("waitingInput") ? state.lastPhrase : t("speechTestPhrase");
  speak(phrase);
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
  cancelSpeech({ markIdle: true });
  clearQuietMode();
  clearTransientCooldowns();
  clearBlinkCodeBuffer();
  clearRecentlyConsumedBlinkCode();
  clearPendingConfirmation();
  clearSecondarySelection();
  resetGestureSequences();
  setCommunicationMessage("等待输入", "--");
});

blinkCodeToggle.addEventListener("change", () => {
  forceBlinkCodeEnabled();
  clearBlinkCodeBuffer();
  clearSecondarySelection();
  updateActionGuide();
});

[browToggle, mouthToggle, smileToggle, headShakeToggle].forEach((toggle) => {
  toggle.addEventListener("change", () => {
    clearSecondarySelection();
    resetOptionalGestureState();
    saveInputChannelConfig({ silent: true });
    updateActionGuide();
  });
});

inputManagementButton?.addEventListener("click", startInputManagementSelection);

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

warmSpeechVoices();
loadSavedInputChannelConfig();
applyLanguage();

if (!loadSavedCalibrationProfile()) {
  updateCalibrationUI();
  showIosCalibrationGateHint();
}

refreshCameraList().catch(() => {
  const option = document.createElement("option");
  option.textContent = currentLanguage === "en" ? "Waiting for permission" : "等待权限";
  option.value = "";
  cameraSelect.append(option);
});
