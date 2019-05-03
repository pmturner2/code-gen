const { promisify } = require('util');
import fs from 'fs';
import { IInjectable } from '../IInjectable';
import { getBoundInjectables, getImportMap } from './Utils';
const readFileAsync = promisify(fs.readFile);
// const writeFileAsync = promisify(fs.writeFile);

export async function getServices(
  inputPath?: string // Should point to the dependencyContainer.services.ts file
): Promise<IInjectable[]> {
  try {
    const path = inputPath || '../../src/app/DependencyContainer.Services.ts';
    const data = await readFileAsync(path, {
      encoding: 'utf8',
    });
    // Lines in the file
    const lines = data.split(';').map((l: string) => l.trim());

    // Maps each imported object to its file
    const importMap = getImportMap(lines);
    return getBoundInjectables(lines, importMap);
  } catch (error) {
    console.log('Error', error);
  }

  return [];
}
