import test from 'node:test';
import assert from 'node:assert';
import { parseAsciiGrid } from '../processing/ascii-grid-parser';
import { SAMPLE_ASCII_GRID_DATA } from '../assets/sample-dem-data';

test('parseAsciiGrid: parses valid ASCII grid header and grid data', () => {
  const parsed = parseAsciiGrid(SAMPLE_ASCII_GRID_DATA, 'test-valley.asc');
  assert.strictEqual(parsed.metadata.width, 6);
  assert.strictEqual(parsed.metadata.height, 6);
  assert.strictEqual(parsed.metadata.cellSize, 25);
  assert.strictEqual(parsed.metadata.nodataValue, -9999);
  assert.strictEqual(parsed.elevations.length, 36);

  // Check first cell
  assert.strictEqual(parsed.elevations[0], 150.0);
  // Check bounds
  assert.strictEqual(parsed.metadata.bounds.west, 77.58);
  assert.strictEqual(parsed.metadata.bounds.south, 12.97);
  assert.strictEqual(parsed.metadata.bounds.east, 77.58 + 6 * 25);
});

test('parseAsciiGrid: throws error on corrupted or missing header', () => {
  assert.throws(() => {
    parseAsciiGrid('INVALID CONTENT WITHOUT HEADER');
  }, /fewer than 6 header lines/);
});
