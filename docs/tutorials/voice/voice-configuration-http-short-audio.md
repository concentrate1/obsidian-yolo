# HTTP 短音频 ASR 配置教程

本文只负责 **HTTP 短音频** 栏位的 ASR 提供商配置。语音功能入口、三栏选择逻辑和路线判断见 [语音配置教程总目录](./voice-configuration.md)。WebSocket 提供商见 [WebSocket ASR 配置](./voice-configuration-websocket-asr.md)；HTTP 长音频文件提供商见 [HTTP 长音频文件配置](./voice-configuration-http-long-audio.md)。

HTTP 短音频分段上传时，本地切片统一转成 WAV；部分提供商例如 Aliyun / DashScope 需要更短的 WAV 分段。

插件执行时优先按当前提供商的 `maxDurationMs` / 用户设置的 chunk 时长决定实际分段。已知 `maxRequestBytes` 只用于设置页提醒：当用户切换音频文件转写提供商或修改 chunk 时长，且当前组合可能让 WAV chunk 超过已知请求大小上限时，会弹出提示建议改到具体秒数。

## HTTP 短音频协议

### OpenAI-compatible transcription

适用于兼容 OpenAI `/v1/audio/transcriptions` 的服务。请求是 `multipart/form-data`，字段包含 `file`、`model`、`response_format=json`，可选 `language` / `prompt`。

插件配置：

- 栏位：`HTTP 短音频`
- API 形式：`Transcription`
- Base URL：服务基础地址，例如 `https://api.openai.com/v1`
- 路径：通常 `/audio/transcriptions`
- Model：必须填写；即使本地服务忽略 model，也建议填启动时使用的模型名
- 音频格式：默认 `auto`；服务拒绝 webm / opus 时切到 `wav`
- 请求方式：优先 `node` 或 `auto`，遇到本地服务 / CORS 问题可试 `obsidian` 或 `browser`

### OpenAI-compatible Chat Audio

适用于通过 `/v1/chat/completions` 接收音频 content part 的多模态模型。它能用于短音频和文件切段，但成本通常高于 transcription，且不保证逐字或结构化分段。

插件配置：

- 栏位：`HTTP 短音频`
- API 形式：`Chat Audio`
- Base URL：服务基础地址
- 路径：通常 `/chat/completions`
- Model：必须填写
- 音频 content 格式：
  - OpenAI / OpenRouter / Gemini OpenAI-compatible：`input_audio (base64)`
  - 阿里百炼 / DashScope：`input_audio (data URL)`
  - 部分 vLLM 镜像：可试 `audio_url`
- 音频格式：默认 `auto`；Aliyun / DashScope 建议 `wav`

## 在线接入

### OpenAI

OpenAI 官方 Speech-to-Text，默认在线起步路径。

- 栏位：`HTTP 短音频`
- API 形式：`Transcription`
- Base URL：`https://api.openai.com/v1`
- 路径：`/audio/transcriptions`
- Model 候选：`whisper-1`、`gpt-4o-transcribe`、`gpt-4o-mini-transcribe` 等
- 音频格式：`auto`

### 智谱 GLM

智谱开放平台通过 OpenAI-compatible `/v4/audio/transcriptions` 提供 GLM 系语音转文本模型。官方文档：https://docs.bigmodel.cn/api-reference/模型-api/语音转文本

- 栏位：`HTTP 短音频`
- API 形式：`Transcription`
- Base URL：`https://open.bigmodel.cn/api/paas/v4`
- 路径：`/audio/transcriptions`
- Model 候选：`glm-asr-2512` 等
- 音频格式：`wav`

### Google Gemini

Gemini 在 OpenAI-compatible 模式下支持音频输入，可走 Chat Audio。

