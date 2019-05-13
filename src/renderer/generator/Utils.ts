const { promisify } = require('util');
import fs from 'fs';
import { IInjectable, ImportMap } from '../Types';
const readFileAsync = promisify(fs.readFile);

/**
 *
 * @param fileLines lines of the .ts file, assumed to be grouped as valid statements
 *
 * @returns Map of each imported item to its file path.
 */
export function getImportMap(fileLines: string[]): ImportMap {
  // Lines importing a Service
  const importLines = fileLines.filter((l: string) => l.startsWith('import'));

  // Maps each imported object to its file
  const importMap: ImportMap = new Map();
  importLines.forEach((line: string) => {
    const tokens = line.split(/import|from|[\n'\{\};\)\( ,]/g).filter((token: string) => !!token);
    if (tokens.length > 0) {
      for (let i = 0; i < tokens.length - 1; ++i) {
        const filename = tokens[tokens.length - 1];
        importMap.set(tokens[i], filename);
      }
    }
  });

  return importMap;
}

export function getImportMapFromFileBody(fileBody: string): ImportMap {
  const lines = fileBody.split(';').map((l: string) => l.trim());
  return getImportMap(lines);
}

export function getBoundInjectables(fileLines: string[], importMap: ImportMap): IInjectable[] {
  // Lines binding a Service. Use this to build our list of valid services.
  const bindLines = fileLines.filter((l: string) => l.startsWith('bind'));
  const result = bindLines
    .map((line: string) => {
      const tokens = line.split(/bind|[<>;\)\( ,]/g).filter((token: string) => !!token);
      if (tokens.length === 3) {
        return {
          importPath: importMap.get(tokens[0]) || 'UNKNOWN',
          interfaceName: tokens[0],
          name: tokens[1],
          serviceIdentifier: tokens[2],
        };
      }
      return null;
    })
    .sort((a: IInjectable, b: IInjectable) => (a.serviceIdentifier < b.serviceIdentifier ? -1 : 1));
  return result;
}

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
    console.log('Error', error);
  }

  return [];
}
