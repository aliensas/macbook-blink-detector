# iOS App 工作区

这里是 iOS 应用代码的独立路径。

当前还没有生成 Xcode 工程。下一步建议先做一个最小可运行版本：

1. 复用现有 Web 逻辑，建立 iOS 专用入口。
2. 调整 iPhone 竖屏 / 横屏布局。
3. 在 iPhone Safari 中验证摄像头、MediaPipe、TTS 和本地存储。
4. 再决定用 Capacitor 生成 Xcode 工程，或继续保留为 iOS PWA / 网页应用。

原则：不要把 iOS 适配代码混入 Mac 版主入口，除非确认它是两端都需要的通用逻辑。

