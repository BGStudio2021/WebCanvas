# WebCanvas
一款基于 Canvas、Flask 和 WebSocket 的画板，可用于板书、绘画等，可在局域网内同步画面。
## 主要功能
- [x] 调整画笔颜色、大小和透明度
- [x] 彩虹画笔模式，颜色不断变化
- [x] 可启用/禁用的笔锋
- [x] 更改背景颜色
- [x] 多页面机制，支持快捷跳转
- [x] 保存绘制的图片到本地
- [x] 导入图片到画布
- [x] 局域网内多设备同步画面
- [x] 保留历史记录，内容不丢失
## 配置文件
配置文件为程序目录下的`config.ini`，内容如下：
项目 | 说明
---- | ----
| `[server] port` | 服务器端口号 |
| `[canvas] width` | 画布宽度 |
| `[canvas] height` | 画布高度 |
## 从历史记录恢复
每次运行 WebCanvas 时，程序目录的`data`文件夹中会多出一个`canvasData_xxxxxxxx_xxxxxx.txt`文件，作为历史记录存档。
<br>若要从某个历史记录继续绘制，请在运行参数中包含存档文件名，例如：
```
.\WebCanvas.exe .\data\canvasData_20250403_214022.txt
```
从历史记录存档恢复时，程序不会生成新的历史记录，此时所有的修改都将在原存档上进行。
