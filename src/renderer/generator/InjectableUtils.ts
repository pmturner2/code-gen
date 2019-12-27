import {
  InjectableCategory,
  kDomainStoreDependencyContainerPath,
  kScreenStoreDependencyContainerPath,
  kServiceDependencyContainerPath,
} from '../Constants';
import { IInjectable, ImportMap } from '../Types';
import { getImportMap, getTokensFromFile } from './Utils';

/**
 * Designed for use with DependencyContainer classes.
 * Looks for calls to `bind` and builds an array of all injectabless in the file body.
 *
 * @param fileLines relevant lines from the file
 * @param importMap mapping of classes to their file
 *
 * @returns Array of `IInjectable` objects in the file
 */
export function getBoundInjectables(fileLines: string[], importMap: ImportMap): IInjectable[] {
  // Lines binding a Service. Use this to build our list of valid services.
  const bindLines = fileLines.filter((l: string) => l.startsWith('bind'));
  const result = bindLines
    .map((line: string) => {
      const tokens = line
        .trim()
        .split(/bind|[<>;\)\( ,\n]/g)
        .filter((token: string) => !!token);
      if (tokens.length === 3) {
        return {
          importPath: importMap.get(tokens[0]) || 'UNKNOWN',
          interfaceName: tokens[0],
          name: tokens[1],
          serviceIdentifier: tokens[2],
        };
      } else {
        throw new Error('Error parsing line: ' + line);
      }
    })
    .sort((a: IInjectable, b: IInjectable) => (a.serviceIdentifier < b.serviceIdentifier ? -1 : 1));
  return result;
}

/**
 * Designed for use with DependencyContainer classes.
 * Looks for calls to `bind` and builds an array of all injectabless in the file body.
 *
 * @param inputPath path to input file
 *
 * @returns Array of `IInjectable` objects in the file
 */
export async function getBoundInjectablesFromFile(
  inputPath?: string, // Should point to a DependencyContainer.*.ts file
): Promise<IInjectable[]> {
  try {
    // Lines in the file
    const lines = await getTokensFromFile(inputPath, true);
    // Maps each imported object to its file
    const importMap = getImportMap(lines);
    return getBoundInjectables(lines, importMap);
  } catch (error) {
    throw new Error(`Error getting bound injectables from ${inputPath}: ${error}`);
  }
}

export async function getAvailableInjectables(
  category: InjectableCategory,
): Promise<IInjectable[]> {
  switch (category) {
    case 'Service':
      return await getBoundInjectablesFromFile(kServiceDependencyContainerPath);
    case 'DomainStore':
      return await getBoundInjectablesFromFile(kDomainStoreDependencyContainerPath);
    case 'ScreenStore':
      return await getBoundInjectablesFromFile(kScreenStoreDependencyContainerPath);
  }
}
