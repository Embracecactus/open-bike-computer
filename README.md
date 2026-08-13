# Open Bike Computer

一个开放、隐私优先的手机骑行码表。无需账号或后端，打开网页即可用 GPS 记录骑行；在支持 Web Bluetooth 的设备上，还可以连接标准 BLE 心率和速度/踏频传感器。

## 已实现

- GPS 实时速度、平均/最高速度、里程、骑行/移动时间与累计爬升
- GPS 精度过滤、异常跳点过滤与速度平滑
- 实时离线轨迹视图
- 暂停、继续、结束与本地历史记录
- GPX 轨迹导出
- BLE Heart Rate Service 心率带支持
- BLE Cycling Speed and Cadence Service 速度/踏频支持
- 屏幕唤醒锁、离线应用壳与 PWA 安装
- GitHub Pages 自动部署工作流

所有骑行数据默认存储在浏览器 IndexedDB 中，不会上传服务器。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

生产构建与测试：

```bash
npm test
npm run build
```

## 手机实测

定位和 Web Bluetooth 都需要 HTTPS。部署到 GitHub Pages 后可直接测试：

1. 用手机浏览器打开 Pages 地址并允许精确定位。
2. 点击“开始骑行”。
3. Android Chrome 可以点击心率或踏频卡片连接标准 BLE 设备。
4. 通过浏览器菜单“添加到主屏幕”安装为 PWA。

Web Bluetooth 当前主要适用于 Android Chromium 浏览器；iOS 浏览器仍可使用完整 GPS 记录功能，但不能直接连接 BLE 骑行传感器。长期方案可以复用现有领域逻辑开发 Capacitor 或原生客户端。

## 技术结构

- React + TypeScript + Vite
- `RideEngine`：不依赖 UI 的骑行状态机与 GPS 统计
- IndexedDB：本地骑行记录
- Web Bluetooth：标准 HRS/CSC 传感器
- Service Worker：离线应用壳
- Vitest：距离、计时与 BLE 报文解析测试

## 路线图

- 功率计（Cycling Power Service）
- 轮径设置、自动暂停阈值与数据页面自定义
- GPX 路书导入和转向导航
- FIT 导出及 Strava/TrainingPeaks 同步
- 后视雷达和结构化训练

## License

[MIT](LICENSE)
