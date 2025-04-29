import { execSync } from 'node:child_process'
import process from 'node:process'
import colors from 'picocolors'
import prompts from 'prompts'

const currentVersion = JSON.parse(
  execSync('pnpm pkg get version --json').toString().trim(),
).version

const versionIncrements = [
  'patch',
  'minor',
  'major',
  'prepatch',
  'preminor',
  'premajor',
  'prerelease',
]

function inc(i) {
  return execSync(`npm --no-git-tag-version version ${i}`).toString().trim()
}

function run(cmd, args) {
  return execSync(`${cmd} ${args.join(' ')}`, { stdio: 'inherit' })
}

const step = msg => console.log(colors.cyan(msg))

async function main() {
  let targetVersion

  const { release } = await prompts({
    type: 'select',
    name: 'release',
    message: 'Select release type',
    choices: versionIncrements
      .map(i => `${i} (${inc(i)})`)
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
    targetVersion = inc(release)
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
  run('pnpm', ['build'])

  // 更新版本
  step('\nUpdating version...')
  run('npm', ['--no-git-tag-version', 'version', targetVersion])

  // 生成 changelog
  step('\nGenerating changelog...')
  try {
    run('pnpm', ['changelog'])
  }
  catch {
    console.log(colors.yellow('Changelog generation failed, skipping...'))
  }

  // 提交更改
  step('\nCommitting changes...')
  run('git', ['add', '-A'])
  run('git', ['commit', '-m', `release: v${targetVersion}`])

  // 创建标签
  step('\nCreating tag...')
  run('git', ['tag', `v${targetVersion}`])

  // 推送到远程
  const { pushRemote } = await prompts({
    type: 'confirm',
    name: 'pushRemote',
    message: 'Push to remote?',
  })

  if (pushRemote) {
    step('\nPushing to remote...')
    run('git', ['push', 'origin', 'main'])
    run('git', ['push', 'origin', `v${targetVersion}`])
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
