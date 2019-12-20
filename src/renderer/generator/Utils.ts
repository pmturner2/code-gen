const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
import fs from 'fs';
import { kTmpFolder, kWfReactFolder, kWfReactSrcFolder } from '../Constants';
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
 * For the body of a file, build a map of each import to the file path
 *
 * @param fileBody string contents of a file
 *
 * @returns Map of each imported item to its file path.
 */
export function getImportMapFromFileBody(fileBody: string): ImportMap {
  const lines = fileBody.split(';').map((l: string) => l.trim());
  return getImportMap(lines);
}

/**
 * Reads file, and splits into an array of statements... which can be treated as the
 * relevant lines of the file. Semicolon is used as the delimiter when reading.
 *
 * @param path path to the file
 * @param trim if true, will trim whitespace
 */
export async function getStatementsFromFile(path?: string, trim?: boolean): Promise<string[]> {
  try {
    const data = await readFileAsync(path, {
      encoding: 'utf8',
    });
    // Lines in the file
    const lines = data.split(';');
    if (trim) {
      return lines.map((l: string) => l.trim());
    }
    return lines;
  } catch (error) {
    console.log('Error in getStatementsFromFile', error);
  }

  return [];
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

/**
 * Write data to a file at `path`. Will create if it doesn't exist.
 * Runs `prettier` and `eslint` on the output.
 *
 * @param data data to be written
 * @param path output path, relative to `wf-react/src`
 */
export async function writeAndPrettify(data: string, path: string): Promise<void> {
  const pathToFile = path.substr(0, path.lastIndexOf('/'));

  // Make sure folder exists in the temp space
  await fs.promises.mkdir(`${kTmpFolder}/${pathToFile}`, { recursive: true });

  // Write the raw, unlinted / prettified file contents to a temporary space.
  await writeFileAsync(`${kTmpFolder}/${path}_ugly.ts`, data, {
    flag: 'w+',
  });

  await fs.promises.mkdir(`${kWfReactSrcFolder}/${pathToFile}`, { recursive: true });

  // Run prettier
  await exec(
    `${kWfReactFolder}/node_modules/.bin/prettier ${kTmpFolder}/${path}_ugly.ts > ${kWfReactSrcFolder}/${path}`,
  );

  // Run eslint --fix
  await exec(`${kWfReactFolder}/node_modules/.bin/eslint --fix ${kWfReactSrcFolder}/${path}`);
}
