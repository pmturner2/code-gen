const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
import * as child_process from 'child_process';
import * as diff from 'diff';
import fs from 'fs';
import * as prettier from 'prettier';
import { kTmpFolder, kWfReactFolder } from '../Constants';
import { ImportMap } from '../Types';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

/**
 * From the given statements, builds a map of each import to the file path
 *
 * @param fileLines lines of the .ts file, assumed to be grouped as valid statements
 *
 * @returns Map of each imported item to its file path.
 */
export function getImportMap(fileLines: string[]): ImportMap {
  const importLines = fileLines.filter((l: string) => l.startsWith('import'));

  // Maps each imported object to its file
  const importMap: ImportMap = new Map();
  importLines.forEach((line: string) => {
    const tokens = line.split(/import|from|[\n'\{\};\)\( ,]/g).filter((token: string) => !!token);
    if (tokens.length > 0) {
      // Iterate over all tokens except the last one, which is the filename.
      // Set a mapping of each imported item.
      //
      // NOTE: this does not differentiate between `default` imports and others, so
      // we will need to augment this if that support is required.
      for (let i = 0; i < tokens.length - 1; ++i) {
        const filename = tokens[tokens.length - 1];
        importMap.set(tokens[i], filename);
      }
    }
  });

  return importMap;
}

/**
 * Reads file, and splits into an array of tokens. Semicolon is used as the delimiter when reading.
 *
 * @param path path to the file
 * @param trim if true, will trim whitespace
 */
export async function getTokensFromFile(
  path?: string,
  trim?: boolean,
  delimeter?: string,
): Promise<string[]> {
  try {
    const data = await readFileAsync(path, {
      encoding: 'utf8',
    });
    // Lines in the file
    const lines = data.split(delimeter || ';');
    if (trim) {
      return lines.map((l: string) => l.trim());
    }
    return lines;
  } catch (error) {
    throw new Error(`Error getTokensFromFile ${path}: ${error}`);
  }
}

/**
 * Read a 'utf8' file async
 *
 * @param path file to read from
 */
export async function readFile(path: string): Promise<string> {
  const data = await readFileAsync(path, {
    encoding: 'utf8',
  });
  return data;
}

/**
 * Returns a new string with the first letter lowercase
 *
 * @param str string to lowercase
 */
export function lowercaseFirstLetter(str: string) {
  return `${str.charAt(0).toLowerCase()}${str.slice(1)}`;
}

/**
 * Returns a new string with the first letter uppercase
 *
 * @param str string to uppercase
 */
export function uppercaseFirstLetter(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

const toDeleteRegex = /([^a-zA-Z0-9])/g;
const wsRegex = /\s/g;
const underscorePrefixRegex = /_[a-z]/g;
const underscoreRegex = /_/g;
const firstCharRegex = /^[a-zA-Z]/;
const lastLetterS = /[sS]$/;

export function generateCapitalizedCamelCaseName(input: string): string {
  return `${input
    .replace(toDeleteRegex, '_')
    .replace(wsRegex, '_')
    .replace(underscorePrefixRegex, match => match[1].toUpperCase())
    .replace(underscoreRegex, '')
    .replace(firstCharRegex, match => match.toUpperCase())}`;
}

export function generateInterfaceName(input: string): string {
  return `I${generateCapitalizedCamelCaseName(input).replace(lastLetterS, '')}`;
}

/**
 * Replaces all of the `keys` from the map with `values` within the input string.
 *
 * @param str string to replace within
 * @param tokens token mappings.
 */
export function replaceTokens(str: string, tokens: Map<string, string>) {
  const re = new RegExp(Array.from(tokens.keys()).join('|'), 'gi');
  return str.replace(re, matched => tokens.get(matched));
}

export interface ILineWithComments {
  line?: string;
  commentBefore?: string;
  commentEnd?: string;
}

export function separateCommentsFromLines(str: string): ILineWithComments[] {
  const result: ILineWithComments[] = [];
  const lines = str.split(/[\n]/g);

  let commentBefore = [];
  for (const line of lines) {
    if (line.trim().startsWith('//')) {
      commentBefore.push(line);
    } else {
      const endOfLineIndex = line.indexOf('//');
      result.push({
        line, // includes commentEnd
        commentBefore: commentBefore.length !== 0 ? commentBefore.join('\n') : undefined,
        commentEnd: endOfLineIndex !== -1 ? line.substr(endOfLineIndex) : undefined,
      });
      commentBefore = [];
    }
  }
  return result;
}

export function reconstructCommentsAndLines(lineWithComments: ILineWithComments): string {
  const result = [];
  if (lineWithComments.commentBefore) {
    result.push(lineWithComments.commentBefore);
  }
  result.push(lineWithComments.line);
  return result.join('\n');
}

export async function updateJson(
  filename: string,
  newKey: string,
  newValue: any,
): Promise<() => void> {
  const fileContents = await readFile(filename);
  const jsonObject = JSON.parse(fileContents);
  jsonObject[newKey] = newValue;
  const result = JSON.stringify(jsonObject, null, 2);
  return writeAndPrettify(result, filename);
}

/**
 * Write data to a temporary file named `filename`. Will create if it doesn't exist.
 * Synchronous function because it is used as a helper in synchronous typescript api code.
 * Returns path the output file.
 *
 * @param data data to be written
 * @param filename filename within local TEMP folder
 *
 */
export function writeTempData(data: string, filename: string): string {
  try {
    const tmpFile = `${kTmpFolder}/${filename}`;

    // Make sure folder exists in the temp space
    fs.mkdir(kTmpFolder, { recursive: true }, () => {});

    // Write the raw, unlinted / prettified file contents to a temporary space.
    fs.writeFileSync(tmpFile, data, {
      flag: 'w+',
    });
    return tmpFile;
  } catch (error) {
    throw new Error(`Error writeTempData ${filename}: ${error}`);
  }
}

/**
 * Write data to a file at `path`. Will create if it doesn't exist.
 * Runs `prettier` and `eslint` on the output.
 *
 * @param data data to be written
 * @param path output path, relative to `wf-react/src`
 *
 * @returns a Promise to execute to finalize the output.
 */
export async function writeAndPrettify(data: string, path: string): Promise<() => void> {
  try {
    const extension = path.substr(path.lastIndexOf('.') + 1);
    const pathToFile = path.substr(0, path.lastIndexOf('/'));
    const filename = path.substr(path.lastIndexOf('/'));

    const tmpPath = `${kTmpFolder}/${pathToFile.replace(/\.\./gi, () => '.')}`;
    const tmpFile = `${tmpPath}/${filename}_ugly.${extension}`;

    // Make sure folder exists in the temp space
    await fs.promises.mkdir(tmpPath, { recursive: true });

    // Run prettier
    const prettyData = prettierFormat(data);

    // Write the raw, unlinted / prettified file contents to a temporary space.
    await writeFileAsync(tmpFile, prettyData, {
      flag: 'w+',
    });

    // Return a function to finalize the output from TMP.
    return async () => {
      // Write to final output
      await fs.promises.mkdir(`${pathToFile}`, { recursive: true });
      await exec(`mv ${tmpFile} ${path}`);

      // Need to run eslint on the final output, since the linter setup ignores our temp folder.
      child_process.execSync(
        `${kWfReactFolder}/node_modules/.bin/eslint --fix --rulesdir ${kWfReactFolder}/tools/code-gen --rule 'lines-between-class-members: 2' ${path}`,
      );
    };
  } catch (error) {
    throw new Error(`Error writeAndPrettify ${path}: ${error}`);
  }
}

export function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
  const result = new Map();
  map.forEach((v, k) => {
    result.set(k, v);
  });
  return result;
}

export function cloneSet<V>(set: Set<V>): Set<V> {
  const result = new Set<V>();
  set.forEach(v => {
    result.add(v);
  });
  return result;
}

export function prettierFormat(text: string): string {
  return prettier.format(text, {
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    parser: 'typescript',
    printWidth: 100,
    tabWidth: 2,
  });
}

/**
 * Restores the blank lines stripped by the typescript compiler.
 *
 * @param oldText original .ts source
 * @param newText updated .ts source
 */
export function restoreWhitespace(oldText: string, newText: string): string {
  const patch = diff.parsePatch(diff.createPatch('file', oldText, newText, '', ''));
  const hunks = patch[0].hunks;
  for (let i = 0; i < hunks.length; ++i) {
    let lineOffset = 0;
    const hunk = hunks[i];
    hunk.lines = hunk.lines.map((line: string) => {
      if (line === '-') {
        lineOffset++;
        return ' ';
      }
      return line;
    });
    hunk.newLines += lineOffset;
    for (let j = i + 1; j < hunks.length; ++j) {
      hunks[j].newStart += lineOffset;
    }
  }
  return diff.applyPatch(oldText, patch as [diff.ParsedDiff])
}
