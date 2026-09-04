/**
 * Expert IELTS - Intelligent Auto-Indexer Core
 * Automatically scans level directories, detects new HTML files,
 * extracts titles & metadata, updates js/data/ datasets, and refreshes index.html files.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const LEVEL_CONFIGS = {
  'expert 5': {
    id: 'expert-5',
    folderName: 'expert 5',
    dataFile: 'js/data/expert-5.js',
    varName: 'EXPERT_5_MODULES',
    badgeClass: 'badge-band5',
    bandLabel: 'Band 5.0',
    indexFile: 'expert 5/index.html'
  },
  'expert 6': {
    id: 'expert-6',
    folderName: 'expert 6',
    dataFile: 'js/data/expert-6.js',
    varName: 'EXPERT_6_MODULES',
    badgeClass: 'badge-band6',
    bandLabel: 'Band 6.0',
    indexFile: 'expert 6/index.html'
  },
  'expert 7.5': {
    id: 'expert-75',
    folderName: 'expert 7.5',
    dataFile: 'js/data/expert-75.js',
    varName: 'EXPERT_75_MODULES',
    badgeClass: 'badge-band75',
    bandLabel: 'Band 7.5',
    indexFile: 'expert 7.5/index.html'
  }
};

/**
 * Creates a safety backup of modified files before applying changes
 */
function createBackup(filesToBackup) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(ROOT_DIR, '_backups', `auto_index_backup_${timestamp}`);

  let created = false;
  filesToBackup.forEach(relPath => {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (fs.existsSync(fullPath)) {
      if (!created) {
        fs.mkdirSync(backupDir, { recursive: true });
        created = true;
      }
      const targetBackupPath = path.join(backupDir, relPath);
      fs.mkdirSync(path.dirname(targetBackupPath), { recursive: true });
      fs.copyFileSync(fullPath, targetBackupPath);
    }
  });

  return created ? backupDir : null;
}

/**
 * Extracts metadata (title, topic, h1) from HTML content
 */
