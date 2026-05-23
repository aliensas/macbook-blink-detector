# 运行时回归记录

本文件记录已经真实发生过、会破坏基础使用链路的错误。后续修改相关代码时，必须先查本文件，再做测试。

## 2026-05-23：检测循环因未定义变量中断

### 现象

- 点击“启动”后，前端显示“请求权限”。
- 摄像头画面短暂闪出约 0.1 秒。
- 画面随后变黑。
- 系统显示“检测失败”。
- Chrome 控制台反复报错：

```text
ReferenceError: pitchDelta is not defined
at isHeadMotionSuppressingBrow
at processFaceSignals
at detectLoop
```

### 原因

修改“上下点头时暂停抬眉判断”逻辑时，删除了 `pitchDelta` 的定义：

```js
const pitchDelta = Math.abs(detectionSignals.headPitchDelta || 0);
```

但 `isHeadMotionSuppressingBrow()` 里仍然继续使用 `pitchDelta`。`node --check` 只能检查语法，不能发现这种运行时未定义变量。代码构建通过并不代表检测循环安全。

### 修复

在 `isHeadMotionSuppressingBrow()` 中恢复 `pitchDelta` 定义，并重新测试 Chrome 页面启动。

### 永久规则

- 修改 `detectLoop()`、`processFaceSignals()`、`isHeadMotionSuppressingBrow()`、`isHeadMotionSuppressingSmile()`、`updateSignalBaseline()` 时，不能只跑 `node --check` 和 `npm run build`。
- 必须在浏览器中真实点击“启动”，观察至少 5-10 秒。
- 必须确认状态保持“检测中”，摄像头画面不黑屏，EAR/FPS/人脸质量持续更新。
- 必须检查浏览器控制台没有新的 `ReferenceError`、`TypeError` 或“检测循环出现错误”。
- 不要删除一个中间变量后只看局部代码；必须用 `rg` 检查该变量是否仍被引用。

### 最小回归检查

```bash
node --check src/main.js
git diff --check
npm run build
rg -n "pitchDelta|isHeadMotionSuppressingBrow|detectLoop|processFaceSignals" src/main.js
```

然后在 Chrome 打开本地页面，点击“启动”，确认 5-10 秒内没有检测循环错误。

## 2026-05-23：实验性 ROI 输入导致 MediaPipe 时间戳错误

### 现象

- 打开“实验性 ROI 识别”后点击“启动”。
- 摄像头画面短暂闪出，随后黑屏。
- 系统显示“检测失败”。
- Chrome 控制台反复报错：

```text
Packet timestamp mismatch on a calculator receiving from stream "norm_rect"
Current minimum expected timestamp is ... but received ...
at detectFaceFrame
at detectLoop
```

### 原因

实验性 ROI 输入在原始 `video` 和隐藏 `canvas` 之间切换调用同一个 `FaceLandmarker.detectForVideo()`。传入的 `performance.now()` 小数时间在 MediaPipe 内部转换后可能出现非严格递增，导致计算图拒绝后续帧。这个错误会污染检测循环，连续重试后触发停止摄像头。

### 处理

当前已彻底移除实验性 ROI 输入，恢复为单一原始 `video` 输入路径。保留“人脸近景框”作为只读预览，不裁剪视频、不改变 Face Landmarker 输入、不参与动作触发。

### 永久规则

- 当前稳定版只允许一条检测输入路径：原始 `video`。
- 任何未来新增的 `detectForVideo()` 调用都必须使用统一的单调递增时间戳。
- 不允许在同一个检测帧里连续调用 ROI canvas 和原始 video 两次 `detectForVideo()`。
- 实验功能不能直接把异常抛到主检测循环导致摄像头停止；必须有自动降级回稳定路径的保护。
- ROI / canvas / 多输入源相关修改必须放在独立分支，且验证启动、停止、重启摄像头都不会黑屏后，才能讨论合并。
