#!/usr/bin/env node
/**
 * Update Expert 6 (Band 6.0) index and dataset
 */
const { updateLevel } = require('./indexer-core');

try {
  updateLevel('expert 6');
} catch (err) {
  console.error(`❌ Error updating Expert 6:`, err.message);
  process.exit(1);
}
