import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateChangelog } from 'changelogithub'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  execSync('pnpm pkg get version --json').toString().trim(),
)
const version = pkg.version

async function run() {
  const changelog = await generateChangelog({
    name: 'vue-dndnr',
    repo: 'simon1uo/vue-dndnr',
    from: `v${version}`,
    to: 'main',
    emoji: true,
    capitalize: true,
    categorize: true,
    categorizeScopes: true,
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
    const currentChangelog = execSync(`cat ${changelogPath}`).toString()

    // 将新的 changelog 添加到现有文件的顶部
    const newChangelog = `# Changelog\n\n## v${version}\n\n${changelog}\n\n${currentChangelog.replace('# Changelog\n\n', '')}`

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
