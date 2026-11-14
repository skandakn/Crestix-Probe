import { test } from 'vitest';
import assert from 'node:assert';
import { Member9IntegrationService } from '../services/member9-contract';
import { getSampleTerrain } from '../samples/sample-terrains';

test('Member9IntegrationService: generates schema-compliant simulation payload', () => {
  const dem = getSampleTerrain('crestix-river-valley');
  const payload = Member9IntegrationService.createSimulationPayload(dem);

  assert.strictEqual(payload.contractVersion, '1.0.0');
  assert.strictEqual(payload.spatialReference.dimensions.cols, 64);
  assert.strictEqual(payload.spatialReference.dimensions.rows, 64);
  assert.strictEqual(payload.spatialReference.dimensions.cellSizeMeters, 20);

  const validation = Member9IntegrationService.validatePayload(payload);
  assert.strictEqual(validation.valid, true);
  assert.strictEqual(validation.errors.length, 0);
});

test('Member9IntegrationService: rejects malformed payload', () => {
  const invalidPayload = { contractVersion: '1.0.0' };
  const validation = Member9IntegrationService.validatePayload(invalidPayload);
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.errors.length > 0);
});
