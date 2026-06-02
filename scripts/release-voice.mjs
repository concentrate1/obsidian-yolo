import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const releaseBranch = 'yolo-unofficial-dev'
const readmeSource = 'doc/readme.md'
const readmeTarget = 'README.md'
const releaseNotesPath = '.github/release-notes/voice-build.md'
const versionFiles = ['manifest.json', 'versions.json', 'package.json']
const voiceManifestUrl =
  'https://raw.githubusercontent.com/concentrate1/obsidian-yolo/yolo-unofficial-dev/manifest.json'
const voiceReleaseApiBase =
  'https://api.github.com/repos/concentrate1/obsidian-yolo/releases/tags'

function fail(message) {
  console.error(`[release:voice] ${message}`)
  process.exit(1)
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: options.capture ? 'pipe' : 'inherit',
  })
  if (result.status !== 0) {
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
    fail(output || `${command} ${args.join(' ')} failed`)
  }
  return (result.stdout ?? '').trim()
}

function parseArgs(argv) {
  let version = ''
  let syncFrom = ''
  let push = true
  let checkOnly = false
  let syncReadmeOnly = false
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--check-only') {
      checkOnly = true
      continue
    }
    if (arg === '--sync-readme-only') {
      syncReadmeOnly = true
      continue
    }
    if (arg === '--no-push') {
      push = false
      continue
    }
    if (arg === '--sync-from') {
      syncFrom = argv[i + 1] ?? ''
      i += 1
      continue
    }
    if (!version) {
      version = arg
      continue
    }
    fail(`Unexpected argument: ${arg}`)
  }
  if (!version && !checkOnly && !syncReadmeOnly) {
    fail(
      'Usage: npm run release:voice -- [--sync-from context-voice-input] [--no-push] <version>',
    )
  }
  if (version && !/-voice(?:\.\d+)?$/.test(version)) {
    fail('Voice release versions must end with -voice or -voice.N')
  }
  if (checkOnly && (version || syncFrom || !push)) {
    fail(
      '--check-only cannot be combined with version, --sync-from, or --no-push',
    )
  }
  if (syncReadmeOnly && (version || syncFrom || !push || checkOnly)) {
    fail(
      '--sync-readme-only cannot be combined with version, --sync-from, --no-push, or --check-only',
    )
  }
  if (syncFrom && syncFrom.startsWith('-')) {
    fail('--sync-from requires a branch name')
  }
  return { version, syncFrom, push, checkOnly, syncReadmeOnly }
}

function assertCleanWorktree() {
  const status = run('git', ['status', '--short'], { capture: true })
  if (status) {
    fail('Working tree is not clean. Commit or stash local changes first.')
  }
}

function assertCurrentBranch() {
  const branch = run('git', ['branch', '--show-current'], { capture: true })
  if (branch !== releaseBranch) {
    fail(`Run this script from ${releaseBranch}; current branch is ${branch}.`)
  }
}

function assertTagIsFree(version) {
  const result = spawnSync(
    'git',
    ['rev-parse', '--quiet', '--verify', `refs/tags/${version}`],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      stdio: 'pipe',
    },
  )
  if (result.status === 0) {
    fail(`Tag already exists locally: ${version}`)
  }
}

function readRelative(path) {
  return readFileSync(resolve(repoRoot, path), 'utf8')
}

function assertNoPlaceholders(label, content) {
  const blocked = ['PR_NUMBER', 'TODO', 'TBD', 'PLACEHOLDER']
  for (const token of blocked) {
    if (content.includes(token)) {
      fail(`${label} still contains placeholder token: ${token}`)
    }
  }
}

