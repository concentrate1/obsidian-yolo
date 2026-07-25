## YOLO 非官方语音版

这是来自 `concentrate1/obsidian-yolo@yolo-unofficial-dev` 的非官方构建，不是上游 `Lapis0x0/obsidian-yolo` 的官方发布。

使用前请备份 vault、插件设置和重要数据。本构建按现状提供；因使用本语音版导致的数据丢失、数据损坏或配置异常，维护者不承担责任。

本构建仍处于测试状态，不建议用于重要 vault。请优先在测试 vault 或可随时恢复的 vault 中试用。

### 本次更新：1.6.1.3-voice.2

- 修复连续语音输入时，后续识别片段可能覆盖尚未确认的上一轮打磨预览，导致已经口述的内容丢失的问题。
- 普通续写现在会完整保留累计预览；尾部重复仍会自动去重，明确重说、纠正、取消和填充音继续按原意处理。
- 提升英文等场景中语音片段前导标点的保留稳定性。

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
