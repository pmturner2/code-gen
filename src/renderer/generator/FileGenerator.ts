import {
  kAppTypesPath,
  kDomainStoreDependencyContainerPath,
  kDomainStoreTemplateFile,
  kScreenStoreDependencyContainerPath,
  kScreenStoreTemplateFile,
  kServiceDependencyContainerPath,
  kServiceTemplateFile,
  kWfReactSrcFolder,
} from '../Constants';
import { IInjectable, INewInjectable } from '../Types';
import {
  getStatementsFromFile,
  lowercaseFirstLetter,
  readFile,
  replaceTokens,
  writeAndPrettify,
} from './Utils';

/**
 * Gets category from serviceIdentifier
 * e.g. `ServiceTypes` from `ServiceTypes.Game`
 */
function getServiceCategory(serviceIdentifier: string): string {
  return serviceIdentifier.split('.')[0];
}

async function updateAppTypes(serviceIdentifier: string): Promise<void> {
  const categoryMapping = new Map<string, string>([
    ['ServiceTypes', 'Service'],
    ['DomainStoreTypes', 'Domain'],
    ['ScreenStoreTypes', 'Screen'],
  ]);
  const [category, serviceName] = serviceIdentifier.split('.');
  const lines = await getStatementsFromFile(kAppTypesPath);
  const newLines: string[] = [];
  lines.forEach(line => {
    if (line.includes(`const ${category} = `)) {
      const body = line.substr(line.indexOf('{'));
      const entries = body
        .split(/[,;}{}\n]/g)
        .map(entry => entry.trim())
        .filter(entry => entry);
      entries.forEach(entry => {
        if (entry.includes(serviceName)) {
          throw new Error('ServiceIdentifier already exists');
        }
      });
      entries.push(`${serviceName}: '${categoryMapping.get(category)}.${serviceName}'`);

      entries.sort();
      newLines.push(`const ${category} = {${entries.join(',')} }`);
    } else {
      newLines.push(line);
    }
  });
  const result = newLines.join(';');
  writeAndPrettify(result, kAppTypesPath);
}

async function addToDependencyContainerSection(
  lines: string[],
  item: IInjectable,
  lineFilter: (line: string) => boolean,
  snippetFile: string,
  sort?: boolean,
): Promise<string[]> {
  const relevantLines = lines.filter(line => lineFilter(line));
  const template = await readFile(snippetFile);
  const tokens = getStandardTokens(item);
  const newImport = replaceTokens(template, tokens);
  relevantLines.push(newImport);
  if (sort) {
    return relevantLines.sort();
  }
  return relevantLines;
}
/**
 * Updates DependencyContainer and writes a new binding.
 *
 * @param injectable Injectable to add
 * @param filePath path to the DependencyContainer file
 * @param forceInit if true, will add a `DependencyContainer.get` to force init of the Injectable
 */
async function updateDependencyContainer(
  item: IInjectable,
  filePath: string,
  forceInit: boolean,
): Promise<void> {
  const lines = await getStatementsFromFile(filePath);

  // Add `import`
  const importLines = await addToDependencyContainerSection(
    lines,
    item,
    (line: string) => line.startsWith('import'),
    'templates/snippets/ImportInterfaceAndConcrete._ts',
    true,
  );

  // Add `bind`
  const bindLines = await addToDependencyContainerSection(
    lines,
    item,
    (line: string) => line.trim().startsWith('bind'),
    'templates/snippets/DependencyBinding._ts',
  );

  const forceInitLines = forceInit
    ? await addToDependencyContainerSection(
        lines,
        item,
        (line: string) => line.trim().startsWith('DependencyContainer.get'),
        'templates/snippets/DependencyForceInit._ts',
      )
    : [];

  let newLines: string[] = [];
  let addedImports = false;
  let addedBindings = false;
  let addedForceInit = false;
  lines.forEach(line => {
    if (line.startsWith('import')) {
      if (!addedImports) {
        newLines = newLines.concat(importLines);
        addedImports = true;
      }
    } else if (line.trim().startsWith('bind')) {
      if (!addedBindings) {
        newLines = newLines.concat(bindLines);
        addedBindings = true;
      }
    } else if (line.trim().startsWith('DependencyContainer.get')) {
      if (!addedForceInit) {
        newLines = newLines.concat(forceInitLines);
        addedForceInit = true;
      }
    } else {
      newLines.push(line);
    }
  });
  const result = newLines.join(';');
  writeAndPrettify(result, filePath);
}

