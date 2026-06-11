# HTTP 短音频 ASR 配置教程

本文只涉及 **HTTP 短音频** 栏位的 ASR 提供商配置，可用于上下文感知输入和音频文件转写功能。


## 协议类型

### OpenAI-compatible transcription

适用于兼容 OpenAI `/v1/audio/transcriptions` 的服务。请求是 `multipart/form-data`，字段包含 `file`、`model`、`response_format=json`，可选 `language` / `prompt`。

插件配置：

- API 形式：`Transcription`
- Base URL：服务商提供
- 转写路径：通常为 `/audio/transcriptions`
- API 密钥：从服务商获取
- 模型：根据服务商信息填写
- 音频格式：默认 `auto`；服务拒绝 webm / opus 时切到 `wav`，文件更大但兼容性更好
- 请求方式：优先 `node` 或 `auto`，遇到本地服务 / CORS 问题可试 `obsidian` 或 `browser`

### OpenAI-compatible Chat Audio

适用于通过 `/v1/chat/completions` 接收音频 content part 的多模态模型。它能用于短音频和文件切段，但成本通常高于 transcription，且不保证逐字或结构化分段。

插件配置：

- API 形式：`Chat Audio`
- Base URL：服务商提供
- 对话补全路径：通常为 `/chat/completions`
- API 密钥：从服务商获取
- 模型：根据服务商信息填写
- 音频内容载体：
  - OpenAI / OpenRouter / Gemini OpenAI-compatible：`input_audio (base64)`
  - 阿里百炼 (DashScope)、小米 MiMo：`input_audio (data URL)`
  - 部分 vLLM 镜像：可试 `audio_url`
- 音频格式：默认 `auto`；服务拒绝 webm / opus 时切到 `wav`，文件更大但兼容性更好
- 请求方式：优先 `node` 或 `auto`，遇到本地服务 / CORS 问题可试 `obsidian` 或 `browser`
- 自定义参数：可直接添加顶层 JSON 字段。

## 在线接入

### OpenAI

OpenAI Speech-to-Text 支持 `transcriptions` 和 `translations` 两类端点，本插件的 HTTP 短音频配置使用的是 `transcriptions`。

官方文档：https://platform.openai.com/docs/guides/speech-to-text

插件配置：

- API 形式：`Transcription`
- Base URL：`https://api.openai.com/v1`
- 转写路径：`/audio/transcriptions`
- 模型：`whisper-1`、`gpt-4o-transcribe`、`gpt-4o-mini-transcribe` 等
- 音频格式：`auto`


### 智谱 GLM

智谱开放平台通过 OpenAI-compatible `/v4/audio/transcriptions` 提供 GLM 系语音转文本模型。

官方文档：https://docs.bigmodel.cn/api-reference/模型-api/语音转文本

插件配置：

- API 形式：`Transcription`
- Base URL：`https://open.bigmodel.cn/api/paas/v4`
- 转写路径：`/audio/transcriptions`
- 模型：`glm-asr-2512` 等
- 音频格式：`wav`

### Google Gemini

Gemini 在本插件里应走 OpenAI-compatible Chat Audio，把音频作为 `input_audio` content part 发到 `/chat/completions`。

官方文档：
- OpenAI 兼容接入：<https://ai.google.dev/gemini-api/docs/openai>
- 音频理解：<https://ai.google.dev/gemini-api/docs/audio>

插件配置：
- API 形式：`Chat Audio`
- Base URL：`https://generativelanguage.googleapis.com/v1beta/openai`
- 对话补全路径：`/chat/completions`
- 模型：`gemini-3.5-flash`、`gemini-3.1-flash-lite`、`gemini-2.5-flash` 等
- 音频内容载体：`input_audio (base64)`
- 音频格式：`wav`


### 阿里百炼（DashScope）

阿里云百炼平台的 `qwen3-asr-flash` 可接在 OpenAI-compatible chat-completions 上。

官方文档：https://help.aliyun.com/zh/model-studio/qwen-asr-api-reference

插件配置：
- API 形式：`Chat Audio`
- Base URL：
  - 中国大陆：`https://dashscope.aliyuncs.com/compatible-mode/v1`
  - 国际：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- 对话补全路径：`/chat/completions`
- 模型：`qwen3-asr-flash`
- 音频内容载体：`input_audio (data URL)`
- 音频格式：`wav`

### 小米 MiMo ASR

小米 MiMo-V2.5-ASR 走 OpenAI-compatible `/v1/chat/completions`。官方示例把音频放在 `input_audio.data` 的 data URL 中，并通过 `asr_options` 控制语言等 ASR 参数。

官方文档：https://platform.xiaomimimo.com/docs/zh-CN/api/audio/Speech-Recognition

