# 语音功能配置教程

本文集中索引语音相关配置教程。ASR / TTS 端点在 **模型** 设置页管理；浮岛、口述输入、音频文件转写和朗读工作流在独立 **语音** 设置页配置，不再放在 **编辑器** 页签下。

由于作者设备原因，教程中的本地部署命令以 Windows / PowerShell 为主，GPU 厂商以 NVIDIA 为主要参考。其它平台可以类比调整，也欢迎补充。

## 入口速览

- **语音 → 语音浮岛**：最上方的总开关控制浮岛是否显示；模式列表显示当前已启用的点按、长按、文件转写、朗读等状态，可排序，也可逐项隐藏。
- **模型 → 语音识别 (ASR)**：管理 ASR 端点。配置区固定分为 **HTTP 短音频**、**HTTP 长音频**、**WebSocket** 三栏。
- **模型 → 语音生成（TTS）**：管理朗读使用的 TTS 端点、模型、音色和输出格式。
- **语音 → 上下文感知语音输入**：选择口述输入使用的 ASR 提供商，只显示 **HTTP 短音频** 和 **WebSocket**。
- **语音 → 音频文件转写**：选择拖入 / 选择音频文件时使用的 ASR 提供商，显示 **HTTP 短音频**、**HTTP 长音频**、**WebSocket**。其中 **HTTP 长音频** 只指长音频文件提供商；已接入 FunASR local、Deepgram pre-recorded 和腾讯云极速版。**WebSocket** 统管短录音实时转写和音频文件流式转写。只有选中 **HTTP 短音频** 时才显示切段、并发、错峰、overlap、段首时间等设置。
- **语音 → 朗读**：配置朗读开关、默认提供商、分段、缓存和 Markdown 朗读模式。


## 路线判断

| 场景 | 推荐模式 | 说明 |
| --- | --- | --- |
| 口述输入 + 结合上下文纠错/翻译 | HTTP 短音频 / WebSocket | 上下文感知语音输入绑定这两类 |
| 拖入短音频，只要正文 | HTTP 短音频 | 可直传，超过限制时本地切段 |
| 长会议/访谈转写，需要说话人 | HTTP 长音频 | 走提供商原生长音频能力，功能更丰富 |
| 长音频转写但不希望外传 | HTTP 长音频 / WebSocket | 语音转文字、活动检测、标点恢复、说话人识别都有本地方案 |
| 希望流式输出 | WebSocket | WebSocket 路线可统管长短音频，但在线服务转写速度可能受限 |

## 教程列表

1. [HTTP 短音频 ASR 配置](./voice-configuration-http-short-audio.md)
   - OpenAI-compatible Transcription
   - OpenAI-compatible Chat Audio
   - 智谱 GLM、Google Gemini、阿里百炼
   - WhisperLiveKit / FunASR 的本地 HTTP 短音频配置


2. [HTTP 长音频文件转写配置](./voice-configuration-http-long-audio.md)
   - FunASR local
   - Deepgram pre-recorded
   - 腾讯云极速版

3. [WebSocket ASR 配置](./voice-configuration-websocket-asr.md)
   - Deepgram-compatible `/listen`
   - WhisperLiveKit native `/asr`

4. [语音朗读 / TTS 配置](./voice-configuration-tts.md)
   - OpenAI-compatible speech
   - OpenRouter
   - 小米 MiMo
   - 百炼 CosyVoice
   - Kokoro-FastAPI
