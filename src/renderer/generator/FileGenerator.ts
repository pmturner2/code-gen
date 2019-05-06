const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
import fs from 'fs';
import { IInjectable, INewInjectable } from '../Types';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export async function generate(inputPath: string, outputPath: string, tokens: Map<string, string>) {
  try {
    const data = await readFileAsync(inputPath, {
      encoding: 'utf8',
    });

    const result = data.replace('__NAME__', 'GORF');
    await writeFileAsync('aoutput.txt', result, {
      encoding: 'utf8',
      flag: 'w+',
    });
    console.log('Success');
  } catch (error) {
    console.log('Error', error);
  }

  // fs.readdir('..', (err: any, data: any) => {
  //   console.log('readdir', data);
  // });
}

export async function addService(item: INewInjectable): Promise<void> {
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

  const template = await readTemplate('templates/file/Service._ts');
  const tokens = getStandardTokens(item);
  tokens.set('__DEPENDENCY_MEMBERS__', dependencyMembers);
  tokens.set('__CONSTRUCTOR_INJECTION__', ctorParams);
  tokens.set('__DEPENDENCY_IMPORTS__', depImports);
  tokens.set('__CONSTRUCTOR_MEMBER_ASSIGNMENTS__', memberAssignments);
  const result = replaceTokens(template, tokens);
  console.log(result);
  writeAndPrettify(result, 'services/fake/FakeService.ts');
}

export async function readTemplate(path: string): Promise<string> {
  const data = await readFileAsync(path, {
    encoding: 'utf8',
  });
  return data;
}

function lowercaseFirstLetter(str: string) {
  return `${str.charAt(0).toLowerCase()}${str.slice(1)}`;
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
  const template = await readTemplate(snippetFile);
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

  // Run ts-lint
  await exec(`${wfReactFolder}node_modules/.bin/tslint --fix ${wfReactSrcFolder}/${path}`);
}
