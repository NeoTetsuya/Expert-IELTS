#!/usr/bin/env node
/**
 * Update all levels (Expert 5, Expert 6, Expert 7.5) and update root index.html
 */
const fs = require('fs');
const path = require('path');
const { updateLevel, LEVEL_CONFIGS, ROOT_DIR } = require('./indexer-core');

console.log(`========================================`);
console.log(`🌟 EXPERT FOR IELTS - FULL SITE SYNC 🌟`);
console.log(`========================================`);

let totalNew = 0;
const results = {};

for (const levelKey of Object.keys(LEVEL_CONFIGS)) {
  try {
    const res = updateLevel(levelKey);
    results[levelKey] = res;
    totalNew += res.newCount;
  } catch (err) {
    console.error(`❌ Failed to update ${levelKey}:`, err.message);
  }
}

// Update root index.html
const rootIndexPath = path.join(ROOT_DIR, 'index.html');
if (fs.existsSync(rootIndexPath)) {
  let rootHtml = fs.readFileSync(rootIndexPath, 'utf-8');

  // Update Band 5.0 count badge
  if (results['expert 5']) {
    const count5 = results['expert 5'].total;
    const badgeText5 = count5 >= 30 ? `${Math.floor(count5 / 5) * 5}+ Modules` : `${count5} Modules`;
    rootHtml = rootHtml.replace(
      /(<a class="level-card card-band5"[\s\S]*?<span class="stat-chip"[^>]*>)([^<]*)(<\/span>)/i,
      `$1${badgeText5}$3`
    );
  }

  // Update Band 6.0 count badge
  if (results['expert 6']) {
    const count6 = results['expert 6'].total;
    const badgeText6 = count6 >= 30 ? `${Math.floor(count6 / 5) * 5}+ Modules` : `${count6} Modules`;
    rootHtml = rootHtml.replace(
      /(<a class="level-card card-band6"[\s\S]*?<span class="stat-chip"[^>]*>)([^<]*)(<\/span>)/i,
      `$1${badgeText6}$3`
    );
  }

  // Update Band 7.5 count badge
  if (results['expert 7.5']) {
    const count75 = results['expert 7.5'].total;
    const badgeText75 = count75 >= 30 ? `${Math.floor(count75 / 5) * 5}+ Modules` : `${count75} Modules`;
    rootHtml = rootHtml.replace(
      /(<a class="level-card card-band75"[\s\S]*?<span class="stat-chip"[^>]*>)([^<]*)(<\/span>)/i,
      `$1${badgeText75}$3`
    );
  }

  fs.writeFileSync(rootIndexPath, rootHtml, 'utf-8');
  console.log(`\n✅ Updated root course cards in: index.html`);
}

console.log(`\n========================================`);
console.log(`🎉 ALL LEVELS SYNCED SUCCESSFULLY!`);
console.log(`   Total New Files Added: ${totalNew}`);
console.log(`========================================\n`);
