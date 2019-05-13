const { promisify } = require('util');
import fs from 'fs';
import { IInjectable } from '../Types';
import { getBoundInjectables, getImportMap, getStatementsFromFile } from './Utils';
const readFileAsync = promisify(fs.readFile);
// const writeFileAsync = promisify(fs.writeFile);

export async function getServices(
  inputPath?: string // Should point to the dependencyContainer.services.ts file
): Promise<IInjectable[]> {
  try {
    const path = inputPath || '../../src/app/DependencyContainer.Services.ts';

    // Lines in the file
    const lines = await getStatementsFromFile(path, true);

    // Maps each imported object to its file
    const importMap = getImportMap(lines);
    return getBoundInjectables(lines, importMap);
  } catch (error) {
    console.log('Error', error);
  }

  return [];
}
