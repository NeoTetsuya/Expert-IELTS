/**
 * Expert IELTS — Study Progress Script Injector & Backup Runner
 * Backs up all HTML files to _backups/ and safely links study-progress.js across all pages.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const TARGET_DIRECTORIES = [
  { folder: '.', scriptPath: './js/study-progress.js', isRoot: true },
  { folder: 'expert 5', scriptPath: '../js/study-progress.js', isRoot: false },
  { folder: 'expert 6', scriptPath: '../js/study-progress.js', isRoot: false },
  { folder: 'expert 7.5', scriptPath: '../js/study-progress.js', isRoot: false }
];

function run() {
  console.log('🚀 Starting Study Progress Script Injection & Backup...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(ROOT_DIR, '_backups', `backup_before_study_progress_js_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  let totalScanned = 0;
  let totalInjected = 0;
  let totalAlreadyPresent = 0;

  TARGET_DIRECTORIES.forEach(({ folder, scriptPath, isRoot }) => {
    const dirFullPath = path.join(ROOT_DIR, folder);
    if (!fs.existsSync(dirFullPath)) return;

    const files = fs.readdirSync(dirFullPath);

    files.forEach(file => {
      if (!file.endsWith('.html')) return;
      if (isRoot && file !== 'index.html') return;

      const filePath = path.join(dirFullPath, file);
      const relPath = path.relative(ROOT_DIR, filePath);
      totalScanned++;

      // 1. Create safety backup
      const backupFilePath = path.join(backupDir, relPath);
      fs.mkdirSync(path.dirname(backupFilePath), { recursive: true });
      fs.copyFileSync(filePath, backupFilePath);

      // 2. Read content
      let content = fs.readFileSync(filePath, 'utf-8');

      // Check if study-progress.js is already linked
      if (content.includes('study-progress.js')) {
        totalAlreadyPresent++;
        return;
      }

      const scriptTag = `<script src="${scriptPath}" defer></script>`;

      // Inject into <head> or before </body>
      if (content.includes('</head>')) {
        content = content.replace('</head>', `    ${scriptTag}\n</head>`);
        fs.writeFileSync(filePath, content, 'utf-8');
        totalInjected++;
      } else if (content.includes('</body>')) {
        content = content.replace('</body>', `    ${scriptTag}\n</body>`);
        fs.writeFileSync(filePath, content, 'utf-8');
        totalInjected++;
      } else {
        console.warn(`⚠️ Warning: No </head> or </body> found in ${relPath}`);
      }
    });
  });

  console.log('\n=============================================');
  console.log(`✅ Safety Backup Created: _backups/backup_before_study_progress_js_${timestamp}`);
  console.log(`📊 Total HTML files scanned: ${totalScanned}`);
  console.log(`✨ Successfully injected study-progress.js into: ${totalInjected} files`);
  console.log(`ℹ️ Already had study-progress.js: ${totalAlreadyPresent} files`);
  console.log('=============================================\n');
}

run();
