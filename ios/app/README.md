# iOS App 工作区

这里预留给后续 iPhone App 原型。

实施顺序：

1. 先完成 iPhone Safari / PWA 真机验证。
2. 如果 Web 运行速度、摄像头、TTS 和本地存储都可接受，再引入 Capacitor / WKWebView / Xcode。
3. 如果 WebView 无法满足性能或权限要求，再评估原生 iOS 面部检测方案。

不要在这里复制一份旧版前端长期维护。iOS App 应复用已验证的共享动作逻辑，只在界面和平台能力上单独适配。
