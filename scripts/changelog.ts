import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generate } from 'changelogithub'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  execSync('pnpm pkg get version --json').toString().trim(),
)
const version = pkg.version

// 检查是否存在版本标签
function checkTagExists(tag: string): boolean {
  try {
    execSync(`git rev-parse ${tag}`, { stdio: 'ignore' })
    return true
  }
  catch {
    return false
  }
}

async function run() {
  // 确定 from 参数
  let fromParam: string | undefined = `v${version}`

  // 检查版本标签是否存在
  if (!checkTagExists(fromParam)) {
    // 如果是第一个版本，则不指定 from 参数，从第一个提交开始
    fromParam = undefined
    console.log('No previous version tag found. Generating changelog from the beginning.')
  }

  const { md: changelog } = await generate({
    name: 'vue-dndnr',
    repo: 'simon1uo/vue-dndnr',
    from: fromParam,
    to: 'main',
    emoji: true,
    capitalize: true,
    group: true,
    types: {
      feat: { title: '🚀 Features' },
      fix: { title: '🐛 Bug Fixes' },
      perf: { title: '⚡ Performance' },
      refactor: { title: '♻️ Refactors' },
      docs: { title: '📝 Documentation' },
      build: { title: '📦 Build' },
      types: { title: '🏷️ Types' },
      chore: { title: '🧹 Chore' },
      test: { title: '✅ Tests' },
      style: { title: '💄 Styles' },
    },
  })

  if (changelog) {
    const changelogPath = path.resolve(__dirname, '../CHANGELOG.md')
    let newChangelog = ''

    try {
      // 尝试读取现有的 CHANGELOG.md 文件
      const currentChangelog = execSync(`cat ${changelogPath}`).toString()
      // 将新的 changelog 添加到现有文件的顶部
      newChangelog = `# Changelog\n\n## v${version}\n\n${changelog}\n\n${currentChangelog.replace('# Changelog\n\n', '')}`
    }
    catch {
      // 如果文件不存在，创建一个新的 CHANGELOG.md
      console.log('No existing CHANGELOG.md found. Creating a new one.')
      newChangelog = `# Changelog\n\n## v${version}\n\n${changelog}`
    }

    writeFileSync(changelogPath, newChangelog, 'utf8')
    console.log(`Changelog for v${version} generated successfully!`)

    // 输出 changelog 内容，用于 GitHub Release
    console.log(changelog)
    return changelog
  }

  console.log('No changes found to generate changelog.')
  return ''
}

run()
