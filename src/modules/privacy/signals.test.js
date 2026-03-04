import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrivacyScore } from './signals.js';

test('calculatePrivacyScore default (neutral) case', () => {
  const result = calculatePrivacyScore({});
  assert.equal(result.score, 30);
  assert.equal(result.grade, 'E (Weak Privacy)');
  assert.deepEqual(result.breakdown, []);
});

test('calculatePrivacyScore applies bonuses and maxes out at 100', () => {
  const factors = {
    adBlocker: true,          // +15
    webrtcProtected: true,    // +15
    gpcEnabled: true,         // +10
    storagePartitioned: true, // +10
    vpnDetected: true,        // +10
    torDetected: true,        // +10
    privateBrowsing: true,    // +5
    dntEnabled: true,         // +5
    braveShields: true        // +5
  };
  const result = calculatePrivacyScore(factors);
  // Base 30 + 85 = 115 -> clamped to 100
  assert.equal(result.score, 100);
  assert.equal(result.grade, 'A+ (Maximum Privacy)');
  assert.equal(result.breakdown.length, 9);
});

test('calculatePrivacyScore applies penalties and mins out at 0', () => {
  const factors = {
    webrtcLeaking: true,      // -15
    gpcDisabled: true,        // -5
    dntDisabled: true,        // -5
    webdriverDetected: true   // -10
  };
  const result = calculatePrivacyScore(factors);
  // Base 30 - 35 = -5 -> clamped to 0
  assert.equal(result.score, 0);
  assert.equal(result.grade, 'F (At Risk)');
  assert.equal(result.breakdown.length, 4);
});

test('calculatePrivacyScore different grades', async (t) => {
  await t.test('Grade: A', () => {
    // Need score 80-89. Base 30 + 50 = 80
    const result = calculatePrivacyScore({
      adBlocker: true,          // +15
      webrtcProtected: true,    // +15
      gpcEnabled: true,         // +10
      storagePartitioned: true  // +10
    });
    assert.equal(result.score, 80);
    assert.equal(result.grade, 'A (Excellent Privacy)');
  });

  await t.test('Grade: B', () => {
    // Need score 70-79. Base 30 + 40 = 70
    const result = calculatePrivacyScore({
      adBlocker: true,          // +15
      webrtcProtected: true,    // +15
      gpcEnabled: true          // +10
    });
    assert.equal(result.score, 70);
    assert.equal(result.grade, 'B (Strong Privacy)');
  });

  await t.test('Grade: C', () => {
    // Need score 60-69. Base 30 + 30 = 60
    const result = calculatePrivacyScore({
      adBlocker: true,          // +15
      webrtcProtected: true     // +15
    });
    assert.equal(result.score, 60);
    assert.equal(result.grade, 'C (Moderate Privacy)');
  });

  await t.test('Grade: D', () => {
    // Need score 50-59. Base 30 + 20 = 50
    const result = calculatePrivacyScore({
      gpcEnabled: true,         // +10
      storagePartitioned: true  // +10
    });
    assert.equal(result.score, 50);
    assert.equal(result.grade, 'D (Basic Privacy)');
  });
});

test('calculatePrivacyScore verifies breakdown details mapping', () => {
  const factors = {
    adBlocker: true,
    webdriverDetected: true
  };
  const result = calculatePrivacyScore(factors);

  assert.equal(result.score, 35); // 30 + 15 - 10

  assert.deepEqual(result.breakdown, [
    { factor: 'Ad Blocker', points: '+15', reason: 'Active' },
    { factor: 'Automation', points: '-10', reason: 'WebDriver detected' }
  ]);
});
