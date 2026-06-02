# 语音朗读 / TTS 配置教程

本文说明语音朗读 / TTS 提供商的配置方式，分**在线接入**与**本地部署**两条路径。TTS 提供商在 **模型 → 语音生成（TTS）** 添加或编辑；朗读开关和默认提供商在 **语音 → 朗读** 配置。

本文按三类 TTS 协议说明配置：

- `openai-compatible-speech`：兼容 OpenAI Audio Speech API，通常是 `POST /v1/audio/speech`，返回音频字节流。
- `mimo-chat-audio-tts`：小米 MiMo 通过 chat completions 返回 `message.audio.data` base64。
- `dashscope-cosyvoice`：百炼 CosyVoice，DashScope HTTP JSON。

三类协议**不可互换**。例如 OpenRouter 是 `openai-compatible-speech`，MiMo 不是；JSON 包装音频的自备代理当前不在教程范围内。


## 在线接入

### OpenAI（Audio Speech 示例）

OpenAI 官方 TTS，使用 `openai-compatible-speech` 配置。

官方文档：https://developers.openai.com/api/docs/guides/text-to-speech

- API 形式：`OpenAI-compatible speech`
- Base URL：`https://api.openai.com/v1`
- 路径：`/audio/speech`
- Model 候选：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd` 等，按官方模型列表为准
- Voice 候选：`alloy`、`ash`、`ballad`、`coral`、`echo`、`fable`、`nova`、`onyx`、`sage`、`shimmer` 等，按所选模型支持为准
- Output format：OpenAI 官方支持 `mp3`、`opus`、`aac`、`flac`、`wav`、`pcm`；日常先用 `mp3`，需要低延迟或无损调试时可试 `wav` / `pcm`
- Style instruction：`gpt-4o-mini-tts` 等支持的模型可填写，例如“语速自然、适合中文长文朗读”；`tts-1` / `tts-1-hd` 不支持该字段

### OpenRouter（OpenAI-compatible speech 聚合示例）

OpenRouter 有专用 `/api/v1/audio/speech` 端点，兼容 OpenAI Audio Speech API。它的优势是可以用一个 API key 试多个 speech 模型；缺点是模型、voice、价格和可用区域变化快。

官方文档：https://openrouter.ai/docs/api/api-reference/speech/create-audio-speech

- API 形式：`OpenAI-compatible speech`
- Base URL：`https://openrouter.ai/api/v1`
- 路径：`/audio/speech`
- Model：例如 `google/gemini-3.1-flash-tts-preview`；其他模型请以 OpenRouter 模型页当前说明为准，也可用 `GET https://openrouter.ai/api/v1/models?output_modalities=speech` 查询
- Voice：按所选模型说明填写，例如 Gemini 的 `Zephyr`；不同提供商的 voice 取值不通用
- Output format：OpenRouter 当前接口只列出 `mp3` / `pcm`，按模型说明选择，例如 Gemini 为 `pcm`
- API key：OpenRouter API key


### 小米 MiMo

MiMo 不是 `/v1/audio/speech`。它走 `/v1/chat/completions`，音频在响应 JSON 的 `choices[0].message.audio.data` 里。

官方介绍：https://mimo.xiaomi.com/
官方文档：https://platform.xiaomimimo.com/docs/zh-CN/usage-guide/speech-synthesis-v2.5

- API 形式：`MiMo chat-audio TTS`
- Base URL：`https://api.xiaomimimo.com/v1`
- 路径：`/chat/completions`
- Model：`mimo-v2.5-tts`；需要音色设计时可试 `mimo-v2.5-tts-voicedesign`
- Voice：预置音色如 `冰糖`、`茉莉`、`苏打`、`白桦`、`Mia`、`Chloe`、`Milo`、`Dean`、`mimo_default`
- Output format：`mp3` 起步；MiMo 支持 `mp3`、`pcm`、`wav`、`pcm16`
- Style instruction：可填写朗读风格，例如“语速自然，清晰朗读”

### 百炼 CosyVoice（DashScope）

百炼 CosyVoice 适合中国大陆网络环境和中文朗读。它不是 OpenAI-compatible speech，应选择 `dashscope-cosyvoice` API 形式。非实时 CosyVoice HTTP API 当前只在百炼中国内地部署范围（北京地域）可用。

官方介绍：https://help.aliyun.com/zh/model-studio/tts-model
HTTP API 参考：https://help.aliyun.com/zh/model-studio/cosyvoice-tts-http-api

- API 形式：`百炼 CosyVoice`
- Base URL：`https://dashscope.aliyuncs.com`
- 路径：`/api/v1/services/audio/tts/SpeechSynthesizer`
- Model 候选：`cosyvoice-v3-flash`、`cosyvoice-v2` 等；`cosyvoice-v3.5-*` 主要用于声音设计 / 复刻，不能直接套用系统音色
- Voice：按百炼控制台 / 文档音色列表填写，例如系统音色 ID；声音设计 / 复刻音色按百炼文档获取对应音色 ID
- Output format：`mp3` 或 `wav`
- Sample rate：先试 `24000`
- Style instruction：可选，会发送为百炼 `instruction`，用于控制方言、情感或角色等效果
- API key：百炼 / DashScope API Key

## 本地部署

本地部署的延迟通常比在线更低。Kokoro-FastAPI 直接兼容 OpenAI Audio Speech API，适合验证朗读链路。

还有其它兼容 OpenAI Audio Speech API 的项目（如 [cosyvoice-docker](https://github.com/neosun100/cosyvoice-docker)），未一一测试。

### Kokoro-FastAPI

Kokoro-FastAPI 是轻量本地 OpenAI-compatible TTS 服务之一，常见端口是 `8880`。它适合 CPU 离线验证和低部署成本场景；中文自然度和音色表现取决于当前模型与 voice pack。

官方项目：https://github.com/remsky/Kokoro-FastAPI

Windows 下可以安装 Docker Desktop + WSL2 来配置：

```powershell
docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
```

有 NVIDIA GPU 时可改用 GPU 镜像：

```powershell
docker run --gpus all -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-gpu:latest # RTX 50 / Blackwell 可改用 latest-cu128
```

启动后可打开 `http://127.0.0.1:8880/docs` 或 `http://127.0.0.1:8880/web` 验证服务。

#### 插件配置

- API 形式：`OpenAI-compatible speech`
- Base URL：`http://127.0.0.1:8880/v1`
- 路径：`/audio/speech`
- Model：`kokoro`，或服务文档支持的 `tts-1` / `tts-1-hd`
- Voice：例如 `zf_xiaoyi`（中文）、`af_bella`（英文）等（可以在前面的网页中浏览选项）
- API key：通常留空或填任意占位值，取决于服务启动配置
- Output format：`mp3` 或 `wav`
