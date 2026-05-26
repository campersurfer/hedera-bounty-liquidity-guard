import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { analyzeOpportunity } from './analyzer.js';
import type { OpportunityInput } from './types.js';

const [, , command, filePath] = process.argv;

if (command !== 'analyze' || !filePath) {
  console.error('Usage: npm run analyze -- <opportunity.json>');
  process.exit(1);
}

const absolutePath = resolve(process.cwd(), filePath);
const input = JSON.parse(await readFile(absolutePath, 'utf8')) as OpportunityInput;
const result = analyzeOpportunity(input);

console.log(JSON.stringify(result, null, 2));
