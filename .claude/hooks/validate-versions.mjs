import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const PKG_MAP = {
  shared:       { dir: 'shared',       short: 'shared' },
  'netior-core':  { dir: 'netior-core',  short: 'core' },
  'netior-mcp':   { dir: 'netior-mcp',   short: 'mcp' },
  'narre-server': { dir: 'narre-server', short: 'narre-server' },
  'desktop-app':  { dir: 'desktop-app',  short: 'desktop-app' },
  'narre-eval':   { dir: 'narre-eval',   short: 'narre-eval' },
};

// Ordered for consistent output
const SHORT_ORDER = ['shared', 'core', 'mcp', 'narre-server', 'desktop-app', 'narre-eval'];

try {
  const root = process.cwd();
  const versionsPath = join(root, '.claude', 'rules', 'versions.md');

  // 1. Collect actual state from package.json + changelog frontmatter
  const actual = {};

  for (const [, { dir, short }] of Object.entries(PKG_MAP)) {
    // Read package.json version
    const pkgPath = join(root, 'packages', dir, 'package.json');
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const version = pkg.version || '0.0.0';

    // Find latest changelog
    let summary = '초기 버전';
    let type = 'patch';
    const changelogDir = join(root, 'changelog', short);
    if (existsSync(changelogDir)) {
      const files = readdirSync(changelogDir)
        .filter(f => /^v\d+\.\d+\.\d+\.md$/.test(f))
        .sort((a, b) => {
          const pa = a.slice(1, -3).split('.').map(Number);
          const pb = b.slice(1, -3).split('.').map(Number);
          for (let i = 0; i < 3; i++) {
            if (pb[i] !== pa[i]) return pb[i] - pa[i];
          }
          return 0;
        });

      if (files.length > 0) {
        const content = readFileSync(join(changelogDir, files[0]), 'utf-8');
        const fm = parseFrontmatter(content);
        if (fm.summary) summary = fm.summary;
        if (fm.type) type = fm.type;
      }
    }

    actual[short] = { version, type, summary };
  }

  // 2. Read current versions.md
  let currentYaml = {};
  if (existsSync(versionsPath)) {
    const content = readFileSync(versionsPath, 'utf-8');
    currentYaml = parseVersionsYaml(content);
  }

  // 3. Compare and update if needed
  let needsUpdate = false;
  for (const short of SHORT_ORDER) {
    if (!actual[short]) continue;
    const cur = currentYaml[short] || {};
    if (cur.version !== actual[short].version || cur.type !== actual[short].type || cur.summary !== actual[short].summary) {
      needsUpdate = true;
      break;
    }
  }

  if (needsUpdate) {
    const yaml = buildVersionsYaml(actual);
    const md = `# Package Versions\n\n\`\`\`yaml\n${yaml}\`\`\`\n`;
    writeFileSync(versionsPath, md, 'utf-8');
  }
} catch {
  // Hook must never fail — always exit 0
}

process.exit(0);

// --- Helpers ---

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*"(.+?)"\s*$/);
    if (m) {
      result[m[1]] = m[2];
    } else {
      const m2 = line.match(/^(\w[\w-]*):\s*(.+?)\s*$/);
      if (m2) result[m2[1]] = m2[2];
    }
  }
  return result;
}

function parseVersionsYaml(content) {
  const match = content.match(/```yaml\n([\s\S]*?)```/);
  if (!match) return {};
  const result = {};
  let currentPkg = null;
  for (const line of match[1].split('\n')) {
    const pkgMatch = line.match(/^\s{2}(\S+):$/);
    if (pkgMatch) {
      currentPkg = pkgMatch[1];
      result[currentPkg] = {};
      continue;
    }
    if (currentPkg) {
      const valMatch = line.match(/^\s{4}(\w+):\s*"(.+?)"/);
      if (valMatch) {
        result[currentPkg][valMatch[1]] = valMatch[2];
      } else {
        const bareMatch = line.match(/^\s{4}(\w+):\s*(\S+)\s*$/);
        if (bareMatch) result[currentPkg][bareMatch[1]] = bareMatch[2];
      }
    }
  }
  return result;
}

function buildVersionsYaml(packages) {
  let yaml = 'packages:\n';
  for (const short of SHORT_ORDER) {
    if (!packages[short]) continue;
    const { version, type, summary } = packages[short];
    yaml += `  ${short}:\n`;
    yaml += `    version: "${version}"\n`;
    yaml += `    type: ${type}\n`;
    yaml += `    summary: "${summary}"\n`;
  }
  return yaml;
}
