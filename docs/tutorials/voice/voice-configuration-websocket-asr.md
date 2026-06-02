# WebSocket ASR 配置教程

WebSocket 语音识别分两种接入方式：

- **在线接入**：Deepgram，适合直接使用云端服务。
- **本地部署**：WhisperLiveKit，适合本机部署模型。

同一 WebSocket 提供商可同时接入短录音实时转写和音频文件流式转写。但音频文件转写速度可能受限。


## 通用选项

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

- WebSocket 提供商：`Deepgram`
- Base URL：`wss://api.deepgram.com/v1`
- Path：`/listen`
- API 密钥：从服务商获取
- 模型：`nova-3`、`nova-2` 等
- 语言：非英文建议填写，例如中文填 `zh`
- 音频格式： `PCM 16k`
- 标点：开启后，插件会向 Deepgram 发送 `punctuate=true` 和 `smart_format=true`，转写结果会尽量补齐标点和大小写。中文等非英文音频可能不返回标点。
- 说话人区分：推荐 `自动`
- 口述命令：按需开启。开启后，`comma`、`period`、`new line` 等口述标点命令会尽量转成符号。

Deepgram HTTP pre-recorded 属于 **HTTP 长音频** 提供商，见 [HTTP 长音频文件配置](./voice-configuration-http-long-audio.md)。

## 本地部署

### WhisperLiveKit

WhisperLiveKit 是本地 WebSocket ASR，提供接口 `/asr`。安装方式已在[HTTP 短音频 ASR 配置](./voice-configuration-http-short-audio.md)提及。

官方项目：https://github.com/QuentinFuxa/WhisperLiveKit


如果 `音频格式` 选择 `auto`，可以这样启动：

```powershell
wlk run whisper:base --host 127.0.0.1 --port 8000 --language zh
```

如果 `音频格式` 选择 `PCM 16k`，启动命令需要加 `--pcm-input`：

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

- WebSocket 提供商：`WhisperLiveKit`
- Base URL：`ws://127.0.0.1:8000`
- Path：`/asr`
- API 密钥：留空
- 模型：可留空，或填对应如 `whisper:base`
- 语言：非英文建议填写，例如中文填 `zh`
- 音频格式：与启动参数匹配
- 速率节流：范围 `1x` 到 `20x`，默认 `2x`；拖入音频文件时，插件最多按这个实时倍速发送给 WhisperLiveKit。以防速度过快造成阻塞，
- 说话人区分：如果启动时加了 `--diarization`，插件里可选 `自动` 或 `开`

