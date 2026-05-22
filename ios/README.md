# iOS 工作区

这个目录用于 iPhone / iOS 版本，不直接承载 Mac 桌面版入口。

当前原则：

- Mac 版继续在项目根目录开发和测试。
- iOS 版在本目录下逐步建立移动端入口、打包说明和真机测试资料。
- 共享动作逻辑应先抽象清楚，再被 Mac 和 iOS 同时使用。
- 平台相关代码，如 iPhone 布局、iOS 摄像头权限、PWA 或 Xcode 打包，放在 `ios/` 路径中。

当前阶段还没有生成 Xcode 工程。优先目标是让 iPhone Safari / PWA 跑通当前 Mac 稳定版的核心闭环。

## 当前入口

开发模式下访问：

```text
http://127.0.0.1:5173/ios/
```

该入口会进入同一套 Web 应用，并开启 `platform=ios` 布局模式。这样可以先验证 iPhone Safari / PWA，而不复制一份独立旧页面。
