# 语音版实现说明

本文记录非官方语音版的具体实现细节。`yolo-unofficial-dev` 用来集中查看和试用这套语音版改动，并提供配置指南说明如何安装、配置和使用。用于上游合并的 [PR](https://github.com/Lapis0x0/obsidian-yolo/pull/362) 仍然是 `context-voice-input`。

## 总体边界

语音版在编辑器里新增三条工作流：

- 上下文感知语音输入：录音、ASR、LLM 打磨、灰字预览、Tab 接受。
- 音频文件转写：选择或拖入音频文件，按能力规划上传、切段或流式发送，然后插入当前笔记或备用笔记。
- 语音朗读：把选中文本或笔记正文交给 TTS 生成音频，在浮岛中播放、暂停、拖出或保存。

三条工作流共享语音浮岛和状态栏展示，但不共享内部 session。口述输入需要 ASR 后再走打磨模型，音频文件转写做 ASR 和插入，朗读做文本清理、TTS 合成和播放。

## 入口与状态

### `VoiceController`

`src/features/editor/voice/voiceController.ts` 是语音子系统对外的 facade。编辑器命令、浮岛、inline suggestion、Tab completion、音频文件拖入和朗读入口都通过它交互。

它持有三类 controller / workflow：

- `ContextVoiceInputWorkflow`：口述输入。
- `AudioFileTranscriptionController`：音频文件转写。
- `ReadAloudController`：语音朗读。

`VoiceController` 自己只维护外部可观察的 `VoiceInputStatus`，并把状态广播给浮岛。这样 UI 不需要知道 ASR、TTS、文件插入或打磨调用的内部细节。

### 状态类型

`src/features/editor/voice/voiceStatus.ts` 定义统一状态。主要状态包括：

- `idle`：没有语音任务。
- `recording`、`transcribing`、`polishing`、`ready`：口述输入状态。
- `checking`、`confirm-plan`、`preparing`、`uploading`、`inserting`：音频文件转写状态。
- `read-aloud-preparing`、`read-aloud-confirm`、`read-aloud-synthesizing`、`read-aloud-playing`、`read-aloud-paused`、`read-aloud-failed`、`read-aloud-completed`：朗读状态。

`src/features/editor/voice/voiceModes.ts` 定义浮岛可见模式。浮岛只根据模式和状态决定展示，不直接执行工作流逻辑。

### 设置入口和模式可用性

设置页拆成两层：

- `src/components/settings/tabs/ModelsTab.tsx` 挂载 `AsrProvidersSection` 和 `TtsProvidersSection`，只负责 ASR / TTS 提供商配置。
- `src/components/settings/tabs/VoiceTab.tsx` 挂载 `VoiceFloatingIslandSettingsSection`、`ContextVoiceInputSection`、`AudioFileTranscriptionSection` 和 `VoiceReadAloudSection`，只负责各语音工作流如何使用这些配置。

这对应用户侧“先在模型页创建提供商，再在语音页选择工作流配置”的操作顺序。`voiceModes.ts` 定义运行时模式集合，`setting.types.ts` 中的 `VOICE_FLOATING_MODE_IDS` 定义设置 schema 可保存的模式集合；新增浮岛模式时两边都要同步。浮岛展示前还会结合 ASR / TTS 是否已配置、对应工作流是否启用来决定入口是否可用。ASR / TTS 提供商列表会显示当前被口述、文件转写或朗读使用的标记，避免用户误删正在使用的配置。

## 语音浮岛

`src/features/editor/voice/floating-island/voiceFloatingIslandController.ts` 提供编辑器底部的统一入口：

- 可隐藏的常驻浮岛，显示麦克风、音频文件和朗读等模式。
- 支持点按录音和长按录音。
- 录音期间显示波形、时长和状态。
- 处理期间显示转写、打磨、上传、朗读等进度。
- 口述结果进入 `ready` 后，浮岛和灰字预览共同提示用户接受或取消。
- 音频文件转写进入 `confirm-plan` 后，浮岛展示执行计划摘要并等待确认。
- 朗读状态中展示当前段落、播放进度、暂停/继续和可拖出的生成音频。

浮岛需要处理 Obsidian pop-out 窗口。长按模式的 pointer 事件绑定到当前窗口的 `document`，否则弹出窗口中松开鼠标时无法正常结束录音。

浮岛设置单独由 `VoiceFloatingIslandSettingsSection` 管理，包括是否显示浮岛、底部距离、模式顺序和隐藏模式。这样“入口长什么样”和“工作流是否启用”不会混在同一个设置块里。

## 上下文感知语音输入

### 主流程

`src/features/editor/voice/context-input/contextVoiceInputWorkflow.ts` 管理口述 session：

1. 捕获当前 Markdown view、EditorView、光标 offset、选区和文件路径。
2. 启动 `voiceInputRecorder.ts` 录音。
3. 停止录音后调用 ASR。
4. 构造打磨 prompt，调用 LLM 辅助请求。
5. 解析模型输出并生成灰字预览。
6. Tab 或浮岛确认后按 `action` 插入文本。
7. Esc、命令面板或浮岛取消时清理录音、请求、灰字和状态。

连续听写由同一个 workflow 控制。接受上一段后如果启用了自动续录，会重新进入录音状态。点按听写录音期间，用户移动光标或编辑正文时会经过 200ms 防抖软重启：取消当前录音和未接受预览，再在新的光标位置重新开始录音；停止录音后的草稿阶段仍要求文件、选区和光标锚点保持一致，锚点失效时取消当前草稿。

快速连续片段不会为每个停顿都立即打一次 LLM。每段录音先进入 `pendingSegments`，ASR 可以和上一段打磨并行；如果新片段到达时上一段打磨仍在进行，会等待 `MERGE_WAIT_FOR_INFLIGHT_MS`，必要时中止当前打磨，把原始转写放回队列头，再用合并后的文本重新打磨，减少快速听写时的重复请求。

### 录音

`voiceInputRecorder.ts` 封装浏览器录音能力：

- 申请麦克风权限并支持选择输入设备。
- 使用 `MediaRecorder` 生成浏览器可用音频。
- 在需要 PCM 的路径中通过 AudioWorklet 采集 PCM16。
- 维护最大录音时长，避免长时间录音造成内存和上传风险。
- 把权限错误、设备错误和停止错误统一转换为口述 workflow 可展示的错误。

点按听写的 VAD 不在 recorder 内部，而在浮岛监听同一条 `MediaStream`。`voiceFloatingIslandController.ts` 用 waveform analyser 计算 RMS dB，先用 `vadSpeechStartDecibels` 判断是否已经听到语音，再用 `vadSilenceDecibels + vadSilenceHoldMs` 判断是否自动切段。`ContextVoiceDecibelMeter.tsx` 复用同一套 dB 公式，在设置页本地监听麦克风并标出语音开始和静音阈值，帮助用户调参；音频不会被录制或发送。

### ASR 调用

ASR 提供商统一在 `src/core/asr/` 下：

- `manager.ts` 解析当前启用的 ASR 配置并选择 adapter。
- `types.ts` 定义短音频、长音频、WebSocket、结果片段、说话人和时间戳等共享类型。
- `capabilities.ts` 记录本地能力提示，用于判断音频文件能否直接上传、切段或流式发送。
- `httpTransport.ts` 和 `nodeHttpTransport.ts` 处理 HTTP 请求。桌面环境优先用 Node 传输以减少 CORS 问题；不可用时回退浏览器 fetch 或 Obsidian requestUrl。
- `audioTranscode.ts` 负责 WebM/Opus 到 WAV 或 PCM16 的转码，兼容不接受浏览器原生格式的服务端。

短音频 HTTP adapter 位于 `src/core/asr/httpAsr/`：

- `openAiTranscriptionAdapter.ts`：OpenAI-compatible `/audio/transcriptions`。
- `openAiChatAudioAdapter.ts`：把音频作为 chat completions 输入。

长音频 HTTP adapter 位于同一目录：

- `funasrLocalAdapter.ts`：本地 FunASR。
- `deepgramPreRecordedAdapter.ts`：Deepgram pre-recorded。
- `tencentFlashAdapter.ts`：腾讯云极速版，包含签名逻辑。

WebSocket ASR 位于 `src/core/asr/webSocketAsr/`：

- `index.ts` 根据协议选择 adapter。
- `deepgramAdapter.ts` 处理 Deepgram-compatible 帧、final/partial 事件和结束消息。
- `whisperLiveKitAdapter.ts` 处理 WhisperLiveKit 原生 `/asr` 协议。
- `common.ts` 共享 URL 构造、WebSocket 创建、错误归并和帧解析。

浏览器 WebSocket 不能自定义 `Authorization` header，因此 Deepgram-compatible 路线使用协议字段携带 token。

### 配置测试与传输模式

`AsrConfigFormModal.tsx` 会用表单中的未保存字段直接构造临时 ASR 提供商做测试，避免用户为了试错 URL、密钥、模型或音频格式而先保存无效配置。短音频 HTTP 配置录制固定长度样本后提交；WebSocket 配置启动实时流式测试，用户点击停止后再结束 session。测试关闭或字段变化时会取消 recorder 和 streaming session，避免后台连接残留。

HTTP ASR 的传输模式由 `httpTransport.ts` 统一处理：

- `auto`：桌面端优先 Node fetch，遇到可重试网络或 CORS 错误再回退浏览器 fetch；移动端优先浏览器 fetch，再回退 Obsidian `requestUrl`。
- `node`：桌面端固定使用 Node fetch，移动端没有 Node 运行时则走移动端自动路径。
- `browser`：固定使用浏览器 fetch / XHR，适合需要原生浏览器请求行为的端点。
- `obsidian`：固定使用 Obsidian `requestUrl`，但它不能真正中止请求，调用方只能在返回后检查 abort 状态。

TTS 的 HTTP 传输在 `src/core/tts/httpTransport.ts` 中复用主 LLM 请求传输策略。TTS 配置弹窗会用当前表单字段生成一段测试音频，并在支持 `setSinkId` 的环境中应用用户选择的输出设备；不支持或设备失效时回到系统默认输出，不让扬声器选择阻断播放。

### 打磨 prompt

`voicePromptBuilder.ts` 构造打磨模型输入。消息顺序是：

1. `system` message：系统提示词预设或自定义系统提示词。
2. `user` message 中的 `<target_metadata>`：当前文件路径和标题。
3. 可选 `<document_summary>`：当前文档摘要。
4. 可选 `<asr_hot_words>`：从摘要调用中提取的 ASR 热词。
5. `<cursor_before>`：光标前窗口。
6. 可选 `<cursor_after>`：光标后窗口；如果只有空白会省略，避免模型误判插入位置。
7. 可选 `<current_selection>`：当前选区。
8. 可选 `<previous_model_output>`：上一段已打磨草稿。
9. `<current_asr_final>`：本段 ASR 原始文本。

这个顺序是有意固定的：文件元信息、摘要和热词放在 user message 前部，光标前文再尽量复用已记录的前文锚点，变化最大的上一段草稿和本段 ASR 放在末尾。这样连续听写时，提供商的自动前缀缓存或显式 `cache_control` 更容易命中前面的稳定字节。

打磨模型通过结构化 JSON 输出：

- `action: insert_at_cursor`：插入到光标。
- `action: replace_selection`：替换当前选区。
- `action: insert_after_selection`：插入到选区之后。
- `text`：准备落笔的文本。
- `notice`：用于取消、提醒或说明无法生成正文的情况。

`voiceDecisionParser.ts` 严格解析这些字段，避免把无效 JSON、额外上下文或模型解释文字直接写入编辑器。`voiceDecisionBoundaryFallback.ts` 负责一些确定性的边界修正，例如光标处标点和前导空格处理，让模型专注于 ASR 清理和上下文改写。（部分模型不擅长此类处理，增加大量系统提示词才能稳定）

### 灰字预览与 Tab 接受

语音结果不会直接写入正文，而是复用 inline suggestion 的灰字通道：

- `src/features/editor/inline-suggestion/inlineSuggestion.ts` 增加语音来源的视觉层级。
- `inlineSuggestionController.ts` 在语音 session 活跃时保留草稿，不因普通失焦立即清除。
- `ContextVoiceInputWorkflow.tryAcceptFromView()` 接管 Tab 接受。
- `ContextVoiceInputWorkflow.tryRejectFromView()` 接管 Esc 取消。
- `src/features/editor/tab-completion/tabCompletionController.ts` 在语音 session 活跃时暂停 Tab completion，避免同一个 Tab 同时接受补全和语音草稿。

这个设计让用户只需要理解“灰字 + Tab”的编辑器语义。ASR 或打磨出错时，正文仍然保持未修改状态。移动端仍可通过浮岛按钮接受打磨后的文字。

### 前缀缓存

`voicePrefixCacheManager.ts` 解决连续听写时 prompt cache 命中率低的问题。

如果每次都从“当前光标向前 N 字符”截取前文，用户每接受一段文本，slice 起点都会移动，请求开头的字节也会改变。OpenAI / DeepSeek 这类自动 prefix cache 和 Anthropic 显式 cache control 都依赖请求开头连续字节稳定，因此这种固定窗口会让缓存频繁失效。

当前实现为每个文件维护最多 4 个前文锚点，按 LRU 淘汰：

- 第一次打磨或没有合法锚点时记录新的 `prefixStart`，初始窗口长度来自 `contextRangeChars`。
- 每个锚点保存 `prefixStart` 附近的原始 anchor bytes，后续直接比较同一窗口内容。
- 后续打磨直接发送 `doc.slice(prefixStart, cursor)`，让请求开头保持稳定并随着写作向后增长。
- 当多个锚点都合法时选择 `prefixStart` 最小的锚点，也就是最长、最利于 cache 的前文 slice。
- 当用户跳到另一个远距离区域时创建新锚点；返回旧区域时，只要旧锚点仍在 4 个 slot 内且 anchor bytes 未漂移，就能继续命中。
- 当光标移动到锚点之前、前文超过安全上限、或锚点窗口内容漂移时，该锚点不再合法并触发重锚。

锚点窗口只检测 anchor 附近内容是否漂移，不主动检测 slice 中部编辑。这样中部修改后仍可能获得“修改点之前”的部分 prefix cache 命中；如果强行重锚，反而会让整段前文从缓存角度变成冷启动。

光标后文不做同类锚点。原因是后文位于 prompt 较后位置，前文增长后它不再属于请求 common prefix；强行为后文稳定字节并不能带来有效缓存命中，反而会让光标回退编辑时的语义更难维护。

### 文档摘要与热词

`documentSummaryManager.ts` 维护内存级文档摘要和热词：

- 按文件路径缓存，不写入 vault。
- 默认 `smart` 刷新：没有固定 TTL，而是比较当前文档和已摘要文本的重叠字符片段特征，用一个轻量文本相似度指纹判断内容漂移。
- 支持会话级、15 分钟和 1 小时等非智能刷新策略。
- 文件 rename / delete 时清理缓存。
- 录音开始时可后台预热。
- 打磨调用不等待摘要完成。摘要未准备好时，主口述路径继续执行。

`smart` 模式把内容变化分成三类：`fresh` 直接复用旧摘要；`soft-stale` 后台刷新但继续服务旧摘要；`hard-stale` 后台刷新并暂时返回 `null`，避免把明显过期的摘要传给打磨模型。长文只截取前 `MAX_SUMMARY_INPUT_CHARS` 做摘要，摘要和热词是提示信息，不作为全文事实来源。

摘要用于让打磨模型知道当前笔记主题和写作风格；热词用于修正 ASR 容易听错的专有名词。后续可以考虑对接 ASR 提供商原生支持 vocabulary hint，把热词传给 ASR 端，但打磨 prompt 中的热词仍应作为备用路径。

## 音频文件转写

### 入口和规划

`src/features/editor/voice/audio-file-transcription/audioFileTranscriptionController.ts` 负责用户入口和状态：

1. 检查语音输入和音频文件转写是否启用。
2. 捕获当前编辑器、文件路径和插入锚点。
3. 调用 `inspectAndPlanAudioFileTranscription()` 检查文件大小、格式、时长和 ASR 能力。
4. 进入 `confirm-plan`，让用户确认直传、切段、长音频上传或 WebSocket 流式方案。
5. 用户确认后执行计划并按进度更新浮岛。
6. 将结果按顺序插入当前笔记；插入目标失效时写入备用 Markdown。

`audioFileSource.ts` 把本地 `File` 和 vault 文件统一为可读取的音频来源，外部拖入和 Obsidian 内部文件拖入都会走同一套 source 接口。`audioFileInspector.ts` 负责文件元数据识别，优先用浏览器音频元数据探测，再用容器头补充 WAV / m4a / mp4 的时长和 `moov` 位置。`audioFileChunker.ts` 负责本地切段。

规划阶段会先按 ASR 能力判断能否直传；需要切段或 PCM 流式时才尝试本地解码。这样浏览器不能解码但提供商可以直接读取的文件，不会因为本地解码失败而被误判为不可转写。

### 执行路线

`audioFileTranscriptionService.ts` 维护执行计划和结果排序：

- `direct-upload`：文件在能力限制内，直接提交给短音频 HTTP ASR。
- `chunked-upload`：本地切段后并发上传，结果按 chunk 顺序合并。
- `long-audio-upload`：交给固定长音频 adapter。
- `websocket-stream`：把音频按设定速率流式发送给 WebSocket ASR。

切段路线会去除相邻 chunk 边界的重复文本。WebSocket 路线支持 partial 结果替换前一段临时文本，final 结果到达后再稳定插入。

音频文件转写有几类显式保护：

- 本地 WAV / PCM 发送会先按时长估算请求体大小，超过安全时长时提示切换到支持长音频文件的 ASR 配置。
- 切段上传受 `maxConcurrentChunks`、`chunkStartStaggerMs` 和 `chunkOverlapMs` 控制，避免一次性把所有切片同时压给远端。
- 如果文件过大且浏览器无法本地解码，不强行切段；规划阶段会给出原因，并提示切换到支持长音频文件的 ASR 配置。
- WebSocket 文件流式对 PCM / WAV 大文件有保护；m4a / mp4 的 `moov` 在文件尾部时不直接按原文件流式发送，避免接收端拿不到必要头信息。
- 运行期失败会给出“缩短切段时长”的提示，便于区分提供商请求大小限制和真正的协议错误。

### 插入与备用笔记

转写 controller 持有 `anchorOffset` 和 `appendOffset`。编辑器内容变动时通过 CodeMirror `ChangeDesc.mapPos()` 更新锚点，尽量把转写结果插到用户开始任务的位置。

如果当前编辑器不可用、offset 转换失败或插入失败，转写结果写入备用 Markdown：

- 路径来自 `audioFileFallbackNotePathTemplate`。
- 模板支持日期、时间、原文件名和不带扩展名的 basename。
- 第一次备用写入直接创建包含转写文本的文件，避免“先建空文件、再追加”带来的二次失败窗口。

## 语音朗读

### 文本整理

`src/features/editor/voice/read-aloud/readAloudController.ts` 处理朗读 session。它从当前选区或笔记正文捕获文本，再交给 `readAloudText.ts`：

- 朗读当前选区时会规整换行和空白。
- 朗读 Markdown 时可按“Markdown 模式”设置选择“可读”或“原始 Markdown”。
- 长文本会按目标字符数和 TTS 提供商能力切段。
- 多段朗读会进入确认状态，避免用户误把整篇长文提交给 TTS（对并发亦有控制）。

### TTS 合成与播放

TTS 提供商位于 `src/core/tts/`：

- `manager.ts` 解析当前启用的 TTS 配置。
- `openAiCompatibleSpeech.ts` 处理 OpenAI-compatible speech。
- `dashscopeCosyVoice.ts` 处理 DashScope CosyVoice。
- `mimoChatAudioTts.ts` 处理 MiMo chat-audio TTS。
- `httpTransport.ts` 复用与 ASR 类似的请求传输策略。
- `audioOutput.ts` 在浏览器支持时应用用户选择的输出设备。

朗读 controller 会缓存同一配置和文本生成出的音频，减少重复合成。播放时会生成小型 waveform peaks；过大的音频跳过解码，避免把长音频展开成完整 PCM 后滞留内存。

缓存 key 包含 TTS 配置 id、格式、端点、模型、音色、输出格式、语速、采样率和文本，避免不同提供商或音色复用到错误音频。多段朗读会按设置延迟预加载后续段落；取消或 session 结束时清理预加载 timer、object URL 和当前 abort controller。

播放时 `readAloudController.ts` 会尝试把 `HTMLAudioElement` 切到设置中的输出设备。浏览器不支持 `setSinkId`、设备已经失效或权限不足时只记录警告并继续播放系统默认输出。

### 生成音频保存和拖出

`generatedAudioStore.ts` 将生成音频保存到 vault 内目录。保存目录、是否自动保存由设置控制。`generatedAudioDragSource.ts` 把最近生成并保存的音频写入拖拽数据，让用户可以从浮岛拖出音频文件。

自动保存失败不会让朗读本身失败；controller 会记录失败并继续播放，避免文件系统问题阻断已经完成的 TTS 合成。

## 设置与迁移

### 设置结构

`src/settings/schema/setting.types.ts` 新增 `contextVoiceInputOptions`。核心字段包括：

- 浮岛开关、模式顺序和隐藏模式。
- ASR 配置列表 `asrConfigs` 和当前口述 ASR。
- TTS 配置列表 `ttsConfigs` 和当前朗读 TTS。
- 打磨模型、temperature、系统提示词模式和自定义提示词。
- 音频文件转写开关、当前文件转写 ASR、切段参数、备用路径模板和元数据输出模式。
- 朗读开关、来源模式、切段长度、预加载段数、缓存、自动保存和 Markdown 处理模式。
- 初始前文窗口、后文窗口、最大录音时长、VAD 阈值、麦克风、TTS 输出设备和浮岛底部距离。
- 文档摘要开关和刷新策略。

设置页要保持“提供商配置”和“工作流选择”分离。用户先在 **模型 → 语音识别 (ASR)** 和 **模型 → 语音生成（TTS）** 中创建 ASR / TTS 提供商，再在 **语音** 设置页选择口述、文件转写和朗读当前使用哪一条。

### 迁移

`src/settings/schema/migrations/67_to_68.ts` 将语音设置落到最终列表形态：

- 没有语音设置时写入默认值。
- 已经是最终形态时保留有效值，不覆盖用户配置。
- 开发期旧 ASR profile 能映射时转换为 `asrConfigs + activeAsrConfigId`。
- 对数值范围做 clamp，避免旧配置或异常配置进入运行时。
- 移除开发期字段，防止后续逻辑继续读取被废弃的配置形态。

迁移文件带有测试 `67_to_68.test.ts`。后续合入主线或上游新版本时，如果迁移编号发生冲突，会顺延本分支语音迁移。

## 与既有功能的交互

### 辅助 LLM 调用

`src/core/ai/single-turn.ts` 和 LLM adapter 支持辅助调用元信息。语音打磨调用会显式使用低延迟参数，并强制 `reasoningLevel: 'off'`。

这个取舍是为了避免某些默认启用 thinking 的模型在轻量改写任务上先长时间思考再输出 JSON。语音打磨、Tab 补全、标题生成等辅助任务都需要“尽快给出可用结果”，不适合继承聊天主流程的推理默认值。

`src/core/llm/debugCapture.ts` 会记录辅助调用的元信息在控制台输出，便于排查打磨 prompt 的 token 使用和 cache 命中情况。

### 主入口

`src/main.ts` 动态导入语音子系统：

- 未使用语音功能时，不把语音模块放进插件加载关键路径。
- 注册开始/停止录音、取消语音任务、音频文件转写和朗读相关命令。
- 监听 active leaf、编辑器变化、设置变化、文件 rename / delete 和插件卸载。
- 文件 rename / delete 时清理文档摘要和前缀缓存。

### 样式和本地化

`src/styles/editor/voice-input.css` 定义浮岛、波形、状态、灰字层级和设置页布局，`src/styles/index.css` 聚合后生成 `styles.css`。

`src/i18n/*` 新增程序内文案。


## 测试覆盖

当前语音相关测试分布在实现模块旁边：

- `contextVoiceInputWorkflow.test.ts`：口述 session、灰字、接受/取消和错误清理。
- `voicePromptBuilder.test.ts`：prompt 输入拼接和上下文字段。
- `voiceDecisionParser.test.ts`、`voiceDecisionBoundaryFallback.test.ts`：模型输出解析与边界修正。
- `voicePrefixCacheManager.test.ts`：多锚点 LRU、重锚、漂移检测和跨文件隔离。
- `documentSummaryManager.test.ts`：摘要 smart 刷新的内容漂移分类。
- `audioFileTranscriptionService.test.ts`、`audioFileTranscriptionController.test.ts`、`audioFileInspector.test.ts`、`audioFileChunker.test.ts`：文件转写规划、切段、插入和备用写入。
- `readAloudText.test.ts`、`generatedAudioStore.test.ts`、`generatedAudioDragSource.test.ts`：朗读文本整理、保存和拖拽。
- `src/core/asr/**/*.test.ts`：ASR adapter、能力判断、转码和 WebSocket 协议。
- `src/core/tts/**/*.test.ts`：TTS adapter、配置校验和工具函数。
- `src/settings/schema/migrations/67_to_68.test.ts`：语音设置迁移。

提交前的聚焦检查通常包括语音相关 Jest 和 TypeScript 检查。完整发布前还应运行构建，并由人工在 Obsidian 测试 vault 中确认录音、转写、朗读和手动安装包。

## 后续可扩展点

- Chat 输入框等其它功能复用语音能力。
- ASR vocabulary hint：把摘要热词传给原生支持 hint 的服务端，同时保留打磨 prompt 热词。
- 上下文缓存扩展：当前缓存聚焦光标前文锚点。若未来要把光标后文、文档摘要或多个远端片段也纳入缓存，需要先固定提示词中的片段顺序和片段含义，避免模型误判插入位置或引用过期内容。
- 新增 ASR 提供商：在 `src/core/asr/` 增加 adapter，补充 capability、配置表单字段和测试。
- 新增 TTS 提供商：在 `src/core/tts/` 增加 adapter，补充配置校验、输出格式处理和测试。
