import { kServiceTemplateFile } from '../Constants';
import { IInjectable, INewInjectable } from '../Types';
import {
  getStatementsFromFile,
  lowercaseFirstLetter,
  readFile,
  replaceTokens,
  writeAndPrettify,
} from './Utils';
async function writeServiceIdentifier(serviceIdentifier: string): Promise<void> {
  const mapping = new Map<string, string>([
    ['ServiceTypes', 'Service'],
    ['DomainStoreTypes', 'Domain'],
    ['ScreenStoreTypes', 'Screen'],
  ]);
  const [category, serviceName] = serviceIdentifier.split('.');
  const path = '../../src/app/Types.ts';
  const lines = await getStatementsFromFile(path);
  const newLines: string[] = [];
  lines.forEach(line => {
    console.log(`Looking at *${line}*`);
    if (line.includes(serviceIdentifier)) {
      // Service Identifier already exists.
      throw new Error('ServiceIdentifier already exists');
    }
    if (line.includes(`const ${category} = `)) {
      const body = line.substr(line.indexOf('{'));
      const entries = body
        .split(/[,;}{}\n]/g)
        .map(entry => entry.trim())
        .filter(entry => entry);
      entries.push(`${serviceName}: '${mapping.get(category)}.${serviceName}'`);
      entries.sort();
      newLines.push(`const ${category} = {${entries.join(',')} }`);
    } else {
      newLines.push(line);
    }
  });
  const result = newLines.join(';');
  writeAndPrettify(result, 'app/Types.ts');
}

/**
 * Generates a new injectable class (Service, DomainStore, ScreenStore)
 *
 * @param item params to generate from
 * @param fileTemplateFilename template to build from
 */
async function generateInjectableClass(
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

  const template = await readFile(fileTemplateFilename);
  const tokens = getStandardTokens(item);
  tokens.set('__DEPENDENCY_MEMBERS__', dependencyMembers);
  tokens.set('__CONSTRUCTOR_INJECTION__', ctorParams);
  tokens.set('__DEPENDENCY_IMPORTS__', depImports);
  tokens.set('__CONSTRUCTOR_MEMBER_ASSIGNMENTS__', memberAssignments);
  const result = replaceTokens(template, tokens);

  // Write output
  writeAndPrettify(result, `${item.importPath}/${item.name}.ts`);
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
  try {
    try {
      // Add a ServiceIdentifier for the new Injectable to `Types.ts`
      await writeServiceIdentifier(item.serviceIdentifier);
    } catch (error) {
      if (error !== 'ServiceIdentifier already exists') {
        throw error;
      }
    }

    // Generates the new class from the template
    await generateInjectableClass(item, kServiceTemplateFile);

    // TODO: add binding.
  } catch (error) {
    throw new Error(`Error generating service ${item.name}: ${error}`);
  }
}
