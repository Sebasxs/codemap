#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, openSync, readSync, closeSync, existsSync } from 'node:fs';
import { resolve, relative, join, basename, extname } from 'node:path';
import settings from '../settings.json' with { type: 'json' };
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

const isTextFile = (filePath) => {
    try {
        const fd = openSync(filePath, 'r');
        const buffer = Buffer.alloc(1024);
        const bytesRead = readSync(fd, buffer, 0, buffer.length, 0);
        closeSync(fd);
        
        if (bytesRead === 0) return true;
        
        return !buffer.subarray(0, bytesRead).includes(0);
    } catch (error) {
        return false;
    }
};

const addCommentBlock = (title, message) => {
    lines.push(`> ${normalizePath(title)}`, `> ${message}`);
    addSeparator();
};

const addBinaryPlaceholder = (filePath) => {
    const ext = extname(filePath).replace('.', '') || 'unknown';
    lines.push(`> ${normalizePath(filePath)}`, `> [Binary File] Type: ${ext} - Content omitted for readability`);
    addSeparator();
};

const addFileContent = filePath => {
    try {
        const content = readFileSync(filePath, 'utf8').trim();
        const ext = extname(filePath).replace('.', '');
        const quotes = ext === 'md' ? '"""' : '```';
        lines.push(`> ${normalizePath(filePath)}`, '', quotes + ext, content, quotes);
        addSeparator();
    } catch (e) {
        addBinaryPlaceholder(filePath);
    }
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

        if (settings.ignore.includes(entry.name)) continue;

        if (entry.isDirectory()) {
            walkDirectory(fullPath);
        } else if (entry.isFile()) {
           const ext = extname(entry.name).replace('.', '');
           
            if (!isTextFile(fullPath) || settings.onlyContext.includes(ext)) {
               addBinaryPlaceholder(fullPath);
            } else {
               addFileContent(fullPath);
            }
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