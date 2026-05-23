# 面部动作参数说明

本文件说明 `src/shared/gesture-params.js` 中的可调动作参数。当前阶段只把参数集中管理，不改变动作触发逻辑。

## 参数位置

```text
src/shared/gesture-params.js
```

`src/main.js` 仍负责检测流程、状态机、二级菜单、输入管理和播报。`gesture-params.js` 只保存数值参数。

## 已集中管理的参数

### `GESTURE_DETECTOR_PARAMS`

用于抬眉、二级菜单抬眉、张嘴、微笑这些保持型动作。

- `threshold`：信号达到多少开始认为动作出现。
- `peakThreshold`：动作过程中的峰值至少达到多少，防止轻微抖动触发。
- `minHoldMs`：动作必须持续多久才算有效。
- `releaseMinMs`：动作回落后需要稳定多久，才确认动作结束。
- `cooldownMs`：同一动作触发后的冷却时间。

### `MOUTH_SEQUENCE_PARAMS`

用于张嘴两次和张嘴相关的误触抑制。

- `doubleWindowMs`：两次张嘴必须在这个时间内完成。
- `browSuppressThreshold`：张嘴明显时暂停抬眉判断。
- `smileSuppressThreshold`：张嘴明显时暂停微笑判断。

### `SMILE_SEQUENCE_PARAMS`

用于微笑一次、微笑两次和微笑宽度判断。

- `mouthSuppressThreshold`：嘴部张开时暂停微笑判断。
- `doubleWindowMs`：第一次微笑后等待第二次微笑的时间。
- `doubleMinGapMs`：两次微笑之间必须至少间隔多久。
- `widthDeltaScale`：嘴部横向变宽对微笑分数的贡献比例。

### `HEAD_SHAKE_PARAMS`

用于摇头检测。

- `yawThreshold`：左右方向变化阈值。
- `idleResetMs`：长时间没有有效方向变化后重置。
- `requiredDirectionChanges`：触发摇头所需的方向变化次数。
- `windowMs`：摇头必须在这个时间窗口内完成。
- `cooldownMs`：摇头触发后的冷却时间。

### `BROW_HEAD_MOTION_GUARD`

用于“上下点头时暂停抬眉判断”。

- `pitchDelta`：相对基线的上下头动阈值。
- `pitchJump`：相邻帧上下头动跳变阈值。
- `centerJump`：脸部中心上下位移阈值。
- `settleMs`：检测到头动后暂停抬眉判断多久。

### `SMILE_HEAD_MOTION_GUARD`

用于“摇头时暂停微笑判断”。

- `settleMs`：检测到左右头动后暂停微笑判断多久。

### `FACE_SCALE_STABILITY`

用于摄像画面尺度突变保护。

- `relativeJump`：脸部尺度相对变化阈值。
- `absoluteJump`：脸部尺度绝对变化阈值。
- `settleMs`：检测到尺度突变后等待画面稳定多久。

## 调参原则

- 误触多时，优先增加 `minHoldMs` 或 `releaseMinMs`。
- 动作必须做得太累时，优先降低 `threshold` 或 `peakThreshold`。
- 涉及吸痰、紧急求助等护理高敏感动作时，宁可漏触发，也不要放宽到容易误触。
- 不要为了调参数去改 `detectLoop()`、`processFaceSignals()` 或状态机流程。
- 修改参数后，必须按 `docs/runtime-regression-notes.md` 做摄像头启动回归检查。
