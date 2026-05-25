# Mac Developer ID 签名和 Apple 公证

目标：生成可以给其他家庭或同事直接安装的 macOS DMG，避免 Gatekeeper 把未签名应用提示为“已损坏，无法打开”。

## 当前分工

本项目保留两条打包路径：

```bash
npm run dist:mac
```

用于内部测试包，保持当前稳定逻辑，仍然跳过 Developer ID 签名。

```bash
npm run dist:mac:signed
```

用于正式分发包，会要求本机存在 Developer ID Application 证书，并要求可用的 Apple 公证凭据。

## 前置条件

需要：

- Apple Developer Program 账号。
- Keychain 中安装 `Developer ID Application` 证书。
- Apple 公证凭据，任选一种：
  - `APPLE_ID` + `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_TEAM_ID`
  - `APPLE_API_KEY` + `APPLE_API_KEY_ID` + `APPLE_API_ISSUER`
  - `APPLE_KEYCHAIN` + `APPLE_KEYCHAIN_PROFILE`

不要把 Apple ID、App 专用密码、API key 或证书密码写进仓库。

## 检查本机是否准备好

```bash
npm run mac:signing:check
```

当前这台 Mac 如果显示：

```text
Developer ID Application identities: 0
```

说明还没有安装 Developer ID 证书，无法生成正式分发包。

## Apple ID + App 专用密码方式

示例：

```bash
export APPLE_ID="你的 Apple ID 邮箱"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="你的 Team ID"
npm run mac:signing:check
npm run dist:mac:signed
```

如果 Keychain 里只有一个 Developer ID Application 证书，脚本会自动选择它。

如果有多个证书，可以显式指定：

```bash
export MAC_SIGNING_IDENTITY="Developer ID Application: Your Name or Company (TEAMID)"
npm run dist:mac:signed
```

## 生成后验证

假设应用路径为：

```bash
release/mac-arm64/ALS 面部微动作 AAC.app
```

DMG 路径为：

```bash
release/ALS 面部微动作 AAC-0.3.0-arm64.dmg
```

验证签名：

```bash
codesign --verify --deep --strict --verbose=2 "release/mac-arm64/ALS 面部微动作 AAC.app"
spctl --assess --type execute -vv "release/mac-arm64/ALS 面部微动作 AAC.app"
```

验证公证票据：

```bash
xcrun stapler validate "release/ALS 面部微动作 AAC-0.3.0-arm64.dmg"
spctl --assess --type open --context context:primary-signature -vv "release/ALS 面部微动作 AAC-0.3.0-arm64.dmg"
```

验证隐私权限说明：

```bash
plutil -p "release/mac-arm64/ALS 面部微动作 AAC.app/Contents/Info.plist" | rg "NS(Camera|Microphone|Audio|Bluetooth).*UsageDescription"
```

期望只看到摄像头权限说明。

## 参考

- Apple Developer: [Signing Mac Software with Developer ID](https://help.apple.com/xcode/mac/current/en.lproj/dev033e997ca.html)
- Apple Developer: [Notarizing macOS software before distribution](https://help.apple.com/xcode/mac/current/en.lproj/dev88332a81e.html)
- electron-builder: [macOS code signing and notarization](https://www.electron.build/code-signing-mac)
