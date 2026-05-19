# MacBook Blink Detector

本地眨眼检测应用，优先使用 MacBook 内置摄像头。前端通过 MediaPipe Face Landmarker 获取眼部关键点，再用 EAR（Eye Aspect Ratio）判断闭眼和眨眼。

模型和 wasm 文件已放在 `public/mediapipe/`，运行时不需要再从 Google Storage 或 CDN 拉取核心检测资源。

## 运行

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址后，点击「启动」并允许摄像头权限。

如果在 Codex 的 in-app browser 里看到“摄像头权限被拒绝”，请用系统浏览器打开同一个地址：

```text
http://127.0.0.1:5173/
```

macOS 仍然拒绝时，检查「系统设置 > 隐私与安全性 > 相机」，给 Chrome、Safari 或当前浏览器开启权限。

## 调参

- 眨眼阈值：EAR 低于该值时判为闭眼。
- 闭眼帧数：连续低于阈值的最小帧数，用于减少误判。
- 摄像头：授权后会自动优先选择 MacBook/FaceTime/Built-in 标签的设备，也可以手动切换。
