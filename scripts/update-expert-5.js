#!/usr/bin/env node
/**
 * Update Expert 5 (Band 5.0) index and dataset
 */
const { updateLevel } = require('./indexer-core');

try {
  updateLevel('expert 5');
} catch (err) {
  console.error(`❌ Error updating Expert 5:`, err.message);
  process.exit(1);
}
