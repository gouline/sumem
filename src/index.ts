import { execSync } from 'child_process';

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  memory: number; // in bytes
}

/**
 * Get all running processes with their memory usage
 */
export function getProcesses(): ProcessInfo[] {
  try {
    // Use ps command to get process info
    // -A: all processes
    // -o: output format (pid, rss (memory in KB), command)
    const output = execSync('ps -A -o pid,rss,command', { encoding: 'utf-8' });
    const lines = output.trim().split('\n');

    // Skip header line
    const processes: ProcessInfo[] = [];
    lines.slice(1).forEach((line) => {
      const trimmedLine = line.trim();
      const match = trimmedLine.match(/^(\d+)\s+(\d+)\s+(.+)$/);

      if (match) {
        const [, pidStr, rssStr, command] = match;
        const pid = parseInt(pidStr, 10);
        const rss = parseInt(rssStr, 10);

        // Extract process name from command
        const commandParts = command.split(/[\s/]+/);
        const name = commandParts[commandParts.length - 1] || command;

        processes.push({
          pid,
          name,
          command,
          memory: rss * 1024, // Convert KB to bytes
        });
      }
    });

    return processes;
  } catch (error) {
    throw new Error(`Failed to get processes: ${error}`);
  }
}

/**
 * Check if a search key matches a text as a whole word (case-insensitive)
 * Words are delimited by spaces, special characters, or path separators
 */
export function matchesWholeWord(text: string, searchKey: string): boolean {
  // Escape special regex characters in searchKey
  const escapedKey = searchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create regex that matches the search key as a whole word
  // Word boundaries are: start/end of string, spaces, or non-alphanumeric characters
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapedKey}([^a-zA-Z0-9]|$)`, 'i');

  return regex.test(text);
}

/**
 * Filter processes by search key
 */
export function filterProcesses(processes: ProcessInfo[], searchKey: string): ProcessInfo[] {
  return processes.filter((proc) => {
    // Check both process name and full command path
    return matchesWholeWord(proc.name, searchKey) || matchesWholeWord(proc.command, searchKey);
  });
}

/**
 * Calculate total memory usage in bytes
 */
export function calculateTotalMemory(processes: ProcessInfo[]): number {
  return processes.reduce((total, proc) => total + proc.memory, 0);
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}
