# iPhone 版本说明

当前 iPhone 版本采用 PWA 方式：用 Safari 打开 HTTPS 地址，然后添加到主屏幕。这样不需要 App Store、Apple Developer 证书或 TestFlight，适合先给患者和照护者快速试用。

## 部署

开发者运行：

```bash
npm install
npm run build
```

把 `dist/` 目录部署到一个 HTTPS 网站。iPhone Safari 访问摄像头必须使用 HTTPS；普通 `http://` 地址不能稳定使用摄像头。

本次构建已经产出可上传的部署包：

```text
release/ALS 面部微动作 AAC-0.2.1-iphone-pwa.zip
```

把这个压缩包解压后的内容部署到 HTTPS 站点即可。当前资源路径已改为相对路径，支持部署到站点根目录，也支持 GitHub Pages 这类 `/仓库名/` 子路径。

可选部署方式：

- Vercel
- Netlify
- GitHub Pages
- 自有 HTTPS 服务器

GitHub Pages 地址通常类似：

```text
https://aliensas.github.io/macbook-blink-detector/
```

## iPhone 使用步骤

1. 用 iPhone Safari 打开部署后的 HTTPS 地址。
2. 点击 Safari 分享按钮。
3. 选择“添加到主屏幕”。
4. 从主屏幕打开“ALS AAC”。
5. 点击“启动”，允许摄像头权限。
6. 完成一次患者校准和“完成确认”。
7. 同一患者后续再次打开，会自动沿用本机校准档案。

## 已适配内容

- iOS 主屏幕应用模式。
- Apple touch icon。
- Web App Manifest。
- 安全区适配，避开刘海和底部 Home Indicator。
- 手机竖屏布局压缩。
- 前置摄像头优先。
- MediaPipe 模型和 wasm 离线缓存。
- 同一患者本地校准档案自动沿用。

## 限制和风险

- iPhone 版本必须通过 HTTPS 使用摄像头。
- 校准档案只保存在当前 iPhone 的 Safari/PWA 本地存储中，不会同步到其他设备。
- iOS 可能在系统更新、清理网站数据、长时间不用后清除本地缓存；此时需要重新校准。
- 语音播报依赖 iOS 的系统语音能力，首次播报可能需要用户交互后才会发声。
- PWA 不是 App Store 原生应用；如需 App Store/TestFlight，需要后续用 Capacitor 或原生 iOS 工程封装并签名。

## 真机测试清单

- Safari 能打开 HTTPS 地址。
- 添加到主屏幕后能全屏打开。
- 首次启动能请求摄像头权限。
- 前置摄像头画面正常。
- 面部描边稳定显示。
- 眼睛开合条随睁眼/闭眼变化。
- 完成一次核心校准后点击“完成确认”；短码测试可作为额外验证。
- 关闭并重新打开主屏幕应用后，校准状态仍为“已确认”。
- 点“重置”后会清除本机校准档案。
- 两短眨、三短眨、两长闭眼在患者可控范围内工作。
