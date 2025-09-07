#!/usr/bin/env node
import { readdirSync, readFileSync, createWriteStream, openSync, readSync, closeSync, existsSync } from 'node:fs';
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

const patternToRegex = (pattern) => {
    if (pattern.startsWith('#') || pattern.trim() === '') return null;
    
    let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    
    escaped = escaped.replace(/\?/g, '.').replace(/\*/g, '.*');
    
    if (escaped.endsWith('/')) {
        escaped = escaped.slice(0, -1);
    }
    if (escaped.startsWith('/')) {
        return new RegExp(`^${escaped.slice(1)}$`);
    }
    
    return new RegExp(`^${escaped}$`);
};

const parseGitIgnore = (dirPath) => {
    const gitIgnorePath = join(dirPath, '.gitignore');
    if (!existsSync(gitIgnorePath)) return [];

    try {
        const content = readFileSync(gitIgnorePath, 'utf8');
        return content
            .split(/\r?\n/)
            .map(line => line.trim())
            .map(patternToRegex)
            .filter(regex => regex !== null);
    } catch (e) {
        return [];
    }
};

const isIgnored = (name, ignorePatterns) => {
    if (settings.ignore.includes(name)) return true;
    if (name.startsWith('.env')) return true;
    const sensitiveExtensions = ['.pem', '.key', '.p12', '.pfx', '.cert', '.crt', '.csr'];

    if (sensitiveExtensions.some(ext => name.endsWith(ext))) return true;
    return ignorePatterns.some(regex => regex.test(name));
};

const processDirectory = (dirPath, stream, parentIgnores = []) => {
    const localIgnores = parseGitIgnore(dirPath);
    const splitIgnores = [...parentIgnores, ...localIgnores];

    let entries;
    try {
        entries = readdirSync(dirPath, { withFileTypes: true }).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    } catch (e) {
        stream.write(`> [Error reading directory: ${dirPath}]\n\n---\n\n`);
        return 0;
    }

    let fileCount = 0;

    for (const entry of entries) {
        if (isIgnored(entry.name, splitIgnores)) continue;

        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
            fileCount += processDirectory(fullPath, stream, splitIgnores);
        } else if (entry.isFile()) {
            addFileToStream(fullPath, stream);
            fileCount++;
        }
    }
    return fileCount;
};

const addFileToStream = (filePath, stream) => {
    const relativeName = normalizePath(filePath);
    const ext = extname(filePath).replace('.', '') || 'txt';
    
    if (settings.onlyContext.includes(ext) || !isTextFile(filePath)) {
        stream.write(`> ${relativeName}\n> [Binary/Context File] Type: ${ext} - Content omitted.\n\n---\n\n`);
        return;
    }

    try {
        const content = readFileSync(filePath, 'utf8').trim();
        const quotes = ext === 'md' ? '"""' : '```';
        stream.write(`> ${relativeName}\n\n${quotes}${ext}\n${content}\n${quotes}\n\n---\n\n`);
    } catch (e) {
        stream.write(`> ${relativeName}\n> [Error reading file]\n\n---\n\n`);
    }
};

const main = () => {
    console.log(`Scanning: ${basePath}`);
    
    const defaultOutput = join(
        os.homedir(),
        'Downloads',
        inputPath.replace(':', '').replace(/\\/g, '_') + '.md',
    );
    const outputFile = resolve(outputPath || defaultOutput);
    const stream = createWriteStream(outputFile, { encoding: 'utf8' });

    stream.write(`# Project Context: ${basename(basePath)}\n\n`);
    
    const fileCount = processDirectory(basePath, stream);

    stream.write(`# Statistics\n\n- Total Files: ${fileCount}\n`);

    stream.end(() => {
        console.log(`Context generated and saved to: ${outputFile}`);
    });
};

main();