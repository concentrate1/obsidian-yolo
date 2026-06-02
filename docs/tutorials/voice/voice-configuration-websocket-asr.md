# WebSocket ASR 配置教程

本文单独说明 WebSocket ASR。WebSocket 是实时音频连接方式，不是统一协议；插件在 **模型 → 语音识别 (ASR) → WebSocket** 中按提供商配置。

WebSocket ASR 分两条路线：

- **在线接入**：Deepgram，适合直接使用云端服务。
- **本地部署**：WhisperLiveKit，适合本机部署模型。

同一个 WebSocket 提供商统管短录音实时转写和音频文件流式转写，不再按长短音频拆出两套配置。HTTP 短音频配置见 [HTTP 短音频 ASR 配置](./voice-configuration-http-short-audio.md)；HTTP 长音频文件提供商见 [HTTP 长音频文件配置](./voice-configuration-http-long-audio.md)。

## 使用位置

- **语音 → 上下文感知语音输入**：可选择 WebSocket 提供商。`说话人区分` 的 `自动` 默认关闭，避免普通口述插入 speaker label。
- **语音 → 音频文件转写**：可选择 WebSocket 提供商，长短文件都走同一套 WebSocket 文件流式路线。`说话人区分` 的 `自动` 默认开启，用于尽量保留提供商返回的说话人信息。
- **切段设置**：WebSocket 文件流式不使用 HTTP chunk 设置；因此选择 WebSocket 时不会显示切段、并发、overlap 等设置。

## 共同选项

### 音频格式

- `auto`：按录音 / 文件原始容器发送。
- `PCM 16k`：插件转为 16k PCM 音频帧发送，通常更稳定；WhisperLiveKit 需要配合 `--pcm-input`。

### 说话人区分

`说话人区分` 有 `自动 / 开 / 关` 三种：

- `自动`：上下文感知语音输入默认关闭；音频文件转写默认开启。
- `开`：始终请求提供商返回说话人信息。
- `关`：始终关闭说话人信息。

插件只在音频文件转写时承接为 `Speaker N:` 文本；上下文感知语音输入不输出 speaker label，避免普通口述被分人标签打断。


## 在线接入

### Deepgram

Deepgram 是云端 WebSocket ASR。需要 Deepgram project key。

官方资料：

- Live Streaming：https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio
- Diarization：https://developers.deepgram.com/docs/diarization
- Punctuation：https://developers.deepgram.com/docs/punctuation
- Smart Formatting：https://developers.deepgram.com/docs/smart-format

插件配置：

- 栏位：`WebSocket`
- WebSocket 提供商：`Deepgram`
- Base URL：`wss://api.deepgram.com/v1`
- Path：`/listen`
- Model：`nova-3`、`nova-2` 等
- API key：Deepgram project key
- Language：中文填 `zh`
- 音频格式：先试 `PCM 16k`，也可用 `auto`
- 标点：默认开
- 说话人区分：建议保持 `自动`
- 口述命令：按需要开启

Deepgram 才会显示 `标点` 和 `口述命令`：

- `标点`：开启后，插件会向 Deepgram 发送 `punctuate=true` 和 `smart_format=true`，转写结果会尽量补齐标点和大小写。Deepgram 文档把 punctuation 标为全语言可用，但 Smart Format 的英文格式化能力最完整；中文等非英文音频可能仍然不返回标点，最终以服务端实际结果为准。
- `口述命令`：开启后，`comma`、`period`、`new line` 等口述标点命令会尽量转成符号。该功能依赖 `标点` 开关。

Deepgram HTTP pre-recorded 不是这个 WebSocket 配置；它属于 **HTTP 长音频** 提供商，见 [HTTP 长音频文件配置](./voice-configuration-http-long-audio.md)。

## 本地部署

### WhisperLiveKit

WhisperLiveKit 是本地 WebSocket ASR。插件优先使用 native `/asr`，不要把 Deepgram-compatible `/v1/listen` 作为本地首选。安装方式已在[HTTP 短音频 ASR 配置](./voice-configuration-http-short-audio.md)提及。

官方项目：https://github.com/QuentinFuxa/WhisperLiveKit


如果插件 `音频格式` 选择 `auto`，可以这样启动：

```powershell
wlk run whisper:base --host 127.0.0.1 --port 8000 --language zh
```

如果插件 `音频格式` 选择 `PCM 16k`，启动命令需要加 `--pcm-input`：

```powershell
wlk run whisper:base --host 127.0.0.1 --port 8000 --language zh --pcm-input
```


对于说话人识别，需要安装额外工具，例如 NeMo：
```
pip install "git+https://github.com/NVIDIA/NeMo.git@main#egg=nemo_toolkit[asr]"
```

相应地，启动命令要加 `--diarization`。例如：

```powershell
wlk run whisper:base --host 127.0.0.1 --port 8000 --language zh --diarization
```

会自动下载对应模型。

插件配置：

- 栏位：`WebSocket`
- WebSocket 提供商：`WhisperLiveKit`
- Base URL：`ws://127.0.0.1:8000`
- Path：`/asr`
- Model：可留空，或填 `whisper:large-v3`
- API key：留空
- Language：`zh`
- 音频格式：与启动参数匹配
- 速率节流：范围 `1x` 到 `20x`，默认 `2x`；拖入音频文件时，插件最多按这个实时倍速发送给 WhisperLiveKit。以防速度过快造成阻塞，
- 说话人区分：如果启动时加了 `--diarization`，插件里可选 `自动` 或 `开`


## 排错

- **Deepgram 连接失败**：确认 API key 有效。
- **没有标点**：确认 `标点` 开关开启。该选项只在 Deepgram 中显示；如果中文或其它非英文音频仍没有标点，通常是 Deepgram 当前模型 / 语言组合的返回限制，插件不会在本地额外补标点。
- **说话人 label 干扰普通口述**：把 `说话人区分` 设为 `自动` 或 `关`。`自动` 对上下文语音输入默认关闭。
- **文件转写没有切段选项**：WebSocket 路径统管长短音频文件流式发送，不走 HTTP chunk scheduler。
- **WhisperLiveKit 本地连接失败**：确认 WhisperLiveKit 已启动，插件的 Base URL 和 Path 与启动端口一致。
- **WhisperLiveKit 音频格式不匹配**：插件选 `PCM 16k` 时，启动命令需要加 `--pcm-input`；插件选 `auto` 时不要加。
