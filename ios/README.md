# ALS 面部微动作 AAC 输入原型 - iOS 分支

这个目录只用于 iPhone / iOS 版本。Mac 本地版仍保留在项目根目录，不在这里直接修改。

## 目录约定

```text
ios/
  app/        iOS 应用代码工作区。后续可放 Capacitor / Xcode / iOS WebView 工程。
docs/ios/     iOS 版本设计、测试和发布说明。
```

## 当前目标

把已在 Mac 本地验证的面部微动作 AAC 输入逻辑，迁移成可在 iPhone 上使用的应用原型。

第一阶段不追求上架 App Store，优先目标是：

- iPhone 本机摄像头可用。
- 人脸关键点、眨眼、抬眉、张嘴、微笑、摇头逻辑可运行。
- 输入管理、高级设置、二级选择等已验证功能可迁移。
- 支持竖屏和横屏。
- 所有模型和核心资源尽量本地化，减少网络依赖。
- 不影响 Mac 版现有代码和发布流程。

## 技术方向

优先考虑“Web 检测核心 + iOS 外壳”的路线：

```text
现有 Web 检测逻辑
        ↓
iOS 专用移动端布局
        ↓
Capacitor / WKWebView / Xcode 打包
        ↓
iPhone 真机测试
```

如果 WebView 中摄像头、TTS 或性能不足，再评估更深的原生 iOS 实现。