function parseHtmlMetadata(filePath, filename) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Title match
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let rawTitle = titleMatch ? titleMatch[1].trim() : '';

  // H1 match
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let rawH1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : '';

  // Determine skill
  let skill = 'reading';
  const lowerFile = filename.toLowerCase();
  const lowerTitle = rawTitle.toLowerCase();
  const lowerH1 = rawH1.toLowerCase();

  if (lowerFile.includes('review') || lowerTitle.includes('unit review') || lowerTitle.includes('module review') || lowerH1.includes('review')) {
    skill = 'review';
  } else if (lowerFile.includes('grammar') || lowerFile.startsWith('module_') || lowerFile.includes('tenses') || lowerFile.includes('verbs') || lowerFile.includes('clause') || lowerFile.includes('passive') || lowerFile.includes('conditional') || lowerFile.includes('adverb') || lowerFile.includes('nouns') || lowerFile.includes('irregular_verbs')) {
    skill = 'grammar';
  } else if (lowerFile.includes('writing') || lowerTitle.includes('writing') || lowerH1.includes('writing')) {
    skill = 'writing';
  } else if (lowerFile.includes('reading') || lowerTitle.includes('reading') || lowerH1.includes('reading')) {
    skill = 'reading';
  }

  // Determine module badge (e.g. Module 1a, Module 10, Review 1, Reference)
  let badge = 'Module';
  const modMatch = filename.match(/module[_-]?(\d+[ab]?|\d+)/i) || rawTitle.match(/Module\s*(\d+[ab]?|\d+)/i);
  const reviewMatch = filename.match(/review[-_]?m?(\d+)/i) || rawTitle.match(/Review\s*(\d+)/i) || rawH1.match(/Review\s*(\d+)/i);

  if (skill === 'review' && reviewMatch) {
    badge = `Review ${reviewMatch[1]}`;
  } else if (modMatch) {
    badge = `Module ${modMatch[1].toLowerCase().replace(/^0+/, '')}`;
  } else if (lowerFile.includes('irregular_verbs') || lowerFile.includes('guide') || lowerFile.includes('reference')) {
    badge = 'Reference';
  }

  // Determine status & explanation flag
  const isExplanation = lowerFile.includes('explanation') || lowerFile.includes('analysis') || lowerTitle.includes('analysis') || lowerTitle.includes('translation & vocabulary');
  const isWritingSample = lowerFile.includes('writing-sample') || lowerTitle.includes('model answer') || lowerFile.includes('sample');

  let status = 'Active Exercise';
  if (skill === 'review') {
    status = 'Active Review';
  } else if (isExplanation) {
    status = 'Active Analysis';
  } else if (isWritingSample) {
    status = 'Active Model Answer';
  } else if (skill === 'grammar') {
    status = badge === 'Reference' ? 'Active Reference' : 'Active Lesson';
  } else if (skill === 'writing') {
    status = 'Active Exercise';
  }

  // Extract topic from title or h1
  let topic = '';
  if (skill === 'review') {
    const subMatch = content.match(/<p[^>]*class="[^"]*text-slate-500[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    let sub = subMatch ? subMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    if (sub && !sub.toLowerCase().includes('progress') && !sub.toLowerCase().includes('practice platform')) {
      topic = sub;
    } else if (reviewMatch && reviewMatch[1] === '1') {
      topic = 'University Places, Present Simple & Modal Can';
    } else {
      topic = 'Progress Practice & Assessment';
    }
  } else if (isExplanation && rawTitle.includes('—')) {
    topic = rawTitle.split('—')[0].trim();
  } else if (isWritingSample) {
    let cleanT = rawTitle.replace(/^Module\s*\d+[ab]?\s*[:—\-]?\s*/i, '').trim();
    cleanT = cleanT.replace(/\s*-\s*Model Answer[\s\S]*$/i, '').trim();
    topic = cleanT;
  } else if (rawTitle.includes('—')) {
    const parts = rawTitle.split('—');
    topic = parts.slice(1).join('—').trim();
  } else if (rawTitle.includes(':')) {
    const parts = rawTitle.split(':');
    topic = parts.slice(1).join(':').trim();
  } else if (rawH1) {
    if (rawH1.includes('|')) {
      topic = rawH1.split('|')[1].trim();
    } else {
      topic = rawH1;
    }
  }

  // Clean topic string
  topic = topic.replace(/^Module\s*\d+[ab]?\s*[:—\-]?\s*/i, '').trim();
  topic = topic.replace(/IELTS\s*(Simulator|Academic|Reading|Writing|Practice)\s*[:—\|\-]?\s*/gi, '').trim();
  topic = topic.replace(/\(Page\s*\d+\)/gi, '').trim();

  // If topic is still empty or looks like default template
  if (!topic || topic.includes('${TASK_CONFIG') || topic.length < 2) {
    topic = filename
      .replace(/^module[_-]\d+[ab]?[_-]/i, '')
      .replace(/^review[_-]m?\d+[_-]?/i, '')
      .replace(/\.html$/i, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // Build clean display title and search dataTitle
  let displayTitle = '';
  let dataTitle = '';

  const skillName = skill.charAt(0).toUpperCase() + skill.slice(1);

  if (skill === 'review') {
    const modNum = reviewMatch ? reviewMatch[1] : '';
    displayTitle = modNum ? `Module ${modNum} Review — ${topic}` : `${badge} — ${topic}`;
    dataTitle = modNum ? `Module ${modNum} Review — ${topic}` : `${badge} — ${topic}`;
  } else if (rawTitle.toLowerCase().includes('grammar & vocabulary reference')) {
    displayTitle = `${badge} Grammar &amp; Vocabulary Reference`;
    dataTitle = `${badge} Grammar & Vocabulary Reference`;
  } else if (badge === 'Reference') {
    displayTitle = `Grammar Reference — ${topic}`;
    dataTitle = `Grammar Reference — ${topic}`;
  } else if (isExplanation) {
    displayTitle = `${badge} ${skillName} Analysis — ${topic}`;
    dataTitle = `${badge} ${skillName} Analysis & Explanations — ${topic}`;
  } else if (isWritingSample) {
    displayTitle = `${badge} ${skillName} — ${topic} (Model Answer &amp; Annotations)`;
    dataTitle = `${badge} ${skillName} — ${topic} Model Answer & Annotations`;
  } else {
    // Check if filename had "extra" or single digit module
    if (filename.match(/module-\d+-reading\.html/i) && !topic.toLowerCase().startsWith('extra')) {
      displayTitle = `${badge} Extra ${skillName} — ${topic}`;
      dataTitle = `${badge} Extra ${skillName} — ${topic}`;
    } else {
      displayTitle = `${badge} ${skillName} — ${topic}`;
      dataTitle = `${badge} ${skillName} — ${topic}`;
    }
  }

  // Escape HTML entities if any
  const escapedTitle = displayTitle.replace(/&/g, '&amp;').replace(/&amp;amp;/g, '&amp;');

  return {
    url: filename,
    dataTitle: dataTitle.replace(/&amp;/g, '&'),
    skill,
    badge,
    title: escapedTitle,
    status
  };
}

/**
 * Natural sort helper for module files
 */
function sortModules(a, b) {
  const skillOrder = { grammar: 1, reading: 2, writing: 3, review: 4 };
  const aSkill = skillOrder[a.skill] || 99;
  const bSkill = skillOrder[b.skill] || 99;

  if (aSkill !== bSkill) {
    return aSkill - bSkill;
  }

  // Extract module numbers
  const parseMod = item => {
    const m = (item.badge || item.url || '').match(/(\d+)([ab]?)/i);
    if (!m) return { num: 999, suffix: '', isAnalysis: 0 };
    const isAnalysis = (item.url || '').includes('explanation') || (item.url || '').includes('analysis') ? 1 : 0;
    return { num: parseInt(m[1], 10), suffix: (m[2] || '').toLowerCase(), isAnalysis };
  };

  const aMod = parseMod(a);
  const bMod = parseMod(b);

  if (aMod.num !== bMod.num) {
    return aMod.num - bMod.num;
  }

  if (aMod.suffix !== bMod.suffix) {
    return aMod.suffix.localeCompare(bMod.suffix);
  }

  if (aMod.isAnalysis !== bMod.isAnalysis) {
    return aMod.isAnalysis - bMod.isAnalysis;
  }

  return (a.title || '').localeCompare(b.title || '');
}

/**
 * Updates a specific level index and dataset
 */
function updateLevel(levelKey, options = {}) {
  const config = LEVEL_CONFIGS[levelKey];
  if (!config) {
    throw new Error(`Unknown level: "${levelKey}". Available: ${Object.keys(LEVEL_CONFIGS).join(', ')}`);
  }

  console.log(`\n========================================`);
  console.log(`🚀 Indexing: ${config.bandLabel} (${config.folderName})`);
  console.log(`========================================`);

  const folderPath = path.join(ROOT_DIR, config.folderName);
  const dataFilePath = path.join(ROOT_DIR, config.dataFile);
  const indexFilePath = path.join(ROOT_DIR, config.indexFile);

  if (!fs.existsSync(folderPath)) {
    throw new Error(`Directory does not exist: ${folderPath}`);
  }

  // Read existing dataset if present
  let existingModules = [];
  if (fs.existsSync(dataFilePath)) {
    try {
      const existingContent = fs.readFileSync(dataFilePath, 'utf-8');
      const fakeWindow = {};
      const runContext = new Function('window', existingContent);
      runContext(fakeWindow);
      existingModules = fakeWindow[config.varName] || [];
    } catch (err) {
      console.warn(`⚠️ Warning: Could not parse existing dataset (${err.message}). Starting fresh.`);
    }
  }

  const existingMap = new Map();
  existingModules.forEach(item => {
    existingMap.set(item.url, item);
  });

  // Find all HTML files on disk
  const filesOnDisk = fs.readdirSync(folderPath).filter(file => {
    return file.endsWith('.html') && file !== 'index.html';
  });

  const newItems = [];
  const updatedDataset = [];
  const processedUrls = new Set();

  filesOnDisk.forEach(filename => {
    processedUrls.add(filename);
    const filePath = path.join(folderPath, filename);

    const isForced = options.force || process.argv.includes('--force');

    if (existingMap.has(filename) && !isForced) {
      // Existing file - keep existing configuration
      const existing = existingMap.get(filename);
      updatedDataset.push({
        url: existing.url,
        dataTitle: existing.dataTitle || existing.title,
        skill: existing.skill,
        badgeClass: config.badgeClass,
        badge: existing.badge || 'Module',
        title: existing.title,
        status: existing.status || 'Active Exercise'
      });
    } else {
      // New file or forced reindex! Parse metadata automatically
      const parsed = parseHtmlMetadata(filePath, filename);
      parsed.badgeClass = config.badgeClass;
      if (!existingMap.has(filename)) {
        newItems.push(parsed);
      }
      updatedDataset.push(parsed);
    }
  });

  // Keep any deliberate placeholder entries that don't have disk files yet
  if (!options.pruneMissing) {
    existingModules.forEach(item => {
      if (!processedUrls.has(item.url)) {
        updatedDataset.push(item);
      }
    });
  }

  // Sort dataset
  updatedDataset.sort(sortModules);

  // Backup modified files
  const backupPath = createBackup([config.dataFile, config.indexFile]);
  if (backupPath) {
    console.log(`🛡️ Backup created at: ${path.relative(ROOT_DIR, backupPath)}`);
  }

  // Write updated JS dataset file
  const jsContent = `/**\n * Auto-generated modules data for ${config.folderName}\n */\nwindow.${config.varName} = ${JSON.stringify(updatedDataset, null, 2)};\n`;
  fs.writeFileSync(dataFilePath, jsContent, 'utf-8');
  console.log(`✅ Saved dataset: ${config.dataFile} (${updatedDataset.length} total entries)`);

  // Count by skill
  const counts = { grammar: 0, reading: 0, writing: 0, review: 0 };
  updatedDataset.forEach(item => {
    const s = (item.skill || '').toLowerCase();
    if (counts[s] !== undefined) {
      counts[s]++;
    }
  });

  // Update folder count badges in level index.html
  if (fs.existsSync(indexFilePath)) {
    let indexHtml = fs.readFileSync(indexFilePath, 'utf-8');

    // Update grammar count
    indexHtml = indexHtml.replace(
      /(<div class="skill-folder[^>]*data-folder-skill="grammar"[\s\S]*?<span class="folder-count-badge">)([^<]*)(<\/span>)/i,
      `$1${counts.grammar} ${counts.grammar === 1 ? 'Module' : 'Modules'}$3`
    );

    // Update reading count
    indexHtml = indexHtml.replace(
      /(<div class="skill-folder[^>]*data-folder-skill="reading"[\s\S]*?<span class="folder-count-badge">)([^<]*)(<\/span>)/i,
      `$1${counts.reading} ${counts.reading === 1 ? 'Module' : 'Modules'}$3`
    );

    // Update writing count
    indexHtml = indexHtml.replace(
      /(<div class="skill-folder[^>]*data-folder-skill="writing"[\s\S]*?<span class="folder-count-badge">)([^<]*)(<\/span>)/i,
      `$1${counts.writing} ${counts.writing === 1 ? 'Module' : 'Modules'}$3`
    );

    // Update review count
    indexHtml = indexHtml.replace(
      /(<div class="skill-folder[^>]*data-folder-skill="review"[\s\S]*?<span class="folder-count-badge">)([^<]*)(<\/span>)/i,
      `$1${counts.review} ${counts.review === 1 ? 'Module' : 'Modules'}$3`
    );

    fs.writeFileSync(indexFilePath, indexHtml, 'utf-8');
    console.log(`✅ Updated folder badges in: ${config.indexFile}`);
  }

  // Output summary
  console.log(`\n📊 Breakdown:`);
  console.log(`   📝 Grammar: ${counts.grammar} modules`);
  console.log(`   📖 Reading: ${counts.reading} modules`);
  console.log(`   ✍️ Writing: ${counts.writing} modules`);
  console.log(`   ⭐ Review:  ${counts.review} modules`);

  if (newItems.length > 0) {
    console.log(`\n✨ Detected & Added ${newItems.length} New File(s):`);
    newItems.forEach(item => {
      console.log(`   + [${item.skill.toUpperCase()}] ${item.url} -> "${item.title}"`);
    });
  } else {
    console.log(`\n✨ All files are already up-to-date. (0 new files)`);
  }

  return {
    level: config.folderName,
    total: updatedDataset.length,
    newCount: newItems.length,
    counts
  };
}

module.exports = {
  updateLevel,
  LEVEL_CONFIGS,
  ROOT_DIR
};
