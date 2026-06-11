## YOLO 非官方语音版

这是来自 `concentrate1/obsidian-yolo@yolo-unofficial-dev` 的非官方构建，不是上游 `Lapis0x0/obsidian-yolo` 的官方发布。

使用前请备份 vault、插件设置和重要数据。本构建按现状提供；因使用本语音版导致的数据丢失、数据损坏或配置异常，维护者不承担责任。

本构建仍处于测试状态，不建议用于重要 vault。请优先在测试 vault 或可随时恢复的 vault 中试用。

### 本次更新：1.5.12-voice.2

- 同步语音功能分支的最新进展，接入 MiMo ASR、火山 / 豆包极速版 ASR 和火山 / 豆包 TTS。
- 上下文感知语音输入的 ASR 下拉现在也可选择已实现的 HTTP 长音频提供商，普通口述会按当前录音段整段提交。
- 音频文件转写新增火山 / 豆包极速版长音频路线，支持通过新控制台 API Key 和 `volc.bigasr.auc_turbo` 资源 ID 配置。
- Chat Audio ASR 文档新增小米 MiMo-V2.5-ASR 配置说明。
- TTS 文档新增火山 / 豆包大模型 TTS 配置说明。
- 补充并修正语音配置教程总目录、HTTP 短音频、HTTP 长音频和 TTS 分页说明。

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