插件配置：
- API 形式：`Chat Audio`
- Base URL：`https://api.xiaomimimo.com/v1`
- 对话补全路径：`/chat/completions`
- API 密钥：从小米 MiMo 控制台获取
- 模型：`mimo-v2.5-asr`
- 音频内容载体：`input_audio (data URL)`
- 音频格式：`auto`；如果服务端拒绝当前录音格式，可改为 `wav`
- 自定义参数：默认不内置 `asr_options`。如需指定语言，可添加自定义参数 `"asr_options":{"language":"zh"}`。


## 本地部署

以下命令以 Windows / PowerShell 和 NVIDIA GPU 为例。

中国大陆下载部分模型可能需要网络工具。pip 包可使用镜像源加速；如果需要先安装 CUDA 版 PyTorch，可参考：

```powershell
pip install torch torchvision torchaudio `
  -i https://mirrors.nju.edu.cn/pytorch/whl/cu130 `
  --extra-index-url https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple/
```

### WhisperLiveKit HTTP

WhisperLiveKit 暴露 OpenAI-compatible `/v1/audio/transcriptions`，也提供 WebSocket 端点；WebSocket 配置见 [WebSocket ASR 配置](./voice-configuration-websocket-asr.md)。

官方项目：https://github.com/QuentinFuxa/WhisperLiveKit

安装：

需要准备 Python 3.11~3.13。

```powershell
# CPU
pip install whisperlivekit

# NVIDIA GPU
pip install "whisperlivekit[cu130]"
```

如涉及转码还需要 ffmpeg：

```powershell
winget install Gyan.FFmpeg
```

启动：

```powershell
# CPU 可部署较小模型；英语以外语言能力一般
wlk run whisper:base --host 127.0.0.1 --port 8000 --language zh

# NVIDIA GPU 可部署较大模型；多语言能力较强，占用约 10GB 显存
wlk run whisper:large-v3 --host 127.0.0.1 --port 8000 --language zh
```

首次启动会自动拉模型。模型选项和显存占用可参考 WhisperLiveKit 的 [default and custom models](https://github.com/QuentinFuxa/WhisperLiveKit/blob/main/docs/default_and_custom_models.md)。


插件配置：

- 栏位：`HTTP 短音频`
- API 形式：`Transcription`
- Base URL：`http://127.0.0.1:8000/v1`
- 转写路径：`/audio/transcriptions`
- API 密钥：留空
- 模型：与启动参数一致，例如 `whisper:large-v3`
- 音频格式：`auto`

启动后可打开 `http://127.0.0.1:8000` 使用 WhisperLiveKit 自带 WebUI 快速验证。

### FunASR HTTP 短音频

FunASR 支持中文与中英混合识别，`funasr-server` 可对接 OpenAI-compatible transcription。这里只涉及 HTTP 短音频，长音频带说话人的方案见 [HTTP 长音频文件配置](./voice-configuration-http-long-audio.md)。

官方项目：https://github.com/modelscope/FunASR
接入文档：https://modelscope.github.io/FunASR/agent.html

安装：

需要 Python 3.10~3.12。可以先装好与本机驱动匹配的 PyTorch，再安装 FunASR：

```powershell
pip install funasr
```

CUDA 版 PyTorch 可用以下命令确认是否被 Python 识别：

```powershell
python -c "import torch; print(torch.__version__); print(torch.cuda.is_available()); print(torch.version.cuda); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CUDA unavailable')"
```

启动：

```powershell
# CPU
funasr-server --device cpu --port 8001 --model sensevoice

# NVIDIA GPU；占用约 1.5GB 显存
funasr-server --device cuda --port 8001 --model sensevoice
```

模型：`sensevoice`（中文 / 中英混合）、`paraformer`、`paraformer-en`、`fun-asr-nano`，或显式 ModelScope 模型路径。

首次启动会从 ModelScope 拉模型，默认缓存在 `%USERPROFILE%\.cache\modelscope`。

插件配置：

- 栏位：`HTTP 短音频`
- API 形式：`Transcription`
- Base URL：`http://127.0.0.1:8001/v1`
- 转写路径：`/audio/transcriptions`
- API 密钥：留空
- 模型：`sensevoice`
- 音频格式：`wav`

## 排错

- **下拉菜单里没有提供商**：先到 **模型 → 语音识别 (ASR)** 添加配置。上下文感知语音输入显示 **HTTP 短音频**、**HTTP 长音频** 和 **WebSocket**。
- **HTTP 提供商测试提示缺少 model**：HTTP 短音频表单会要求填写模型，插件会把它作为 `model` 字段发送给服务端。使用本地服务时，也应填写启动时使用的模型名，避免和服务端实际加载的模型不一致。
- **文件转写找不到切段设置**：只有选择 **HTTP 短音频** 时才涉及切段相关设置；WebSocket 和 HTTP 长音频不显示。
- **Aliyun DashScope 文件过大**：降低音频文件转写中的 chunk 时长。
- **本地服务连不上**：可先用浏览器或 curl 验证服务地址。
