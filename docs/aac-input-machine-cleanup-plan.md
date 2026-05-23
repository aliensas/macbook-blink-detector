# AAC 输入内核迁移与旧逻辑清理清单

本文只记录工程清理计划。目标不是增加功能，而是避免 `src/main.js` 长期保留两套动作解释逻辑。

## 当前状态

- `src/shared/aac-input-machine.js` 已建立纯动作输入内核。
- `tests/aac-input-machine.test.js` 已覆盖核心短码、菜单、确认、冷却、安静模式、质量门控和可选动作组合规则。
- `src/main.js` 当前只把“眨眼短码最终解释”接入新内核。
- 摄像头启动、EAR 眨眼识别、TTS、ROI 预览、抬眉/张嘴/微笑/摇头检测器尚未迁移。

## 已被新内核接管的规则

这些规则已经可以由 `aac-input-machine` 决定：

- `..`：帮助。
- `...`：紧急求助。
- `.-`：进入挠痒痒二级菜单。
- `-.`：进入体位调整二级菜单。
- `--.`：进入输入管理。
- `.` / `-` / `--`：忽略。
- 菜单或确认窗口中的 `..` 必须等待是否出现第三次短眨。
- 冷却期只允许新的严格三短眨 SOS。

## 暂时必须保留的旧代码

这些代码现在仍然是稳定版运行所必需，暂时不能删：

- EAR 到短眨/长闭眼的识别：
  - `handleBlinkReleased`
  - `enqueueBlinkSymbol`
  - `getBlinkDecodeDelay`
  - `resetBlinkCodeBufferIfSequenceIsStale`
  - `clearBlinkCodeBuffer`
- 现有 UI / TTS 执行函数：
  - `executeConfiguredAction`
  - `executeBlinkEmergencyCode`
  - `startSecondarySelection`
  - `selectSecondarySelection`
  - `startInputManagementSelection`
  - `announce`
  - `speak`
- 二级菜单显示和轮询：
  - `renderSecondarySelection`
  - `scheduleSecondarySelectionScan`
  - `advanceSecondarySelection`
  - `clearSecondarySelection`
- 长闭眼控制：
  - `handleLongCloseControl`
  - `returnToWaitingInputFromLongClose`
  - `enterQuietModeFromLongClose`
  - `handleQuietModeBlinkCandidate`

## 下一步优先清理的旧逻辑

这些旧逻辑与新内核职责重叠，后续应逐块删除或改成薄适配器：

1. `resolveSecondarySelectionBlinkCode`
   - 旧职责：在二级菜单 / 输入管理中解释短码。
   - 新职责应由 `aac-input-machine` 决定。
   - 保留条件：现阶段仍作为 UI 执行 fallback 使用。
   - 删除时机：确认二级菜单和输入管理短码接入稳定后。

2. `resolvePendingConfirmation`
   - 旧职责：确认窗口中解释 `..`。
   - 新职责应由 `aac-input-machine` 决定。
   - 保留条件：现阶段仍负责执行原确认 UI 和播报。
   - 删除时机：确认窗口整体接入新内核后。

3. `lockSecondarySelectionForBlink`
   - 旧职责：第一次短眨锁定菜单项。
   - 新职责已在 `aac-input-machine` 中建模。
   - 保留条件：当前 UI 仍依赖旧锁定状态显示。
   - 删除时机：菜单锁定状态由新内核统一驱动后。

4. `shouldSuppressRecentlyConsumedBlinkCode` / `rememberConsumedBlinkCode`
   - 旧职责：防止已被菜单消费的短码重复触发。
   - 新职责应由输入回合结束和冷却状态承担。
   - 删除时机：所有菜单/确认短码消费改由新内核统一返回命令后。

5. `getBlinkDecodeDelay` 中的短码语义判断
   - 旧职责：根据短码前缀决定等待多久。
   - 新职责应由 `aac-input-machine` 统一决定。
   - 保留条件：当前 `main.js` 仍用它驱动浏览器定时器。
   - 删除时机：眨眼事件直接流入新内核，不再先积累旧 `blinkCodeBuffer` 后。

## 暂不迁移的范围

以下内容先不动：

- 摄像头启动与停止。
- MediaPipe `detectLoop`。
- EAR 阈值和闭眼时长计算。
- TTS 声音选择和播报。
- ROI 预览。
- CSS 布局。
- 抬眉、张嘴、微笑、摇头检测器。

## 建议迁移顺序

1. 已完成：建立纯输入内核和模拟测试。
2. 已完成：眨眼短码最终解释接入新内核。
3. 下一步：把二级菜单 / 输入管理中的短码消费完全交给新内核，然后删除 `resolveSecondarySelectionBlinkCode` 的旧解释分支。
4. 再下一步：把确认窗口短码消费交给新内核，然后删除 `resolvePendingConfirmation` 的旧解释分支。
5. 再下一步：把浏览器定时器层逐步改成“事件直接送入新内核”，减少旧 `blinkCodeBuffer` 责任。
6. 最后：迁移抬眉、张嘴、微笑、摇头事件解释。

## 每一步必须通过的检查

```text
npm run test:logic
npm run build
node --check src/main.js
node --check src/shared/aac-input-machine.js
git diff --check
```

浏览器手测：

- 页面能打开。
- 摄像头启动后稳定检测 5-10 秒。
- `..`、`...`、`.-`、`-.`、`--.` 正常。
- 单次短眨和单次长闭眼不触发。
- TTS 仍有声音，且中文声音未被更改。

## 清理原则

- 不长期保留双轨。
- 每迁移一块，就删除或压薄对应旧逻辑。
- 不因为调参数去改检测循环。
- 不把实验性 ROI 输入重新放回稳定路径。
- 不再在 TTS 上加诊断或选声逻辑，除非用户明确要求。
