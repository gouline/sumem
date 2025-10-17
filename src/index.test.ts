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

test('filterProcesses with exclude - should exclude processes matching exclude pattern', () => {
  const processes: ProcessInfo[] = [
    { pid: 1, name: 'Code', command: '/Applications/Code.app', memory: 1024 },
    { pid: 2, name: 'Code Helper', command: '/Applications/Code Helper', memory: 2048 },
    { pid: 3, name: 'Code Helper (GPU)', command: '/Applications/Code Helper (GPU)', memory: 512 },
  ];

  // First filter by search key 'code'
  let filtered = filterProcesses(processes, 'code');
  assert.equal(filtered.length, 3);

  // Then exclude processes matching 'helper'
  filtered = filtered.filter((proc) => {
    return filterProcesses([proc], 'helper').length === 0;
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].pid, 1);
  assert.equal(filtered[0].name, 'Code');
});

test('filterProcesses with multiple excludes - should exclude all matching patterns', () => {
  const processes: ProcessInfo[] = [
    { pid: 1, name: 'Safari', command: '/Applications/Safari.app', memory: 1024 },
    { pid: 2, name: 'Safari Helper', command: '/Applications/Safari Helper', memory: 2048 },
    {
      pid: 3,
      name: 'Safari Helper (GPU)',
      command: '/Applications/Safari Helper (GPU)',
      memory: 512,
    },
    { pid: 4, name: 'Safari Networking', command: '/Applications/Safari Networking', memory: 256 },
  ];

  // Filter by search key 'safari'
  let filtered = filterProcesses(processes, 'safari');
  assert.equal(filtered.length, 4);

  // Exclude processes matching 'helper' or 'gpu'
  const excludePatterns = ['helper', 'gpu'];
  filtered = filtered.filter((proc) => {
    return !excludePatterns.some((pattern) => {
      return filterProcesses([proc], pattern).length > 0;
    });
  });

  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].pid, 1);
  assert.equal(filtered[0].name, 'Safari');
  assert.equal(filtered[1].pid, 4);
  assert.equal(filtered[1].name, 'Safari Networking');
});

test('filterProcesses with exclude - whole word matching should apply', () => {
  const processes: ProcessInfo[] = [
    { pid: 1, name: 'code', command: '/usr/bin/code', memory: 1024 },
    { pid: 2, name: 'encoder', command: '/usr/bin/encoder', memory: 2048 },
  ];

  // Filter by search key 'code' - should only match process 1
  let filtered = filterProcesses(processes, 'code');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].pid, 1);

  // Exclude with 'cod' should not exclude anything (partial word)
  filtered = filtered.filter((proc) => {
    return filterProcesses([proc], 'cod').length === 0;
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].pid, 1);

  // Exclude with 'code' should exclude process 1
  filtered = filterProcesses(processes, 'code');
  filtered = filtered.filter((proc) => {
    return filterProcesses([proc], 'code').length === 0;
  });
  assert.equal(filtered.length, 0);
});

test('filterProcesses with exclude - case insensitive matching should apply', () => {
  const processes: ProcessInfo[] = [
    { pid: 1, name: 'Safari', command: '/Applications/Safari.app', memory: 1024 },
    { pid: 2, name: 'Safari Helper', command: '/Applications/Safari Helper', memory: 2048 },
  ];

  // Filter by 'safari'
  let filtered = filterProcesses(processes, 'safari');
  assert.equal(filtered.length, 2);

  // Exclude with 'HELPER' (uppercase) should still exclude the helper process
  filtered = filtered.filter((proc) => {
    return filterProcesses([proc], 'HELPER').length === 0;
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].pid, 1);
  assert.equal(filtered[0].name, 'Safari');
});

test('filterProcesses with exclude - no matches after exclude should work', () => {
  const processes: ProcessInfo[] = [
    { pid: 1, name: 'Code Helper', command: '/Applications/Code Helper', memory: 1024 },
    { pid: 2, name: 'Code Helper (GPU)', command: '/Applications/Code Helper (GPU)', memory: 2048 },
  ];

  // Filter by 'code'
  let filtered = filterProcesses(processes, 'code');
  assert.equal(filtered.length, 2);

  // Exclude all with 'helper'
  filtered = filtered.filter((proc) => {
    return filterProcesses([proc], 'helper').length === 0;
  });
  assert.equal(filtered.length, 0);
});
