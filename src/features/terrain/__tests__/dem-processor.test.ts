import { test } from 'vitest';
import assert from 'node:assert';
import { processDEM } from '../processing/dem-processor';
import { calculateSlopeAndAspect } from '../processing/slope-calculator';
import { analyzeDrainage } from '../processing/drainage-analyzer';
import { TerrainMetadata } from '../types/terrain';

test('calculateSlopeAndAspect: flat surface yields 0 degree slope', () => {
  const width = 3;
  const height = 3;
  const elevations = new Float32Array([
    100, 100, 100,
    100, 100, 100,
    100, 100, 100
  ]);

  const { slopes, aspects } = calculateSlopeAndAspect(elevations, width, height, 10);
  assert.strictEqual(slopes[4], 0);
  assert.strictEqual(aspects[4], -1); // flat
});

test('calculateSlopeAndAspect: planar slope yields correct non-zero gradient', () => {
  const width = 3;
  const height = 3;
  // Uniform 10m drop across 10m cell -> gradient = 1.0 -> 45 degrees
  const elevations = new Float32Array([
    120, 110, 100,
    120, 110, 100,
    120, 110, 100
  ]);

  const { slopes } = calculateSlopeAndAspect(elevations, width, height, 10);
  const centerSlope = slopes[4];
  assert.ok(centerSlope > 40 && centerSlope < 50, `Expected ~45 deg slope, got ${centerSlope}`);
});

test('analyzeDrainage: identifies flow direction downhill', () => {
  const width = 3;
  const height = 3;
  // Sloping East (downhill towards index 5)
  const elevations = new Float32Array([
    100, 90, 80,
    100, 90, 80,
    100, 90, 80
  ]);
  const slopes = new Float32Array(9);

  const drainage = analyzeDrainage(elevations, slopes, width, height, 10);
  // Center cell (index 4) should route East (D8 code 1)
  assert.strictEqual(drainage.flowDirections[4], 1);
});

test('processDEM: computes valid statistics and elevation range', () => {
  const metadata: TerrainMetadata = {
    id: 'test-dem',
    name: 'Test DEM',
    description: 'Unit test raster',
    format: 'synthetic',
    width: 3,
    height: 3,
    cellSize: 10,
    nodataValue: -9999,
    bounds: { north: 10, south: 0, east: 10, west: 0 },
    crs: 'EPSG:4326',
    createdAt: new Date().toISOString()
  };

  const elevations = new Float32Array([
    50, 60, 70,
    40, 50, 60,
    30, 40, 50
  ]);

  const result = processDEM(metadata, elevations);
  assert.strictEqual(result.stats.elevation.min, 30);
  assert.strictEqual(result.stats.elevation.max, 70);
  assert.strictEqual(result.stats.elevation.relief, 40);
  assert.strictEqual(result.elevations.length, 9);
  assert.strictEqual(result.slopes.length, 9);
  assert.strictEqual(result.flowAccumulations.length, 9);
});
