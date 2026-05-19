import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { createIcons, Camera, Copy, Play, RotateCcw, Square } from "lucide";
import "./styles.css";

createIcons({ icons: { Camera, Copy, Play, RotateCcw, Square } });

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
  fpsSamples: [],
  lastFrameAt: 0,
  cameraLabelsReady: false,
};

function setStatus(label, mode = "idle") {
  runtimeStatus.innerHTML = `<span class="dot dot-${mode}"></span><span>${label}</span>`;
}

function addLog(message) {
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
}

function resetLiveMetrics(status = "未检测") {
  blinkState.textContent = status;
  earValue.textContent = "--";
  fpsValue.textContent = "--";
  confidenceLabel.textContent = "--";
  earBar.style.width = "0%";
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
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
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
    resetLiveMetrics("检测中");
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
      updateFps();
      drawOverlay(result.faceLandmarks?.[0]);
      updateBlinkState(result.faceLandmarks?.[0]);
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

function updateBlinkState(landmarks) {
  if (!landmarks) {
    blinkState.textContent = "未见人脸";
    earValue.textContent = "--";
    confidenceLabel.textContent = "--";
    earBar.style.width = "0%";
    resetDetectionWindow();
    return;
  }

  const threshold = Number(thresholdRange.value);
  const holdFrames = Number(holdFramesRange.value);
  const ear = averageEyeAspectRatio(landmarks);

  if (ear === null) {
    blinkState.textContent = "关键点不足";
    earValue.textContent = "--";
    confidenceLabel.textContent = "--";
    earBar.style.width = "0%";
    resetDetectionWindow();
    return;
  }

  const isClosed = ear < threshold;
  const openness = Math.min(Math.max((ear - 0.12) / 0.24, 0), 1);

  earValue.textContent = ear.toFixed(3);
  earBar.style.width = `${Math.round(openness * 100)}%`;
  confidenceLabel.textContent = isClosed ? "闭合" : "睁开";

  if (isClosed) {
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
    state.closedFrames = 0;
    addLog(`眨眼 +1（EAR ${ear.toFixed(3)}）`);
    return;
  }

  if (!isClosed && state.blinkArmed) {
    blinkState.textContent = "睁眼";
    state.closedFrames = 0;
  }
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

  const drawEye = (indices, color) => {
    if (!hasLandmarkIndices(landmarks, indices)) {
      return;
    }

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
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
    indices.forEach((index) => drawPoint(landmarks[index], color, 3));
  };

  drawEye(LEFT_EYE, "#2dd4bf");
  drawEye(RIGHT_EYE, "#38bdf8");
  [...LEFT_IRIS, ...RIGHT_IRIS].forEach((index) => {
    if (landmarks[index]) {
      drawPoint(landmarks[index], "#f8fafc", 2);
    }
  });
}

function resetCounters() {
  state.blinkTotal = 0;
  resetDetectionWindow();
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

window.addEventListener("resize", resizeCanvas);

enumerateCameras().catch(() => {
  const option = document.createElement("option");
  option.textContent = "等待权限";
  option.value = "";
  cameraSelect.append(option);
});