- 栏位：`HTTP 短音频`
- API 形式：`Chat Audio`
- Base URL：`https://generativelanguage.googleapis.com/v1beta/openai`
- 路径：`/chat/completions`
- Model 候选：`gemini-3.5-flash`、`gemini-3.1-flash-lite`、`gemini-2.5-flash` 等
- 音频 content 格式：`input_audio (base64)`
- 音频格式：`auto`，遇到格式错误再试 `wav`

### 阿里百炼 / DashScope

百炼的 `qwen3-asr-flash` 可接在 OpenAI-compatible chat-completions 上。官方文档：https://help.aliyun.com/zh/model-studio/qwen-asr-api-reference

- 栏位：`HTTP 短音频`
- API 形式：`Chat Audio`
- Base URL：
  - 中国大陆：`https://dashscope.aliyuncs.com/compatible-mode/v1`
  - 国际：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- 路径：`/chat/completions`
- Model：`qwen3-asr-flash`
- 音频 content 格式：`input_audio (data URL)`
- 音频格式：`wav`

文件转写提示：Aliyun / DashScope 对 data-uri 和多模态文件大小更敏感。插件会按提供商能力把 WAV 分段自动压到更短时长；如果当前设置的 chunk 时长和已知请求大小上限冲突，设置页会提示建议值。若仍遇到上传大小错误，请继续调低 HTTP 短音频 chunk 时长。

## 本地部署

以下命令以 Windows / PowerShell 和 NVIDIA GPU 为主要参考。其它平台可类比调整。

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

需要安装 Python 3.11~3.13。

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

HTTP 短音频通常使用 `auto` 或 `wav`，不需要给 WhisperLiveKit 加 `--pcm-input`。如果同一个 WhisperLiveKit 服务也要给 WebSocket `PCM 16k` 配置使用，启动命令才需要加 `--pcm-input`，并且 WebSocket 提供商的音频格式要与启动参数保持一致。

插件配置：

- 栏位：`HTTP 短音频`
- API 形式：`Transcription`
- Base URL：`http://127.0.0.1:8000/v1`
- 路径：`/audio/transcriptions`
- Model：与启动参数一致，例如 `whisper:large-v3`
- API key：留空
- 音频格式：`auto`

启动后可打开 `http://127.0.0.1:8000` 使用 WhisperLiveKit 自带 WebUI 做快速验证。

### FunASR HTTP 短音频

FunASR 支持中文与中英混合识别，`funasr-server` 可对接 OpenAI-compatible transcription。注意：这只是 HTTP 短音频 / 普通转写路线；长音频带说话人方案使用 **HTTP 长音频** 的 FunASR local 配置，见 [HTTP 长音频文件配置](./voice-configuration-http-long-audio.md)。

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

模型候选：`sensevoice`（中文 / 中英混合）、`paraformer`、`paraformer-en`、`fun-asr-nano`，或显式 ModelScope 模型路径。

首次启动会从 ModelScope 拉模型，默认缓存在 `%USERPROFILE%\.cache\modelscope`。

插件配置：

- 栏位：`HTTP 短音频`
- API 形式：`Transcription`
- Base URL：`http://127.0.0.1:8001/v1`
- 路径：`/audio/transcriptions`
- Model：`sensevoice`
- API key：留空
- 音频格式：`wav`

## 排错

- **下拉菜单里没有提供商**：先到 **模型 → 语音识别 (ASR)** 添加配置。上下文感知语音输入只显示 **HTTP 短音频** 和 **WebSocket**。
- **HTTP 提供商测试提示缺少 model**：HTTP 短音频配置必须填写 model。即使服务端忽略，也建议填服务启动模型名。
- **文件转写找不到切段设置**：只有选择 **HTTP 短音频** 时才显示切段相关设置；WebSocket 和 HTTP 长音频不显示。
- **Aliyun / DashScope 文件过大**：降低音频文件转写中的 chunk 时长。分段上传实际是 WAV，`auto` 不代表 chunk 会保持原始格式。
- **本地服务连不上**：先用浏览器或 curl 验证服务地址，再检查 Base URL 是否包含正确的 `/v1`。
