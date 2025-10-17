#!/usr/bin/env node

import { Command } from 'commander';
import { calculateTotalMemory, filterProcesses, formatBytes, getProcesses } from './index.js';

function main(): void {
  const program = new Command();

  program
    .name('sumem')
    .description('Sum the memory usage of application processes')
    .version('1.0.0')
    .argument('<search-key>', 'Case-insensitive whole word to match process names and paths')
    .option('-l, --list', 'List all matched processes')
    .option(
      '-e, --exclude <pattern>',
      'Exclude processes matching pattern (can be used multiple times)',
      (value, previous: string[] = []) => {
        return [...previous, value];
      },
      []
    )
    .addHelpText(
      'after',
      `
Examples:
  $ sumem app              # Sum memory of all processes matching "app"
  $ sumem --list app       # List and sum memory of all "app" processes
  $ sumem -e helper app    # Sum "app" memory excluding "helper"
`
    )
    .action((searchKey: string, options: { list?: boolean; exclude?: string[] }) => {
      const listProcesses = options.list || false;
      const excludePatterns = options.exclude || [];
      executeCommand(searchKey, listProcesses, excludePatterns);
    });

  program.parse();
}

function executeCommand(
  searchKey: string,
  listProcesses: boolean,
  excludePatterns: string[]
): void {
  try {
    // Get all processes
    const allProcesses = getProcesses();

    // Filter by search key
    let matchedProcesses = filterProcesses(allProcesses, searchKey);

    // Apply exclude filters
    if (excludePatterns.length > 0) {
      matchedProcesses = matchedProcesses.filter((proc) => {
        // Exclude if any exclude pattern matches
        return !excludePatterns.some((pattern) => {
          return filterProcesses([proc], pattern).length > 0;
        });
      });
    }

    if (matchedProcesses.length === 0) {
      console.log(`No processes found matching "${searchKey}"`);
      process.exit(0);
    }

    // List processes if requested
    if (listProcesses) {
      console.log(`Found ${matchedProcesses.length} process(es) matching "${searchKey}":\n`);

      // Sort by memory (descending)
      const sorted = matchedProcesses.sort((a, b) => b.memory - a.memory);

      for (const proc of sorted) {
        console.log(
          `  PID ${proc.pid.toString().padStart(6)} | ${formatBytes(proc.memory).padStart(12)} | ${proc.command}`
        );
      }

      console.log();
    }

    // Calculate and print total
    const totalMemory = calculateTotalMemory(matchedProcesses);
    console.log(
      `Total memory used by ${matchedProcesses.length} process(es): ${formatBytes(totalMemory)}`
    );
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
