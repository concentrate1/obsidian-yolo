# HTTP 长音频转写配置教程

选择 HTTP 长音频提供商后，文件会走提供商原生长音频接口。这些提供商适合会议、访谈、播客、课程等较长录音。本插件会把整个音频原样提交给服务端，并使用提供商返回的说话人、分段和时间戳信息。

WebSocket 也可以处理长音频文件。如果你想让文件按流式方式发送，见 [WebSocket ASR 配置](./voice-configuration-websocket-asr.md)。本页只说明 **HTTP 长音频** 栏里的文件提供商。


## 通用选项

- 长音频提供商：选择具体厂商或本地服务
- Base URL：服务基础地址，可填官方 endpoint、本地服务、反向代理或企业网关
- 语言：Deepgram、腾讯云建议明确填写，例如中文填 `zh`；火山 / 豆包极速版当前不在插件里发送语言字段。
- 说话人区分：Deepgram、腾讯云、火山 / 豆包支持 `自动 / 开 / 关`。自动模式下，上下文感知语音输入关闭说话人标签，音频文件转写开启说话人标签。FunASR local 不在插件里提供独立开关，输出取决于服务端返回的结构化结果。
- 时间戳：Deepgram、腾讯云由插件配置并随请求发送；火山 / 豆包会使用返回的 `utterances` 时间信息；FunASR local 取决于服务端返回的结构化结果。


## 输出行为

- 有 speaker label 时，转写结果按 `Speaker 1: 文本` 这类形式输出。
- “输出元数据”选择 `元数据 + 时间戳` 时，如果服务商返回了段级时间戳，按段显示时间；服务商没返回时不在本地推算。
- 没有 speaker label 时退化为普通文本，不调用 LLM 猜测说话人。
- 文件超过当前提供商限制时，会提示更换 HTTP 长音频提供商。用户也可换回 HTTP 短音频使用本地切段。


## 本地部署

本地部署在长音频场景的优势更明显：长录音不需要先上传到云端，少了公网、队列和跨境网络抖动，不用支付云服务商费用。代价是配置、运行和维护要用户自行承担。

### FunASR local

FunASR local 适合中文长录音和本地部署。当前插件默认按 FunASR 的 OpenAI-compatible `/v1/audio/transcriptions` 接口整文件提交。没有云服务商固定的文件时长、文件大小和返回时间承诺；实际限制由本地服务、内存、显存、模型和上传接口决定。VAD、标点和说话人分离须由 FunASR 服务端预先配置。

官方资料：https://modelscope.github.io/FunASR/zh/tutorial.html

安装方式已在 [HTTP 短音频 ASR 配置教程](./voice-configuration-http-short-audio.md) 提及。这里先区分插件默认配置和服务端教程：插件只把文件发到 HTTP 服务，并填写服务端模型别名；标点和说话人能力由服务端决定。

#### 插件默认配置

新建 `FunASR local` 长音频配置时，默认填这组值：

- 长音频提供商：`FunASR local`
- Base URL：`http://127.0.0.1:8001/v1`
- 转写路径：`/audio/transcriptions`
- API key：可留空
- 模型：`paraformer`
- 说话人标签：插件没有单独开关，只有服务端返回 speaker 字段时才会输出。

#### 服务端方式 A：直接用 `funasr-server`

用内置服务验证流程:

```powershell
funasr-server --device cuda --port 8001 --model paraformer
```


#### 服务端方式 B：需要说话人标签

用官方 OpenAI-compatible 示例 `server.py` 启动可编辑服务端。下面命令会下载 `server.py`，把 `cam++` 加进 `MODEL_CONFIGS["paraformer"]`，然后启动服务：

```powershell
# 创建并进入一个单独目录，避免把下载的示例服务混进插件仓库或其他项目。
New-Item -ItemType Directory -Force .\funasr-openai-api | Out-Null
Set-Location .\funasr-openai-api

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


插件配置：
- 长音频提供商：`Deepgram 预录音频`
- Base URL：`https://api.deepgram.com`
- 转写路径：`/v1/listen`
- API 密钥：从提供商获取
- 模型：`nova-3`
- Language：英文可留 `auto` 或填 `en`；非英语建议明确填写，例如中文填 `zh`，不要只依赖 `auto`
- 标点：默认开启；开启时插件发送 `smart_format=true` 和 `punctuate=true`。非英文音频可能不返回标点。
- 说话人区分：开启后插件发送 `diarize_model=latest`，并自动请求 `utterances=true`
- 时间戳：可开启

### 腾讯云录音文件识别极速版

腾讯云录音文件识别极速版适合中文普通话、方言或中英混合音频，需要较快返回完整转写。使用前需要在腾讯云控制台开通语音识别服务。支持 100 MB 以内且时长不超过 2 小时的音频文件。官方说明通常 30 分钟音频可在 10 秒内完成识别。

官方资料：

- 录音文件识别极速版：https://cloud.tencent.cn/document/product/1093/52097
- 计费概述：https://cloud.tencent.com/document/buy-guide/1093/35686

插件配置：
- 提供商：`腾讯云极速版`
- Base URL：`https://asr.cloud.tencent.com`
- 转写路径：`/asr/flash/v1`，插件会自动在末尾追加 AppID
- AppID：腾讯云主账号 AppID，不是账号 ID
- SecretID：从腾讯云获得，可以来自子账号
- SecretKey：从腾讯云获得，可以来自子账号
- 模型：可选如 `16k_zh` / `16k_zh_large`
- 说话人区分：开启后插件发送 `speaker_diarization=1` 
- 时间戳：开启后插件发送 `word_info=1` 
- 请求方式：建议用 `Node` 或 `Auto`。腾讯云极速版没有开放 CORS，`浏览器 fetch` 会被拦住。

### 火山 / 豆包录音文件识别极速版

火山 / 豆包极速版适合中文长录音的一次性识别。官方接口是一请求一结果，不需要 submit / query 轮询；支持 WAV、MP3、OGG OPUS，音频不超过 2 小时且不超过 100 MB。使用前需要在火山引擎新控制台开通对应资源。

官方资料：https://www.volcengine.com/docs/6561/1631584

插件配置：
- 长音频提供商：`火山 / 豆包极速版`
- Base URL：`https://openspeech.bytedance.com`
- 转写路径：`/api/v3/auc/bigmodel/recognize/flash`
- API key：填写新控制台获取的 API Key
- 资源 ID / 模型：`volc.bigasr.auc_turbo`
- 说话人区分：`自动 / 开 / 关`；自动模式下，文件转写开启，上下文感知语音输入关闭
- 请求方式：建议用 `Node` 或 `Auto`。浏览器直连通常会受 CORS 和自定义鉴权 header 限制。
