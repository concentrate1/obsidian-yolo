## YOLO 非官方语音版

这是来自 `concentrate1/obsidian-yolo@yolo-unofficial-dev` 的非官方构建，不是上游 `Lapis0x0/obsidian-yolo` 的官方发布。

使用前请备份 vault、插件设置和重要数据。本构建按现状提供；因使用本语音版导致的数据丢失、数据损坏或配置异常，维护者不承担责任。

本构建仍处于测试状态，不建议用于重要 vault。请优先在测试 vault 或可随时恢复的 vault 中试用。

### 本次更新：1.6.1.3-voice.1

- 同步上游 YOLO `1.6.1.3` 与 Learning `0.1.2`，带来模块化 Learning、模块热切换和统一的 Core / 模块更新体验。
- 配置导入导出现在统一覆盖已注册的功能数据，并补齐语音设置分类；导出时会脱敏语音 ASR 的 `apiKey` 与 `apiSecret`。
- 语音生成文件和缓存路径现在会跟随 YOLO 根目录；迁移根目录时会等待正在进行的语音写入，并只重定位由插件管理的旧路径。
- 修复导入配置时把已有 YOLO 根目录误判为迁移冲突，以及编辑较长 AI 回复时下方出现大块空白的问题。
- 更新下载和后台状态处理更加稳定；语音版 Core 继续只跟随 fork 的 `yolo-unofficial-dev` 通道，官方模块继续使用签名分发信息，不会把语音版 Core 更新为上游官方版。
- 最低 Obsidian 版本调整为 `1.8.7`。

### 安装提醒

- 这是 YOLO 的变体。同一个 vault 中只能在上游 YOLO 和本语音版之间二选一，不要同时安装或启用。
- 在官方版与语音版之间切换前，请单独备份 `.obsidian/plugins/yolo/data.json`。切换后保存设置可能移除另一版本无法识别的专属字段，尤其是语音配置。
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
