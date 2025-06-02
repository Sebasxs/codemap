#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, relative, join, basename, extname } from 'node:path';
import ignore from '../ignore.json' with { type: 'json' };
import os from 'node:os';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath) {
   throw new Error('A path is required as the first argument.');
}

const basePath = resolve(inputPath);
if (!existsSync(basePath)) {
   throw new Error(`The specified path does not exist: ${basePath}`);
}

const baseFolder = basename(basePath) + '/';
const normalizePath = path => baseFolder + relative(basePath, path).replace(/\\/g, '/');

const lines = [];

const addSeparator = () => lines.push('', '---', '');

const addCommentBlock = (title, message) => {
   lines.push(`> ${normalizePath(title)}`, `> ${message}`);
   addSeparator();
};

const addFileContent = filePath => {
   const content = readFileSync(filePath, 'utf8').trim();
   const ext = extname(filePath).replace('.', '');
   const quotes = ext === 'md' ? '"""' : '```';
   lines.push(`> ${normalizePath(filePath)}`, '', quotes + ext, content, quotes);
   addSeparator();
};

const walkDirectory = dirPath => {
   const entries = readdirSync(dirPath, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
   );

   if (entries.length === 0) {
      return addCommentBlock(dirPath, 'empty directory; work in progress...');
   }

   for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
         const isIgnoredDir = ignore.dirs.includes(entry.name);
         if (isIgnoredDir) continue;
         walkDirectory(fullPath);
      } else if (entry.isFile()) {
         const isIgnoredFile = ignore.files.includes(entry.name);
         if (isIgnoredFile) continue;
         addFileContent(fullPath);
      }
   }
};

const main = () => {
   const defaultOutput = join(
      os.homedir(),
      'Downloads',
      inputPath.replace(':', '').replace(/\\/g, '_') + '.md',
   );

   const outputFile = resolve(outputPath || defaultOutput);
   walkDirectory(basePath);
   writeFileSync(outputFile, lines.join('\n'), 'utf8');
   console.log(`Context generated and saved to: ${outputFile}`);
};

main();
