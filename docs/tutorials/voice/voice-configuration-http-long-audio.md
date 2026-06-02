# HTTP 长音频转写配置教程

HTTP 长音频转写提供商适合会议、访谈、播客、课程等较长录音。它会把整段文件或提供商原生任务提交给服务端，并使用提供商返回的说话人、分段和时间戳信息。

WebSocket 也可以处理长音频文件。如果你想让文件按流式方式发送，请选择 **WebSocket** 栏，见 [WebSocket ASR 配置](./voice-configuration-websocket-asr.md)。本页只说明 **HTTP 长音频** 栏里的文件提供商。

## 使用位置

- **模型 → 语音识别 (ASR) → HTTP 长音频**：添加和管理 HTTP 长音频文件提供商。
- **语音 → 音频文件转写**：选择 HTTP 长音频提供商后，文件会走提供商原生长音频接口。
- **切段设置**：HTTP 长音频不显示本地切段、并发、错峰、overlap、段首时间等 HTTP 短音频设置。

## 通用字段

- 栏位：`HTTP 长音频`
- 提供商：选择具体厂商或本地服务
- Base URL：服务基础地址，可填官方 endpoint、本地服务、反向代理或企业网关
- API path：按提供商要求填写
- API key / Secret / AppID：按提供商鉴权方式填写
- Model / Engine：按提供商支持的长音频模型填写
- Language：建议明确填写，例如中文填 `zh`
- Speaker diarization / timestamps：Deepgram、腾讯云由插件配置并随请求发送；FunASR local 不在插件里提供独立开关，输出取决于服务端返回的结构化结果。
- 文件格式：HTTP 长音频提供商按用户选择的音频文件原样提交，不使用 HTTP 短音频里的 `Audio format` 转码设置。腾讯云请直接选择官方支持的文件格式。


## 云端接入

### Deepgram pre-recorded

Deepgram pre-recorded 适合整文件转写和说话人区分。

适用场景：

- 国际服务、英文或多语种会议、访谈、播客。
- 想直接上传本地文件，并使用 Deepgram 原生 diarization、utterances 和 timestamps。
- 文件较大，但希望提供商负责整段上下文，而不是本地切段后逐段识别。

限制和返回时间：

- 本地文件最大 2 GB。视频文件建议先抽取音频再上传。
- 官方同步请求有处理时间上限：Nova / Base / Enhanced 处理超过 10 分钟会返回 `504`；Whisper 处理超过 20 分钟会返回 `504`。
- Deepgram 没有给出固定“多少分钟音频必定多久返回”的承诺；短文件常见几秒返回，长文件受模型、队列和请求超时影响。
- 如果长文件经常触发超时，后续应接 Deepgram callback / async 路线；当前教程先按直接上传配置。

官方资料：

- Pre-recorded audio：https://developers.deepgram.com/docs/pre-recorded-audio
- Punctuation：https://developers.deepgram.com/docs/punctuation
- Smart Formatting：https://developers.deepgram.com/docs/smart-format
- Speaker diarization：https://developers.deepgram.com/docs/diarization
- Utterances：https://developers.deepgram.com/docs/utterances

- 栏位：`HTTP 长音频`
- 提供商：`Deepgram pre-recorded`
- Base URL：`https://api.deepgram.com`
- Path：`/v1/listen`
- Model：`nova-3`
- API key：Deepgram project key
- Language：英文可留 `auto` 或填 `en`；非英语建议明确填写，例如中文填 `zh`，不要只依赖 `auto`
- 标点 / Smart Format：默认开启；开启时插件发送 `smart_format=true` 和 `punctuate=true`。Deepgram 文档把 punctuation 标为全语言可用，但 Smart Format 的英文格式化能力最完整；中文等非英文音频可能仍然不返回标点，最终以服务端实际结果为准。若当前语言产生不理想的格式化，可关闭。
- Speaker diarization：开启后插件发送 `diarize_model=latest`，并自动请求 `utterances=true`
- Timestamps：开启

### 腾讯云录音文件识别极速版

腾讯云录音文件识别极速版适合中文长录音。

适用场景：

