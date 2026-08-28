/**
 * Expert IELTS — Reading Explanations Protection Sync & Password Manager
 * 
 * Scans all course levels for Reading Explanation modules,
 * creates safety backups, auto-registers default passwords for new files,
 * and ensures the protection script is linked.
 * 
 * Usage:
 *   node scripts/sync-reading-protection.js             (Full sync, backup & script injection)
 *   node scripts/sync-reading-protection.js --check-only (Audit and check status only)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PROTECTION_SCRIPT_FILE = path.join(ROOT_DIR, 'js', 'reading-protection.js');

const TARGET_DIRECTORIES = [
  { folder: 'expert 5', scriptPath: '../js/reading-protection.js' },
  { folder: 'expert 6', scriptPath: '../js/reading-protection.js' },
  { folder: 'expert 7.5', scriptPath: '../js/reading-protection.js' }
];

const isCheckOnly = process.argv.includes('--check-only');

function isProtectedFile(filename) {
  if (!filename.endsWith('.html')) return false;
  if (filename === 'index.html') return false;
  const lower = filename.toLowerCase();
  return lower.includes('reading-explanation') ||
    lower.includes('reading_explanation') ||
    lower.includes('reading-explanations') ||
    lower.includes('writing-sample') ||
    lower.includes('writing_sample') ||
    lower.includes('sample-writing');
}

function generateDefaultPassword(folder, filename) {
  const lvlPrefix = folder.replace(/[^0-9]/g, '');
  const match = filename.match(/module-?([0-9]+[a-z]?)/i);
  const isWriting = filename.toLowerCase().includes('writing') || filename.toLowerCase().includes('sample');
  const typeLetter = isWriting ? 'w' : 'r';
  const modPart = match ? `${typeLetter}${match[1].toLowerCase()}` : (isWriting ? 'writing' : 'reading');
  return `exp${lvlPrefix}-${modPart}`;
}

function run() {
  console.log('================================================================');
  console.log('🔒 Expert for IELTS — Content Protection & Password Sync Engine');
  console.log('================================================================\n');

  if (isCheckOnly) {
    console.log('🔍 MODE: CHECK ONLY (No files will be modified)\n');
  }

  // 1. Read existing password registry from js/reading-protection.js
  let protectionScriptContent = '';
  if (fs.existsSync(PROTECTION_SCRIPT_FILE)) {
    protectionScriptContent = fs.readFileSync(PROTECTION_SCRIPT_FILE, 'utf-8');
  } else {
    console.error('❌ Error: js/reading-protection.js not found!');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(ROOT_DIR, '_backups', `backup_before_reading_protection_${timestamp}`);

  let totalScanned = 0;
  let totalExplanations = 0;
  let totalInjected = 0;
  let totalAlreadyProtected = 0;
  let newPasswordsAdded = 0;

  const explanationFiles = [];

  // 2. Scan all target directories
  TARGET_DIRECTORIES.forEach(({ folder, scriptPath }) => {
    const dirFullPath = path.join(ROOT_DIR, folder);
    if (!fs.existsSync(dirFullPath)) return;

    const files = fs.readdirSync(dirFullPath);

    files.forEach(file => {
      if (!file.endsWith('.html')) return;
      totalScanned++;

      if (!isProtectedFile(file)) return;
      totalExplanations++;

      const filePath = path.join(dirFullPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const hasScript = content.includes('reading-protection.js');

      explanationFiles.push({
        folder,
        file,
        filePath,
        scriptPath,
        content,
        hasScript
      });
    });
  });

  console.log(`📁 Scanned ${totalScanned} HTML files across course levels.`);
  console.log(`🔒 Found ${totalExplanations} protected modules (Reading Explanations & Writing Model Answers).\n`);

  if (!isCheckOnly && explanationFiles.length > 0) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 3. Process each explanation file
  const reportRows = [];

  explanationFiles.forEach(item => {
    const { folder, file, filePath, scriptPath, content, hasScript } = item;
    const relPath = path.relative(ROOT_DIR, filePath);

    // Check password in protection script scoped to this level folder
    let passwordStatus = 'Registered';
    let assignedPassword = '';

    // Extract section for this level
    const levelSectionRegex = new RegExp(`"${folder}"\\s*:\\s*{([\\s\\S]*?)}`, 'i');
    const levelMatch = protectionScriptContent.match(levelSectionRegex);
    const levelSection = levelMatch ? levelMatch[1] : '';

    const fileRegex = new RegExp(`"${file}"\\s*:\\s*"([^"]+)"`);
    const match = levelSection.match(fileRegex);

    if (match) {
      assignedPassword = match[1];
    } else {
      // Need to register new password
      const defaultPwd = generateDefaultPassword(folder, file);
      assignedPassword = defaultPwd;
      passwordStatus = isCheckOnly ? 'Missing in registry' : 'Auto-registered';

      if (!isCheckOnly) {
        // Insert into levels object in js/reading-protection.js
        const levelSearchRegex = new RegExp(`("${folder}"\\s*:\\s*{)([\\s\\S]*?)(})`, 'i');
        if (levelSearchRegex.test(protectionScriptContent)) {
          protectionScriptContent = protectionScriptContent.replace(levelSearchRegex, (m, p1, p2, p3) => {
            const trimmed = p2.trim();
            const comma = trimmed && !trimmed.endsWith(',') ? ',' : '';
            const indent = '\n        ';
            return `${p1}${p2}${comma}${indent}"${file}": "${defaultPwd}"\n      ${p3}`;
          });
          newPasswordsAdded++;
        }
      }
    }

    // Check script injection
    let injectionStatus = '';
    if (hasScript) {
      injectionStatus = '✅ Active';
      totalAlreadyProtected++;
    } else if (isCheckOnly) {
      injectionStatus = '⚠️ Script Missing';
    } else {
      // Backup original file
      const backupFilePath = path.join(backupDir, relPath);
      fs.mkdirSync(path.dirname(backupFilePath), { recursive: true });
      fs.copyFileSync(filePath, backupFilePath);

      // Inject script tag
      const scriptTag = `<script src="${scriptPath}" defer></script>`;
      let updatedContent = content;

      if (updatedContent.includes('</head>')) {
        updatedContent = updatedContent.replace('</head>', `    ${scriptTag}\n</head>`);
      } else if (updatedContent.includes('</body>')) {
        updatedContent = updatedContent.replace('</body>', `    ${scriptTag}\n</body>`);
      }

      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      injectionStatus = '✨ Newly Injected';
      totalInjected++;
    }

    reportRows.push({
      Folder: folder,
      Module: file,
      Password: assignedPassword,
      Script: injectionStatus,
      Registry: passwordStatus
    });
  });

  // Save updated js/reading-protection.js if new passwords were added
  if (!isCheckOnly && newPasswordsAdded > 0) {
    fs.writeFileSync(PROTECTION_SCRIPT_FILE, protectionScriptContent, 'utf-8');
    console.log(`🔑 Auto-registered ${newPasswordsAdded} new module passwords into js/reading-protection.js\n`);
  }

  // Print Formatted Report Table
  console.log('---------------------------------------------------------------------------------------------------------');
  console.log(
    'Folder'.padEnd(14) +
    'Module File'.padEnd(42) +
    'Password'.padEnd(16) +
    'Script Status'.padEnd(20) +
    'Registry Status'
  );
  console.log('---------------------------------------------------------------------------------------------------------');
  reportRows.forEach(r => {
    console.log(
      r.Folder.padEnd(14) +
      r.Module.padEnd(42) +
      r.Password.padEnd(16) +
      r.Script.padEnd(20) +
      r.Registry
    );
  });
  console.log('---------------------------------------------------------------------------------------------------------\n');

  if (!isCheckOnly) {
    console.log('================================================================');
    console.log(`✅ Safety Backup Created: _backups/backup_before_reading_protection_${timestamp}`);
    console.log(`📊 Total reading explanation modules: ${totalExplanations}`);
    console.log(`✨ Newly injected protection scripts: ${totalInjected}`);
    console.log(`🔒 Already protected: ${totalAlreadyProtected}`);
    if (newPasswordsAdded > 0) {
      console.log(`🔑 New passwords registered: ${newPasswordsAdded}`);
    }
    console.log('================================================================\n');
  }
}

run();
