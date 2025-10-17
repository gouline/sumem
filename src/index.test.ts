import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  calculateTotalMemory,
  filterProcesses,
  formatBytes,
  matchesWholeWord,
  ProcessInfo,
} from './index.js';

test('matchesWholeWord - should match exact word case-insensitive', () => {
  assert.ok(matchesWholeWord('code', 'code'));
  assert.ok(matchesWholeWord('Code', 'code'));
  assert.ok(matchesWholeWord('CODE', 'code'));
});

test('matchesWholeWord - should match word with spaces', () => {
  assert.ok(matchesWholeWord('Code Helper', 'code'));
  assert.ok(matchesWholeWord('test code helper', 'code'));
});

test('matchesWholeWord - should match word with special characters', () => {
  assert.ok(matchesWholeWord('test_code_helper', 'code'));
  assert.ok(matchesWholeWord('test-code-helper', 'code'));
  assert.ok(matchesWholeWord('/usr/bin/code', 'code'));
});

test('matchesWholeWord - should NOT match partial word', () => {
  assert.ok(!matchesWholeWord('codehelper', 'code'));
  assert.ok(!matchesWholeWord('mycode', 'code'));
  assert.ok(!matchesWholeWord('encoder', 'code'));
});

test('matchesWholeWord - should match at start and end of string', () => {
  assert.ok(matchesWholeWord('code helper', 'code'));
  assert.ok(matchesWholeWord('helper code', 'code'));
  assert.ok(matchesWholeWord('code', 'code'));
});

test('filterProcesses - should filter processes by name', () => {
  const processes: ProcessInfo[] = [
    { pid: 1, name: 'code', command: '/usr/bin/code', memory: 1024 },
    { pid: 2, name: 'node', command: '/usr/bin/node', memory: 2048 },
    { pid: 3, name: 'Code Helper', command: '/Applications/Code Helper', memory: 512 },
  ];

  const filtered = filterProcesses(processes, 'code');
  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].pid, 1);
  assert.equal(filtered[1].pid, 3);
});

test('filterProcesses - should filter processes by command path', () => {
  const processes: ProcessInfo[] = [
    { pid: 1, name: 'helper', command: '/usr/bin/code-helper', memory: 1024 },
    { pid: 2, name: 'node', command: '/usr/bin/node', memory: 2048 },
  ];

  const filtered = filterProcesses(processes, 'code');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].pid, 1);
});

test('filterProcesses - should not match partial words', () => {
  const processes: ProcessInfo[] = [
    { pid: 1, name: 'codehelper', command: '/usr/bin/codehelper', memory: 1024 },
    { pid: 2, name: 'encoder', command: '/usr/bin/encoder', memory: 2048 },
  ];

  const filtered = filterProcesses(processes, 'code');
  assert.equal(filtered.length, 0);
});

test('calculateTotalMemory - should sum all memory values', () => {
  const processes: ProcessInfo[] = [
    { pid: 1, name: 'test', command: '/test1', memory: 1024 },
    { pid: 2, name: 'test', command: '/test2', memory: 2048 },
    { pid: 3, name: 'test', command: '/test3', memory: 512 },
  ];

  const total = calculateTotalMemory(processes);
  assert.equal(total, 3584);
});

test('calculateTotalMemory - should return 0 for empty array', () => {
  const total = calculateTotalMemory([]);
  assert.equal(total, 0);
});

test('formatBytes - should format bytes correctly', () => {
  assert.equal(formatBytes(0), '0.00 B');
  assert.equal(formatBytes(512), '512.00 B');
  assert.equal(formatBytes(1024), '1.00 KB');
  assert.equal(formatBytes(1536), '1.50 KB');
  assert.equal(formatBytes(1048576), '1.00 MB');
  assert.equal(formatBytes(1073741824), '1.00 GB');
});

test('formatBytes - should handle large values', () => {
  const result = formatBytes(1536 * 1024 * 1024);
  assert.ok(result.includes('GB'));
  assert.ok(result.includes('1.50'));
});
