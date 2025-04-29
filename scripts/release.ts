import type { ReleaseType } from 'semver'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import colors from 'picocolors'
import prompts from 'prompts'
import semver from 'semver'

const { version: currentVersion } = JSON.parse(readFileSync('package.json', { encoding: 'utf8' }))

const versionIncrements = [
  'patch',
  'minor',
  'major',
  'prepatch',
  'preminor',
  'premajor',
  'prerelease',
] as const

type VersionIncrement = typeof versionIncrements[number]

function getNewVersion(i: VersionIncrement): string | null {
  return semver.inc(currentVersion, i as ReleaseType)
}

const step = (msg: string): void => console.log(colors.cyan(msg))

async function main() {
  let targetVersion: string

  const { release } = await prompts({
    type: 'select',
    name: 'release',
    message: 'Select release type',
    choices: versionIncrements
      .map(i => `${i} (${getNewVersion(i) || ''})`)
      .map(name => ({ title: name, value: name.split(' ')[0] }))
      .concat([{ title: 'custom', value: 'custom' }]),
  })

  if (release === 'custom') {
    const { version } = await prompts({
      type: 'text',
      name: 'version',
      message: 'Input custom version',
      initial: currentVersion,
    })
    targetVersion = version
  }
  else {
    const newVersion = getNewVersion(release as VersionIncrement)
    if (!newVersion) {
      console.log(colors.red(`Invalid version increment: ${release}`))
      process.exit(1)
    }
    targetVersion = newVersion
  }

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: `Release v${targetVersion}. Confirm?`,
  })

  if (!confirm) {
    return
  }

  // 构建包
  step('\nBuilding package...')
  execSync('pnpm build', { stdio: 'inherit' })

  // 更新版本
  step('\nUpdating version...')
  execSync(`npm --no-git-tag-version version ${targetVersion}`, { stdio: 'inherit' })

  // 提交更改
  step('\nCommitting changes...')
  execSync('git add -A', { stdio: 'inherit' })
  execSync(`git commit -m "release: v${targetVersion}"`, { stdio: 'inherit' })

  // 创建标签
  step('\nCreating tag...')
  execSync(`git tag v${targetVersion}`, { stdio: 'inherit' })

  // 推送到远程
  const { pushRemote } = await prompts({
    type: 'confirm',
    name: 'pushRemote',
    message: 'Push to remote?',
  })

  if (pushRemote) {
    step('\nPushing to remote...')
    execSync('git push origin main', { stdio: 'inherit' })
    execSync(`git push origin v${targetVersion}`, { stdio: 'inherit' })
    console.log(colors.green(`\nPushed, GitHub Actions will handle the release.`))
  }
  else {
    console.log(colors.yellow(`\nRelease prepared locally. Push manually when ready.`))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
