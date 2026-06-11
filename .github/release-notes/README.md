# Release notes 维护说明

语音版 GitHub Release 正文来自本目录下的 `voice-build.md`。Release workflow 只会把这个固定文件写入 GitHub Release，不会根据 tag、提交差异或版本文件自动生成“本次更新”。

每次发布新版前必须先做这几步：

1. 更新 `voice-build.md` 里的 `### 本次更新：<version>`。
2. 根据本次同步的功能、修复和文档变化更新条目，不能沿用上一版内容。
3. 再执行版本 bump、tag 和 push。
4. 发布完成后，用 `gh release view <version> --repo concentrate1/obsidian-yolo --json body,url` 或网页确认远端 Release 正文。

如果发布后才发现正文落后，补救流程是先提交 `voice-build.md` 修正，再运行：

```powershell
gh release edit <version> --repo concentrate1/obsidian-yolo --title "<version>" --notes-file .github/release-notes/voice-build.md
```

不需要重打 tag，也不需要重新上传产物。
