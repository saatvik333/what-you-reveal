import { describe, it } from 'node:test';
import assert from 'node:assert';
import { cyrb53 } from './crypto.js';

describe('cyrb53', () => {
  it('should return a stable hash for a given string', () => {
    assert.strictEqual(cyrb53('hello world'), 3259054761512980);
    assert.strictEqual(cyrb53('test string'), 8364996362156358);
  });

  it('should return a different hash for different strings', () => {
    assert.notStrictEqual(cyrb53('hello world'), cyrb53('Hello world'));
    assert.notStrictEqual(cyrb53('test1'), cyrb53('test2'));
  });

  it('should return a stable hash for an empty string', () => {
    assert.strictEqual(cyrb53(''), 3338908027751811);
  });

  it('should return different hashes for the same string with different seeds', () => {
    assert.strictEqual(cyrb53('hello world', 1), 6759793827125);
    assert.strictEqual(cyrb53('hello world', 42), 8598010756496894);
    assert.notStrictEqual(cyrb53('hello world'), cyrb53('hello world', 1));
  });

  it('should handle large strings', () => {
    const largeString = 'a'.repeat(10000);
    assert.strictEqual(typeof cyrb53(largeString), 'number');
    const largeString1 = 'a'.repeat(10000);
    const largeString2 = 'a'.repeat(10000);
    assert.strictEqual(cyrb53(largeString1), cyrb53(largeString2));
  });

  it('should handle strings with special characters and unicode', () => {
    assert.strictEqual(cyrb53('!@#$%^&*()_+'), 8914625137099139);
    assert.strictEqual(cyrb53('你好世界'), 8292611340353991);
    assert.strictEqual(cyrb53('🌍🚀✨'), 3646903503156701);
    assert.notStrictEqual(cyrb53('你好世界'), cyrb53('世界你好'));
  });
});
