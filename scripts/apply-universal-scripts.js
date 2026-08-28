/**
 * Expert IELTS — Universal Scripts Injector & Backup Runner
 * Links Quick Search, Reading Tools, Writing Simulator & Exam Timer across HTML pages.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const TARGET_DIRECTORIES = [
  { folder: '.', isRoot: true },
  { folder: 'expert 5', isRoot: false },
  { folder: 'expert 6', isRoot: false },
  { folder: 'expert 7.5', isRoot: false }
];

function run() {
  console.log('🚀 Starting Universal Scripts Injection & Safety Backup...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(ROOT_DIR, '_backups', `backup_before_universal_scripts_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  let totalScanned = 0;
  let quickSearchInjected = 0;
  let readingToolsInjected = 0;
  let examTimerInjected = 0;
  let writingSimInjected = 0;

  TARGET_DIRECTORIES.forEach(({ folder, isRoot }) => {
    const dirFullPath = path.join(ROOT_DIR, folder);
    if (!fs.existsSync(dirFullPath)) return;

    const files = fs.readdirSync(dirFullPath);
    const prefix = isRoot ? './js/' : '../js/';

    files.forEach(file => {
      if (!file.endsWith('.html')) return;
      if (isRoot && file !== 'index.html') return;

      const filePath = path.join(dirFullPath, file);
      const relPath = path.relative(ROOT_DIR, filePath);
      totalScanned++;

      // Backup file
      const backupFilePath = path.join(backupDir, relPath);
      fs.mkdirSync(path.dirname(backupFilePath), { recursive: true });
      fs.copyFileSync(filePath, backupFilePath);

      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;

      const isDashboard = file === 'index.html';
      const isReading = file.includes('reading') || file.includes('passage');
      const isWritingSimulator = file.includes('writing') && !file.includes('sample');
      const isWritingSample = file.includes('writing-sample') || file.includes('sample');
      const isGrammar = file.includes('grammar') || file.startsWith('module_');

      // 1. Quick Search (All Pages)
      if (!content.includes('quick-search.js')) {
        const tag = `<script src="${prefix}quick-search.js" defer></script>`;
        if (content.includes('</head>')) {
          content = content.replace('</head>', `    ${tag}\n</head>`);
          modified = true;
          quickSearchInjected++;
        }
      }

      // 2. Reading Tools (Reading & Grammar pages)
      if ((isReading || isGrammar || isWritingSample) && !isDashboard) {
        if (!content.includes('reading-tools.js')) {
          const tag = `<script src="${prefix}reading-tools.js" defer></script>`;
          if (content.includes('</head>')) {
            content = content.replace('</head>', `    ${tag}\n</head>`);
            modified = true;
            readingToolsInjected++;
          }
        }
      }

      // 3. Exam Timer (Reading Exercises & Writing Simulators)
      if ((isReading || isWritingSimulator) && !isDashboard && !file.includes('explanation')) {
        if (!content.includes('exam-timer.js')) {
          const tag = `<script src="${prefix}exam-timer.js" defer></script>`;
          if (content.includes('</head>')) {
            content = content.replace('</head>', `    ${tag}\n</head>`);
            modified = true;
            examTimerInjected++;
          }
        }
      }

      // 4. Writing Simulator Engine (Writing Simulators)
      if (isWritingSimulator && !isDashboard) {
        if (!content.includes('writing-simulator.js')) {
          const tag = `<script src="${prefix}writing-simulator.js" defer></script>`;
          if (content.includes('</head>')) {
            content = content.replace('</head>', `    ${tag}\n</head>`);
            modified = true;
            writingSimInjected++;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
      }
    });
  });

  console.log('\n=============================================');
  console.log(`✅ Safety Backup Created: _backups/backup_before_universal_scripts_${timestamp}`);
  console.log(`📊 Total HTML files scanned: ${totalScanned}`);
  console.log(`✨ Quick Search (Ctrl+K) linked in: ${quickSearchInjected} files`);
  console.log(`✨ Reading Tools (A+/A-, TTS, HL) linked in: ${readingToolsInjected} files`);
  console.log(`✨ Exam Timer Widget linked in: ${examTimerInjected} files`);
  console.log(`✨ Writing Simulator Engine linked in: ${writingSimInjected} files`);
  console.log('=============================================\n');
}

run();
