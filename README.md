# Open Bike Computer

一个面向 Android 和 iOS 的开源骑行码表 App。项目使用 React Native + Expo Development Build，共享一套 TypeScript 业务逻辑，同时通过原生模块获得后台定位、BLE 传感器、常亮屏幕和系统文件分享能力。

> 当前是可实机验证的 MVP，尚未发布到应用商店。

## 已实现

- Android / iOS 原生应用工程配置
- 前台与后台高精度 GPS 骑行记录
- 实时速度、均速、最高速度、距离、时间和累计爬升
- GPS 精度过滤、异常跳点过滤与速度平滑
- 实时轨迹绘制
- 暂停、继续和系统后台骑行通知
- 本机骑行历史存储
- GPX 文件生成与系统分享
- 标准 BLE 心率服务（HRS）
- 标准 BLE 速度/踏频服务（CSC）
- 骑行期间屏幕常亮
- 无账号、无服务器、默认不上传数据

## 技术栈

- React Native 0.86 + Expo SDK 57
- Expo Development Build / Continuous Native Generation
- `expo-location` + `expo-task-manager`：前后台定位
- React Native BLE PLX：Android/iOS 原生 BLE
- AsyncStorage：本机骑行记录
- React Native SVG：本地实时轨迹
- Vitest：纯领域逻辑测试

## 开发环境

需要 Node.js 22.13+ 或 Node.js 24、npm，以及目标平台工具链：

- Android：Android Studio、Android SDK、JDK 17
- iOS：macOS、Xcode 16.1+、CocoaPods

安装依赖：

```bash
npm install
```

BLE 和后台定位包含原生代码，因此不能使用 Expo Go，必须生成 Development Build：

```bash
npm run prebuild
npm run android
# iOS 需在 macOS 执行
npm run ios
```

启动 Metro：

```bash
npm start
```

## 验证

```bash
npm test
npm run typecheck
npm run export:android
npm run export:ios
```

CI 会在 Linux 上验证测试、类型检查和 Android/iOS JavaScript Bundle。完整 Android 原生构建需要 Android SDK；完整 iOS 编译和签名必须在 macOS/Xcode 或 EAS Build 中完成。

## EAS 云构建

首次使用时先登录并绑定你自己的 Expo 项目：

```bash
npx eas-cli login
npx eas-cli init
```

Android 内测构建会输出可直接安装的 APK：

```bash
npx eas-cli build --profile preview --platform android
```

iOS 真机内测需要 Apple Developer 账号、签名凭据以及已登记的测试设备：

```bash
npx eas-cli device:create
npx eas-cli build --profile preview --platform ios
```

若只需要在 macOS 的 iOS Simulator 中验证，可以使用无需苹果签名的模拟器构建：

```bash
npx eas-cli build --profile simulator --platform ios
```

`eas.json` 提供 development、preview、simulator 和 production 四种配置。仓库不会提交签名证书或商店凭据。

## 平台权限说明

- Android 后台持续记录使用前台定位服务，并显示不可隐藏的骑行通知。
- iOS 需要用户授予“始终允许”定位；后台运行仍受系统策略约束。
- BLE 需要蓝牙/附近设备权限；传感器必须支持标准 HRS 或 CSC GATT 服务。
- 骑行数据和后台定位缓冲均只保存在本机，导出由用户主动触发。

## 路线图

- 功率计（Cycling Power Service）
- 轮径与自动暂停阈值设置
- FIT 导出
- GPX 路书导入和转向导航
- 后视雷达
- 崩溃恢复与超长骑行数据库
- Android/iOS 商店发布准备

## License

[MIT](LICENSE)