- 中文普通话、方言或中英混合音频，需要较快返回完整转写。
- 文件在 100 MB / 2 小时以内，希望一次 HTTPS 请求同步拿到 JSON 结果。
- 需要句子级说话人 ID，且当前音频符合腾讯云说话人分离支持范围。

限制和返回时间：

- 使用前需要在腾讯云控制台开通语音识别服务
- 支持 100 MB 以内且时长不超过 2 小时的音频文件。
- 支持格式：`wav`、`pcm`、`ogg-opus`、`speex`、`silk`、`mp3`、`m4a`、`aac`、`amr`。
- 官方说明通常 30 分钟音频可在 10 秒内完成识别；这是同步接口，服务端会在同一次请求里返回结果。
- 免费并发：普通版本 20，大模型版本 5。超过并发或忙时会受排队和限流影响。
- `speaker_diarization` 目前主要支持中文普通话引擎；非中文音频应关闭说话人区分或提示能力不可用。

官方资料：

- 录音文件识别极速版：https://cloud.tencent.cn/document/product/1093/52097
- 计费概述：https://cloud.tencent.com/document/buy-guide/1093/35686

- 栏位：`HTTP 长音频`
- 提供商：`Tencent Flash`
- AppID：腾讯云主账号 AppID，不是账号 ID
- SecretID：填在 `SecretID`，可以来自子账号
- SecretKey：填在 `SecretKey`
- Base URL：`https://asr.cloud.tencent.com`
- Path：`/asr/flash/v1`，插件会自动在末尾追加 AppID；也可以用 `{{appId}}` 占位
- Engine：优先 `16k_zh` / `16k_zh_large`
- Speaker diarization：开启后插件发送 `speaker_diarization=1`
- Timestamps：开启后插件发送 `word_info=1`
- Transport：建议用 `Node` 或 `Auto`。腾讯云极速版没有给浏览器跨源调用开放 CORS；`Browser fetch` 会被 `Origin: app://obsidian.md` 拦住，不能作为可用性测试依据。

## 本地部署

本地部署在长音频场景的优势更明显：长录音不需要先上传到云端，少了公网、队列和跨境网络抖动，不用支付云服务商费用。代价是配置、运行和维护要用户自行承担。

### FunASR local

FunASR local 适合中文长录音和本地部署。当前插件默认按 FunASR 的 OpenAI-compatible `/v1/audio/transcriptions` 接口整文件提交。`fsmn-vad`、`ct-punc`、`cam++` 是服务端模型加载时启用的 pipeline 组件，不是 `funasr-server` CLI 参数，也不是 HTTP 报文字段。

同一个 `funasr-server` 也可以作为 **HTTP 短音频** 提供商使用。短音频栏适合普通口述和文件切段上传；HTTP 长音频栏适合把整段录音交给 FunASR，并保留本地 pipeline 返回的分段和说话人标签。

适用场景：

- 不希望会议、访谈、课程录音上传到云端。
- 可以接受自己部署服务、下载模型、承担本机 CPU / GPU 开销。
- 想要稳定拿到本地 pipeline 输出的分段、标点和说话人标签。

限制和返回时间：

- 没有云服务商固定的文件时长、文件大小和返回时间承诺；实际限制由本地服务、内存、显存、模型和上传接口决定。
- 官方 OpenAI-compatible 示例面向文件转写，处理完成后返回完整结果；等待时间通常随音频时长、模型大小和设备性能线性增长。若需要边发边出字，应改用 FunASR WebSocket 实时服务，而不是 HTTP 长音频提供商。
- 用户取消时，插件可以中止本地 HTTP 请求；但 FunASR 这个同步端点没有 job id / cancel API。服务端已经读完文件并进入推理后，是否停止取决于服务端是否响应客户端断开。
- CPU 可用于验证流程，长会议建议使用 GPU。算力不足时优先换云端提供商，或改用 WebSocket 文件流式路线。
- HTTP 长音频请求只发送模型别名 `model=paraformer`，并自动请求 verbose JSON。VAD、标点和说话人分离必须由 FunASR 服务端预先加载。

官方资料：

