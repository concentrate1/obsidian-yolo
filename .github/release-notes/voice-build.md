## YOLO 非官方语音版

这是来自 `concentrate1/obsidian-yolo@yolo-unofficial-dev` 的非官方构建，不是上游 `Lapis0x0/obsidian-yolo` 的官方发布。

使用前请备份 vault、插件设置和重要数据。本构建按现状提供；因使用本语音版导致的数据丢失、数据损坏或配置异常，维护者不承担责任。

本构建仍处于测试状态，不建议用于重要 vault。请优先在测试 vault 或可随时恢复的 vault 中试用。

### 本次更新：1.6.7-voice.1

- 基线升级至上游 YOLO 1.6.7，同步其稳定性修复、聊天交互和模块能力更新。
- 知识库升级为 IndexedDB 多知识库架构，支持本地 Embedding 模型、独立管理多个知识库和相似笔记；升级后请按需重新建立知识库索引。
- CLI 对话扩展到 Claude Code、Codex、Hermes 和 Pi，并同步 Claude OAuth、工具能力管理、会话持久化与流式显示改进。
- 语音浮岛、上下文感知输入、音频文件转写和语音朗读已适配新的设置迁移、知识库、运行时组件和 YOLO 根目录生命周期，并继续使用独立的语音更新通道。

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
