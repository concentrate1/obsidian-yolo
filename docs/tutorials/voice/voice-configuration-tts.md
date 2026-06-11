# 语音朗读 / TTS 配置教程

本文说明语音朗读 / TTS 提供商的配置方式，分**在线接入**与**本地部署**两条路径。TTS 提供商在 **模型 → 语音生成（TTS）** 添加或编辑；朗读开关和默认提供商在 **语音 → 朗读** 配置。

本文按三类 TTS 协议说明配置：

- `openai-compatible-speech`：兼容 OpenAI Audio Speech API，通常是 `POST /v1/audio/speech`，返回音频字节流。
- `mimo-chat-audio-tts`：小米 MiMo 通过 chat completions 返回 `message.audio.data` base64。
- `dashscope-cosyvoice`：百炼 CosyVoice，DashScope HTTP JSON。
- `volcengine-tts-http`：火山 / 豆包大模型 TTS，使用火山引擎 HTTP v3 语音合成接口。



## 在线接入

### OpenAI

OpenAI 官方 TTS，使用 `openai-compatible-speech` 配置。

官方文档：https://developers.openai.com/api/docs/guides/text-to-speech

- API 格式：`OpenAI 兼容语音`
- Base URL：`https://api.openai.com/v1`
- 请求路径：`/audio/speech`
- API key：从提供商获取
- 模型：例如 `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd` 等，按官方模型列表为准
- 声音：例如 `alloy`、`echo`、`nova`、`shimmer` 等，按所选模型支持为准
- 输出格式：OpenAI 官方支持多种格式，推荐 `opus`、`mp3`
- 风格指令：`gpt-4o-mini-tts` 等支持的模型可填写，例如“语速自然、适合中文长文朗读”

### OpenRouter（OpenAI 兼容语音示例）

OpenRouter 有专用 `/api/v1/audio/speech` 端点，兼容 OpenAI Audio Speech API。

官方文档：https://openrouter.ai/docs/api/api-reference/speech/create-audio-speech

- API 形式：`OpenAI 兼容语音`
- Base URL：`https://openrouter.ai/api/v1`
- 请求路径：`/audio/speech`
- API key：从提供商获取
- 模型：例如 `google/gemini-3.1-flash-tts-preview`；可用列表以 OpenRouter 模型页或者查询 API 为准
- 声音：按所选模型说明填写，例如 Gemini 的 `Zephyr`；不同提供商的选项不通用
- 输出格式：按模型说明选择，例如 Gemini 为 `pcm`


### 小米 MiMo

小米MiMo 走 `/v1/chat/completions`，音频在响应 JSON 的 `choices[0].message.audio.data` 里。

官方介绍：https://mimo.xiaomi.com/
官方文档：https://platform.xiaomimimo.com/docs/zh-CN/usage-guide/speech-synthesis-v2.5

- API 格式：`MiMo 聊天音频 TTS`
- Base URL：`https://api.xiaomimimo.com/v1`
- 请求路径：`/chat/completions`
- API key：从提供商获取
- 模型：`mimo-v2.5-tts`等
- 声音：例如 `冰糖`、`茉莉`、`苏打`、`mimo_default` 等，按所选模型支持为准
- 输出格式：推荐 `mp3` 
- 风格指令：可填写朗读风格，例如“语速自然，清晰朗读”

### 百炼 CosyVoice（DashScope）

百炼 CosyVoice 适合中国大陆网络环境和中文朗读。它不是 OpenAI-compatible speech，应选择 `dashscope-cosyvoice` API 形式。非实时 CosyVoice HTTP API 当前只在百炼中国内地部署范围（北京地域）可用。

官方介绍：https://help.aliyun.com/zh/model-studio/tts-model
HTTP API 参考：https://help.aliyun.com/zh/model-studio/cosyvoice-tts-http-api

- API 格式：`百炼 CosyVoice`
- Base URL：`https://dashscope.aliyuncs.com`
- 请求路径：`/api/v1/services/audio/tts/SpeechSynthesizer`
- API key：从提供商获取
- 模型：`cosyvoice-v3-flash`、`cosyvoice-v2` 等
- 声音：例如 `longxiaochun_v2`，以百炼控制台 / 文档音色列表为准
- 输出格式：`mp3` 或 `wav`
- 风格指令：可选，会发送为百炼 `instruction`，用于控制方言、情感或角色等效果

### 火山 / 豆包 TTS

火山 / 豆包大模型 TTS 使用火山引擎 HTTP v3 语音合成接口，应选择 `volcengine-tts-http` API 形式。

官方资料：https://www.volcengine.com/docs/6561/2528925?lang=zh

- API 格式：`火山 / 豆包 TTS`
- Base URL：`https://openspeech.bytedance.com`
- 请求路径：`/api/v3/tts/unidirectional`
- API key：从火山引擎新控制台获取
- 模型 / 资源 ID：例如 `seed-tts-2.0`
- 声音：例如 `zh_female_vv_uranus_bigtts`，以控制台或音色列表为准
- 输出格式：`mp3`、`wav`、`pcm`、`pcm16`、`opus`；插件会按接口需要把 `opus` 映射为 `ogg_opus`
- 风格指令：可选，会作为上下文文本发送，用于控制朗读风格
- 请求方式：建议用 `Node` 或 `Auto`

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

- API 格式：`OpenAI 兼容语音`
- Base URL：`http://127.0.0.1:8880/v1`
- 路径：`/audio/speech`
- API key：通常留空或填任意占位值，取决于服务启动配置
- 模型：`kokoro`，或文档支持其他模型
- 语音：例如 `zf_xiaoyi`（中文）、`af_bella`（英文）等，可以在前面提到的 Web 网页中获取
- 输出格式：`mp3` 或 `wav`
