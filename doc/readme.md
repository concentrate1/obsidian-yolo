<h1 align="center">YOLO 非官方语音版</h1>

<p align="center">
  给 Obsidian YOLO 增加上下文感知语音输入、音频文件转写和语音朗读。
</p>

<p align="center">
  <b>非官方构建</b> · <a href="./docs/tutorials/voice/voice-configuration.md">语音配置指南</a> · <a href="./docs/technical/voice-implementation.md">实现说明</a>
</p>

> [!WARNING]
> 这是非官方语音版 `concentrate1/obsidian-yolo@yolo-unofficial-dev` ，不是上游 `Lapis0x0/obsidian-yolo` 的官方发布。
>
> 本构建是个人维护的实验性版本,仍处于测试状态，不建议用于重要 vault。请优先在测试 vault 或可随时恢复的 vault 中试用。

> [!IMPORTANT]
> 这是 YOLO 的变体。同一个 vault 中只能在上游 YOLO 和本语音版之间二选一，不要同时安装或启用。两者并存可能导致插件文件、设置和更新通道互相覆盖。从上游 YOLO 切换到本语音版，应视为替换插件。

## 新增能力

### 上下文感知语音输入

在编辑器光标处录音，把音频交给 ASR，再让 LLM 结合附近上下文打磨成可直接落笔的文本。结果先以灰字预览，按 Tab 接受，按 Esc 取消。

可选能力包括点按 / 长按录音、接受后继续听写、VAD 自动切段、麦克风分贝计、提示词风格预设、自定义提示词，以及文档摘要 + 热词辅助纠错。打磨结果不会直接写入正文，确认前只显示为灰字草稿。

浮岛样式：
<img src="./docs/assets/voice/voice-input.gif" width="400">

支持边说边改（x2播放）：
<img src="./docs/assets/voice/voice-input-and-change.gif" width="600">

修改提示词后可以直接翻译（x2播放）：
<img src="./docs/assets/voice/voice-input-and-translate.gif" width="600">

### 音频文件转写

从语音浮岛拖入或选择已有音频文件，转写后插入当前笔记；如果当前编辑器不可用，则写入备用 Markdown 笔记。本构建支持 HTTP 短音频、HTTP 长音频文件和 WebSocket ASR 三条路线。

文件转写会先检查文件和当前 ASR 能力，再确认直传、切段、长音频上传或 WebSocket 流式方案。HTTP 短音频支持本地切段、并发、错峰和边界重叠；长音频和 WebSocket 路线可保留提供商返回的说话人、分段和时间戳信息。

浮岛样式：
<img src="./docs/assets/voice/audio-file-transcription.gif" width="800">


### 语音朗读

把选中文本或笔记内容交给已配置的 TTS 提供商朗读。生成的音频可在浮岛中播放、拖出，或按配置保存到 vault 内目录。

朗读支持选区 / 笔记正文、长文本分段、后续分段预生成、内存缓存、自动保存生成音频、拖出音频文件和可选输出设备。Markdown 可按“可读文本”或原始 Markdown 朗读。

浮岛样式：
<img src="./docs/assets/voice/read-aloud.gif" width="800">

### 配置与入口

**模型 → 语音识别 (ASR)**：添加 HTTP 短音频、HTTP 长音频、WebSocket 三类 ASR 端点，并可用短录音测试配置。
<img src="./docs/assets/voice/config-ASR.png" width="600">

**模型 → 语音生成（TTS）**：添加 OpenAI-compatible speech、MiMo chat-audio TTS、百炼 CosyVoice 等 TTS 端点。
<img src="./docs/assets/voice/config-TTS.png" width="600">

**语音 → 语音浮岛**：控制浮岛显示、模式排序和可见性。
<img src="./docs/assets/voice/config-floating-island.png" width="600">

**语音 → 上下文感知语音输入 / 音频文件转写 / 朗读**：分别选择当前工作流使用的 ASR 或 TTS 端点，并配置各自的高级选项。

<img src="./docs/assets/voice/config-context-voice-input.png" width="600">
<img src="./docs/assets/voice/config-audio-file-transcription.png" width="600">
<img src="./docs/assets/voice/config-read-aloud.png" width="600">

## 手动安装

1. 打开本语音版发布页：<https://github.com/concentrate1/obsidian-yolo/releases>
2. 从语音版发布下载 `main.js`、`manifest.json` 和 `styles.css`。
3. 备份当前 vault 和 YOLO 插件设置。
4. 在 vault 中创建或打开以下目录：

   ```text
   <vault>/.obsidian/plugins/yolo/
   ```

5. 把下载的三个文件复制到该目录。
6. 在 Obsidian 中打开“设置 -> 第三方插件”，如果已安装上游 YOLO，先禁用它，再启用本语音版。

语音版版本号使用 `-voice` 后缀，例如 `1.5.10.1-voice`。插件内更新检查只跟随 `yolo-unofficial-dev` 语音发布通道，不会和上游 YOLO 发布比较。

## 配置指南

先从这里开始：[语音配置总目录](./docs/tutorials/voice/voice-configuration.md)

## 技术说明

面向维护者的架构、关键取舍和发布分支边界见 [语音版实现说明](./docs/technical/voice-implementation.md)。

## 分支说明

- 本 fork 中的 `main` 应保持为上游镜像分支。
- `yolo-unofficial-dev` 用来集中查看和试用这套语音版改动。
- 实际希望上游合并的功能 PR 仍然是 `context-voice-input`，不是 `yolo-unofficial-dev`。

## 原项目

YOLO（You Orchestrate, LLM Operates）是一个 Obsidian 插件，提供 AI 聊天、写作辅助、RAG 和 agent 工作流。

- 上游仓库：<https://github.com/Lapis0x0/obsidian-yolo>
- 上游发布页：<https://github.com/Lapis0x0/obsidian-yolo/releases>
- 许可证：[MIT License](LICENSE)