- FunASR 使用教程：https://modelscope.github.io/FunASR/zh/tutorial.html

安装方式已在 [HTTP 短音频 ASR 配置教程](./voice-configuration-http-short-audio.md) 提及。这里先区分插件默认配置和服务端教程：插件只把文件发到 HTTP 服务，并填写服务端模型别名；标点和说话人能力由服务端决定。

#### 插件默认配置

新建 `FunASR local` 长音频配置时，默认填这组值：

- 栏位：`HTTP 长音频`
- 提供商：`FunASR local`
- Base URL：`http://127.0.0.1:8001/v1`
- API path：`/audio/transcriptions`
- Model：`paraformer`
- 说话人标签：插件没有单独开关；只有服务端返回 speaker 字段时才会输出。

`Model` 是 HTTP 请求里的模型别名，即 `model=paraformer`。它不是底层模型文件名，也不是 `paraformer-zh + fsmn-vad + ct-punc + cam++` 这一整串 pipeline。已经保存过旧配置的用户需要确认这里不是 `sensevoice`。

#### 服务端方式 A：直接用 `funasr-server`

用内置服务验证流程:

```powershell
funasr-server --device cuda --port 8001 --model paraformer
```

这条命令只能选择服务端暴露的模型别名。`funasr-server` CLI 不接受 `--vad-model`、`--punc-model`、`--spk-model`。

#### 服务端方式 B：需要说话人标签

用官方 OpenAI-compatible 示例 `server.py` 启动可编辑服务端。下面命令会下载 `server.py`，把 `cam++` 加进 `MODEL_CONFIGS["paraformer"]`，然后启动服务：

```powershell
# 创建并进入一个单独目录，避免把下载的示例服务混进插件仓库或其他项目。
New-Item -ItemType Directory -Force .\funasr-openai-api | Out-Null
Set-Location .\funasr-openai-api

# 可能涉及的安装包参考
# python -m pip install -U torch torchaudio funasr fastapi uvicorn python-multipart

# 下载 FunASR 官方 OpenAI-compatible HTTP 服务示例。
Invoke-WebRequest https://raw.githubusercontent.com/modelscope/FunASR/main/examples/openai_api/server.py -OutFile server.py

# 给示例服务解除 CORS 限制，方便插件在需要 browser fetch 时访问本地服务（可选）
$content = (Get-Content .\server.py -Raw).Replace('app = FastAPI(title="FunASR OpenAI-Compatible API", version="1.0.0")', 'app = FastAPI(title="FunASR OpenAI-Compatible API", version="1.0.0")' + [Environment]::NewLine + 'from fastapi.middleware.cors import CORSMiddleware; app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])')
Set-Content -Encoding UTF8 .\server.py $content

# 给 paraformer pipeline 增加 cam++ 说话人模型；标点 ct-punc 已在原示例中配置。
$needle = '        "punc_model": "ct-punc",'
$replacement = $needle + [Environment]::NewLine + '        "spk_model": "cam++",'
$content = (Get-Content .\server.py -Raw).Replace($needle, $replacement)
Set-Content -Encoding UTF8 .\server.py $content

# 启动可编辑的 OpenAI-compatible HTTP 服务。
python .\server.py --device cuda --port 8001 --model paraformer
```

此时，如果插件配置中模型也选为 paraformer，应该就可以输出区分说话人的文字了。

注：等价的手动修改位置是 `server.py` 顶部的 `MODEL_CONFIGS`：

```python
"paraformer": {
    "model": "paraformer-zh",
    "vad_model": "fsmn-vad",
    "punc_model": "ct-punc",
    "spk_model": "cam++",
}
```



## 输出行为

- 有 speaker label 时，转写结果按 `Speaker 1: 文本` 这类形式输出。
- “输出元数据”选择 `元数据 + 时间戳` 时，如果服务商返回了段级时间戳，按段显示时间；服务商没返回时不在本地推算。
- 没有 speaker label 时退化为普通文本，不调用 LLM 猜测说话人。
- 文件超过当前提供商限制时，会提示更换 HTTP 长音频提供商，或切回 HTTP 短音频使用本地切段。
