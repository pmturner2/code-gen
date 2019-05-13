const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
import fs from 'fs';
import { IInjectable, INewInjectable } from '../Types';
import { getStatementsFromFile } from './Utils';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export async function addServiceIdentifier(serviceIdentifier: string): Promise<void> {
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

export async function addBinding(item: IInjectable): Promise<void> {}

export async function generateService(item: INewInjectable): Promise<void> {
  try {
    await addServiceIdentifier(item.serviceIdentifier);

    await createInjectableClass(item, 'templates/file/Service._ts');
  } catch (error) {
    alert(`
    Error generating service ${item.name}
     ${error}
     `);
  }
}

export async function createInjectableClass(
  item: INewInjectable,
  fileTemplateFilename: string
): Promise<void> {
  const dependencyMembers = await getDependencyReplacement(
    'templates/snippets/DependencyMember._ts',
    item
  );
  const ctorParams = await getDependencyReplacement(
    'templates/snippets/ConstructorInjection._ts',
    item
  );
  const depImports = await getDependencyReplacement(
    'templates/snippets/ImportDependency._ts',
    item
  );
  const memberAssignments = await getDependencyReplacement(
    'templates/snippets/ConstructorMemberAssignment._ts',
    item
  );

  const template = await readFile(fileTemplateFilename);
  const tokens = getStandardTokens(item);
  tokens.set('__DEPENDENCY_MEMBERS__', dependencyMembers);
  tokens.set('__CONSTRUCTOR_INJECTION__', ctorParams);
  tokens.set('__DEPENDENCY_IMPORTS__', depImports);
  tokens.set('__CONSTRUCTOR_MEMBER_ASSIGNMENTS__', memberAssignments);
  const result = replaceTokens(template, tokens);

  writeAndPrettify(result, `${item.importPath}/${item.name}.ts`);
}

export async function readFile(path: string): Promise<string> {
  const data = await readFileAsync(path, {
    encoding: 'utf8',
  });
  return data;
}

function fixCase(item: IInjectable): IInjectable {
  return {
    ...item,
    importPath: item.importPath.toLowerCase(),
    interfaceName: uppercaseFirstLetter(item.interfaceName),
    name: uppercaseFirstLetter(item.name),
    serviceIdentifier: uppercaseFirstLetter(item.serviceIdentifier),
  };
}

export function lowercaseFirstLetter(str: string) {
  return `${str.charAt(0).toLowerCase()}${str.slice(1)}`;
}

export function uppercaseFirstLetter(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

function replaceTokens(str: string, tokens: Map<string, string>) {
  const re = new RegExp(Array.from(tokens.keys()).join('|'), 'gi');

  return str.replace(re, matched => tokens.get(matched));
}

function getStandardTokens(item: IInjectable): Map<string, string> {
  const tokens: Map<string, string> = new Map([
    ['__SERVICE_IDENTIFIER__', item.serviceIdentifier],
    ['__NAME__', item.name],
    ['__INTERFACE_NAME__', item.interfaceName],
    ['__CAMEL_CASE_NAME__', lowercaseFirstLetter(item.name)],
    ['__IMPORT_PATH__', item.importPath],
  ]);
  return tokens;
}

async function getDependencyReplacement(
  snippetFile: string,
  item: INewInjectable
): Promise<string> {
  const template = await readFile(snippetFile);
  return item.dependencies
    .map(dep => {
      return replaceTokens(template, getStandardTokens(dep));
    })
    .join('\n');
}

/**
 *
 * @param data data to be written
 * @param path output path, relative to `wf-react/src`
 */
async function writeAndPrettify(data: string, path: string): Promise<void> {
  const pathToFile = path.substr(0, path.lastIndexOf('/'));

  const tmpFolder = './.TMP/';
  const wfReactFolder = '../../';
  const wfReactSrcFolder = `${wfReactFolder}src/`;
  await fs.promises.mkdir(`${tmpFolder}/${pathToFile}`, { recursive: true });
  await writeFileAsync(`${tmpFolder}/${path}_ugly.ts`, data, {
    flag: 'w+',
  });
  await fs.promises.mkdir(`${wfReactSrcFolder}${pathToFile}`, { recursive: true });

  // Run prettier
  await exec(
    `${wfReactFolder}node_modules/.bin/prettier ${tmpFolder}/${path}_ugly.ts > ${wfReactSrcFolder}${path}`
  );

  // Run ts-lint fix
  await exec(`${wfReactFolder}node_modules/.bin/tslint --fix ${wfReactSrcFolder}/${path}`);
}