/**
 * Generates a new injectable class (Service, DomainStore, ScreenStore)
 *
 * @param item params to generate from
 * @param fileTemplateFilename template to build from
 */
async function writeInjectableClass(
  item: INewInjectable,
  fileTemplateFilename: string,
): Promise<void> {
  const dependencyMembers = await getDependencyReplacement(
    'templates/snippets/DependencyMember._ts',
    item,
  );
  const ctorParams = await getDependencyReplacement(
    'templates/snippets/ConstructorInjection._ts',
    item,
  );
  const depImports = await getDependencyReplacement(
    'templates/snippets/ImportDependency._ts',
    item,
  );
  const memberAssignments = await getDependencyReplacement(
    'templates/snippets/ConstructorMemberAssignment._ts',
    item,
  );

  const typeImportSet = new Set<string>();
  typeImportSet.add(getServiceCategory(item.serviceIdentifier));
  item.dependencies.forEach((dep: IInjectable) => {
    typeImportSet.add(getServiceCategory(dep.serviceIdentifier));
  });
  const typeImports = Array.from(typeImportSet).join(',');
  const injectImport = item.dependencies.length === 0 ? '' : 'inject, ';

  const template = await readFile(fileTemplateFilename);
  const tokens = getStandardTokens(item);
  tokens.set('__DEPENDENCY_MEMBERS__', dependencyMembers);
  tokens.set('__CONSTRUCTOR_INJECTION__', ctorParams);
  tokens.set('__DEPENDENCY_IMPORTS__', depImports);
  tokens.set('__CONSTRUCTOR_MEMBER_ASSIGNMENTS__', memberAssignments);
  tokens.set('__TYPE_IMPORTS__', typeImports);
  tokens.set('__INJECT_IMPORT__', injectImport);
  const result = replaceTokens(template, tokens);

  // Write output
  writeAndPrettify(result, `${kWfReactSrcFolder}/${item.importPath}/${item.name}.ts`);
}

/**
 * Generates a map of tokens from the template to their replacement.
 * This is used to populate the file template later.
 *
 * @param item Item to build the map from
 */
function getStandardTokens(item: IInjectable): Map<string, string> {
  return new Map([
    ['__SERVICE_IDENTIFIER__', item.serviceIdentifier],
    ['__NAME__', item.name],
    ['__INTERFACE_NAME__', item.interfaceName],
    ['__CAMEL_CASE_NAME__', lowercaseFirstLetter(item.name)],
    ['__IMPORT_PATH__', item.importPath],
  ]);
}

/**
 * For a particular snippet, populate the output with the item's dependencies
 * e.g. this could build a string for all of the imports that a service depends on
 *
 * @param snippetFile template snippet to build from
 * @param item item whose dependencies will be generated.
 */
async function getDependencyReplacement(
  snippetFile: string,
  item: INewInjectable,
): Promise<string> {
  const template = await readFile(snippetFile);
  return item.dependencies
    .map(dep => {
      return replaceTokens(template, getStandardTokens(dep));
    })
    .join('\n');
}

/**
 * Generates a new `Service` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
export async function generateService(item: INewInjectable): Promise<void> {
  return generateInjectableClass(
    item,
    kServiceDependencyContainerPath,
    kServiceTemplateFile,
    false,
  );
}

/**
 * Generates a new `DomainStore` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
export async function generateDomainStore(item: INewInjectable): Promise<void> {
  return generateInjectableClass(
    item,
    kDomainStoreDependencyContainerPath,
    kDomainStoreTemplateFile,
    true,
  );
}

/**
 * Generates a new `DomainStore` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
export async function generateScreenStore(item: INewInjectable): Promise<void> {
  return generateInjectableClass(
    item,
    kScreenStoreDependencyContainerPath,
    kScreenStoreTemplateFile,
    true,
  );
}

/**
 * Generates a new `DomainStore` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
async function generateInjectableClass(
  item: INewInjectable,
  dependencyContainerPath: string,
  fileTemplate: string,
  forceDependencyInit: boolean,
): Promise<void> {
  try {
    // Add a ServiceIdentifier for the new Injectable to `Types.ts`
    await updateAppTypes(item.serviceIdentifier);

    // Adds a call to `bind` the injectable in the DependencyContainer class
    await updateDependencyContainer(item, dependencyContainerPath, forceDependencyInit);

    // Generates the new class from the template
    await writeInjectableClass(item, fileTemplate);
  } catch (error) {
    throw new Error(`Error generating injectable ${item.name}: ${error}`);
  }
}
