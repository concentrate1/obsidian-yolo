import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const releaseRepository = 'concentrate1/obsidian-yolo'
const artifactNames = ['main.js', 'manifest.json', 'styles.css']

function fail(message) {
  throw new Error(`[release:voice:sync-artifacts] ${message}`)
}

function runGh(args) {
  const result = spawnSync('gh', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
    stdio: 'pipe',
  })
  if (result.error) {
    fail(`Unable to run gh: ${result.error.message}`)
  }
  if (result.status !== 0) {
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
    fail(output || `gh ${args.join(' ')} failed`)
  }
  return (result.stdout ?? '').trim()
}

async function readDefaultTag() {
  const manifest = JSON.parse(
    await readFile(join(repoRoot, 'manifest.json'), 'utf8'),
  )
  return typeof manifest.version === 'string' ? manifest.version.trim() : ''
}

function parseArgs(argv) {
  if (argv.length > 1) {
    fail('Usage: npm run release:voice:sync-artifacts -- [version]')
  }
  const tag = argv[0]?.trim() ?? ''
  if (tag.startsWith('-')) {
    fail('Release version cannot start with a dash')
  }
  return tag
}

function parseRelease(raw, expectedTag) {
  let release
  try {
    release = JSON.parse(raw)
  } catch {
    fail('gh returned invalid Release metadata')
  }
  if (release.tagName !== expectedTag || release.isDraft === true) {
    fail(`Release ${expectedTag} is missing or still a draft`)
  }
  if (!Array.isArray(release.assets)) {
    fail(`Release ${expectedTag} has no asset metadata`)
  }

  const assets = new Map(release.assets.map((asset) => [asset.name, asset]))
  for (const name of artifactNames) {
    const asset = assets.get(name)
    if (
      !asset ||
      asset.state !== 'uploaded' ||
      !Number.isSafeInteger(asset.size) ||
      asset.size <= 0
    ) {
      fail(`Release ${expectedTag} is missing a complete ${name} asset`)
    }
  }
  return assets
}

async function sha256(path) {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex')
}

async function verifyDownloadedArtifacts(stagingDir, tag, assets) {
  for (const name of artifactNames) {
    const path = join(stagingDir, name)
    const details = await stat(path)
    const asset = assets.get(name)
    if (!details.isFile() || details.size !== asset.size) {
      fail(`${name} does not match the Release asset size`)
    }

    const digest =
      typeof asset.digest === 'string'
        ? asset.digest.match(/^sha256:([a-f0-9]{64})$/i)?.[1]
        : undefined
    if (digest && (await sha256(path)) !== digest.toLowerCase()) {
      fail(`${name} does not match the Release SHA-256 digest`)
    }
  }

  const manifest = JSON.parse(
    await readFile(join(stagingDir, 'manifest.json'), 'utf8'),
  )
  if (manifest.id !== 'yolo' || manifest.version !== tag) {
    fail(`Downloaded manifest.json does not identify YOLO ${tag}`)
  }

  const styles = await readFile(join(stagingDir, 'styles.css'), 'utf8')
  if (!styles.startsWith(`/* @yolo-version: ${tag} */`)) {
    fail(`Downloaded styles.css does not contain the ${tag} build banner`)
  }
}

async function main() {
  const requestedTag = parseArgs(process.argv.slice(2))
  const tag = requestedTag || (await readDefaultTag())
  if (!tag) fail('No Release version was provided or found in manifest.json')

  const metadata = runGh([
    'release',
    'view',
    tag,
    '--repo',
    releaseRepository,
    '--json',
    'tagName,isDraft,assets',
  ])
  const assets = parseRelease(metadata, tag)

  const temporaryRoot = join(repoRoot, 'temporary')
  await mkdir(temporaryRoot, { recursive: true })
  const stagingDir = await mkdtemp(join(temporaryRoot, 'voice-release-'))

  try {
    runGh([
      'release',
      'download',
      tag,
      '--repo',
      releaseRepository,
      '--pattern',
      'main.js',
      '--pattern',
      'manifest.json',
      '--pattern',
      'styles.css',
      '--dir',
      stagingDir,
    ])
    await verifyDownloadedArtifacts(stagingDir, tag, assets)

    // Validate every remote artifact before replacing any local build output.
    for (const name of artifactNames) {
      await copyFile(join(stagingDir, name), join(repoRoot, name))
      console.log(`[release:voice:sync-artifacts] Replaced ${name}`)
    }
    console.log(
      `[release:voice:sync-artifacts] Synced ${tag} from ${releaseRepository}.`,
    )
  } finally {
    // Only remove the unique staging directory created by this invocation.
    await rm(stagingDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