function assertReadmeHasRequiredSections(content) {
  const checks = [
    ['非官方说明', /非官方/],
    ['风险提醒', /备份/],
    ['测试状态提醒', /测试/],
    ['互斥安装提醒', /二选一|不要同时安装|不要同时启用/],
    ['手动安装章节', /##\s+手动安装/],
    ['上下文感知语音输入说明', /上下文感知语音输入/],
    ['音频文件转写说明', /音频文件转写/],
    ['语音朗读说明', /语音朗读|TTS/],
    ['语音版本后缀', /-voice/],
    ['发布分支名', /yolo-unofficial-dev/],
    ['release 产物 main.js', /main\.js/],
    ['release 产物 manifest.json', /manifest\.json/],
    ['release 产物 styles.css', /styles\.css/],
    ['配置指南链接', /\.\/docs\/tutorials\/voice\/voice-configuration\.md/],
    ['技术说明链接', /\.\/docs\/technical\/voice-implementation\.md/],
  ]
  for (const [label, pattern] of checks) {
    if (!pattern.test(content)) {
      fail(`${readmeSource} is missing required README coverage: ${label}`)
    }
  }
}

function assertRelativeLinksExist(markdownPath, content) {
  const links = content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)
  for (const match of links) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, '')
    if (
      !rawTarget ||
      rawTarget.startsWith('#') ||
      /^[a-z]+:/i.test(rawTarget)
    ) {
      continue
    }
    const target = rawTarget.split('#')[0]
    if (!target) continue
    // doc/readme.md is a staging copy of the root README; validate links as
    // they will resolve after copying to README.md.
    const absoluteTarget = resolve(repoRoot, target)
    if (!existsSync(absoluteTarget)) {
      fail(`${markdownPath} references a missing relative target: ${rawTarget}`)
    }
  }
}

function assertVoiceUpdateChannel() {
  const updateChecker = readRelative('src/core/update/updateChecker.ts')
  if (!updateChecker.includes(voiceManifestUrl)) {
    fail('updateChecker.ts does not point at the yolo-unofficial-dev manifest.')
  }
  if (!updateChecker.includes(voiceReleaseApiBase)) {
    fail('updateChecker.ts does not fetch fork releases by tag.')
  }
}

function syncReadme() {
  const source = readRelative(readmeSource)
  assertNoPlaceholders(readmeSource, source)
  assertReadmeHasRequiredSections(source)
  assertRelativeLinksExist(readmeSource, source)
  writeFileSync(resolve(repoRoot, readmeTarget), source)
}

function assertReadmeIsSynced() {
  const source = readRelative(readmeSource)
  const target = readRelative(readmeTarget)
  assertNoPlaceholders(readmeSource, source)
  assertReadmeHasRequiredSections(source)
  assertRelativeLinksExist(readmeSource, source)
  if (source !== target) {
    fail(`${readmeTarget} is not synced from ${readmeSource}`)
  }
}

function assertReleaseNotes() {
  const notes = readRelative(releaseNotesPath)
  assertNoPlaceholders(releaseNotesPath, notes)
  assertRelativeLinksExist(releaseNotesPath, notes)
}

const { version, syncFrom, push, checkOnly, syncReadmeOnly } = parseArgs(
  process.argv.slice(2),
)

assertCurrentBranch()
assertVoiceUpdateChannel()
assertReleaseNotes()

if (syncReadmeOnly) {
  syncReadme()
  console.log(`[release:voice] Synced ${readmeTarget} from ${readmeSource}.`)
  process.exit(0)
}

if (checkOnly) {
  assertReadmeIsSynced()
  console.log('[release:voice] Check passed.')
  process.exit(0)
}

assertCleanWorktree()
assertTagIsFree(version)

if (syncFrom) {
  run('git', ['merge', '--ff-only', syncFrom])
  assertCleanWorktree()
}

syncReadme()
run('npm', ['run', 'version', '--', version])

run('git', ['add', readmeTarget, ...versionFiles])
run('git', [
  'commit',
  '-m',
  `\u51c6\u5907\u8bed\u97f3\u7248\u672c\u53d1\u5e03 ${version}`,
])
run('git', ['tag', version])

if (push) {
  run('git', ['push', 'origin', releaseBranch])
  run('git', ['push', 'origin', version])
} else {
  console.log(
    '[release:voice] Created local release commit and tag; push skipped.',
  )
}
