## YOLO 非官方语音版

这是来自 `concentrate1/obsidian-yolo@yolo-unofficial-dev` 的非官方构建，不是上游 `Lapis0x0/obsidian-yolo` 的官方发布。

使用前请备份 vault、插件设置和重要数据。本构建按现状提供；因使用本语音版导致的数据丢失、数据损坏或配置异常，维护者不承担责任。

本构建仍处于测试状态，不建议用于重要 vault。请优先在测试 vault 或可随时恢复的 vault 中试用。

### 本次更新：1.5.12-voice.1

- 同步上游 YOLO 1.5.12 主线更新。
- 统一 ASR、TTS 与普通 LLM 的请求传输路径，桌面端继续复用代理和调试捕获，移动端使用浏览器请求路径。
- 修复移动端 TTS 在默认请求方式下可能无法朗读的问题。
- 修复朗读完成后状态显示不完整、生成音频拖拽入口丢失的问题。
- 优化音频文件转写的 WebSocket 限速判断、上传进度和本地重采样质量。
- 减少语音拖拽识别、分贝表刷新和前缀缓存删除时的额外主线程开销。

### 安装提醒

- 这是 YOLO 的变体。同一个 vault 中只能在上游 YOLO 和本语音版之间二选一，不要同时安装或启用。
- 手动安装方式见 README 和语音配置指南。

### 本版范围

- 新增编辑器上下文感知语音输入。
- 支持录音、ASR、LLM 打磨、灰字预览、Tab 接受和 Esc 取消。
- 支持通过 HTTP 短音频、HTTP 长音频和 WebSocket ASR 路线进行音频文件转写。
- 支持通过已配置的 TTS 提供商朗读文本。
- 使用 `yolo-unofficial-dev` 语音更新通道。

### 链接

- 配置指南：https://github.com/concentrate1/obsidian-yolo/blob/yolo-unofficial-dev/docs/tutorials/voice/voice-configuration.md
- 技术说明：https://github.com/concentrate1/obsidian-yolo/blob/yolo-unofficial-dev/docs/technical/voice-implementation.md
- 语音发布分支：https://github.com/concentrate1/obsidian-yolo/tree/yolo-unofficial-dev
