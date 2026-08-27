#!/usr/bin/env node
/**
 * Update Expert 7.5 (Band 7.5) index and dataset
 */
const { updateLevel } = require('./indexer-core');

try {
  updateLevel('expert 7.5');
} catch (err) {
  console.error(`❌ Error updating Expert 7.5:`, err.message);
  process.exit(1);
}
