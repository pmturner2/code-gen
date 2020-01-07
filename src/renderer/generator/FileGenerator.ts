import {
  InjectableCategory,
  kAppTypesPath,
  kDomainStoreDependencyContainerPath,
  kDomainStoreTemplateFile,
  kScreenStoreDependencyContainerPath,
  kScreenStoreTemplateFile,
  kServiceApiTemplateFile,
  kServiceDependencyContainerPath,
  kServiceTemplateFile,
  kWfReactSrcFolder,
} from '../Constants';
import {
  IInjectable,
  INewInjectable,
  INewService,
  IProgressStep,
  IZsrRequest,
  ProgressStepStatus,
  ZsrRequestService,
} from '../Types';
import { generateInterfaceFromJson } from './TypescriptUtils';
import {
  getTokensFromFile,
  lowercaseFirstLetter,
  readFile,
  reconstructCommentsAndLines,
  replaceTokens,
  separateCommentsFromLines,
  writeAndPrettify,
} from './Utils';

/**
 * Gets category from serviceIdentifier
 * e.g. `ServiceTypes` from `ServiceTypes.Game`
 */
function getServiceCategory(serviceIdentifier: string): string {
  return serviceIdentifier.split('.')[0];
}

async function updateAppTypes(serviceIdentifier: string): Promise<() => void> {
  const categoryMapping = new Map<string, string>([
    ['ServiceTypes', 'Service'],
    ['DomainStoreTypes', 'Domain'],
    ['ScreenStoreTypes', 'Screen'],
  ]);
  const [category, serviceName] = serviceIdentifier.split('.');
  const lines = await getTokensFromFile(kAppTypesPath);
  const newLines: string[] = [];

  const newEntry = `${serviceName}: '${categoryMapping.get(category)}.${serviceName}'`;

  lines.forEach(line => {
    if (line.includes(`const ${category} = `)) {
      const openCurlyBraceIndex = line.indexOf('{');
      const closeCurlyBraceIndex = line.indexOf('}');
      const categorySection = [line.substr(0, openCurlyBraceIndex + 1)];
      const body = line.substr(
        openCurlyBraceIndex + 1,
        closeCurlyBraceIndex - openCurlyBraceIndex - 1,
      );
      const linesAndComments = separateCommentsFromLines(body);
      linesAndComments.forEach(lineWithComments => {
        if (lineWithComments.line.includes(newEntry)) {
          throw new Error('ServiceIdentifier already exists');
        }
      });

      linesAndComments.push({ line: `${newEntry}, ` });
      linesAndComments.sort((a, b) => (a.line.trim() < b.line.trim() ? -1 : 1));

      categorySection.push(linesAndComments.map(reconstructCommentsAndLines).join('\n'));

      categorySection.push(` }\n`);
      newLines.push(categorySection.join('\n'));
    } else {
      newLines.push(line);
    }
  });
  const output = newLines.join(';');
  return writeAndPrettify(output, kAppTypesPath);
}

async function generateImport(item: IInjectable, includeConcrete?: boolean): Promise<string> {
  const snippetFile = includeConcrete
    ? 'templates/snippets/ImportInterfaceAndConcrete._ts'
    : 'templates/snippets/ImportInterface._ts';
  return readAndReplaceTokens(item, snippetFile);
}

async function readAndReplaceTokens(item: IInjectable, snippetFile: string): Promise<string> {
  const template = await readFile(snippetFile);
  const tokens = getStandardTokens(item);
  return replaceTokens(template, tokens);
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
): Promise<() => void> {
  const lines = await getTokensFromFile(filePath);

  let newImport = await generateImport(item, true);
  let newBind = await readAndReplaceTokens(item, 'templates/snippets/DependencyBinding._ts');
  let newForceInit =
    forceInit && (await readAndReplaceTokens(item, 'templates/snippets/DependencyForceInit._ts'));

  const newLines: string[] = [];
  let processingBind = false;
  let processingForceInit = false;
  lines.forEach(line => {
    if (line.startsWith('import') && newImport) {
      newLines.push(newImport);
      newImport = null;
    } else if (line.includes('bind<')) {
      processingBind = true;
    } else if (processingBind) {
      processingBind = false;
      if (newBind) {
        newLines.push(newBind);
        newBind = null;
      }
    } else if (line.includes('DependencyContainer.get')) {
      processingForceInit = true;
    } else if (processingForceInit) {
      processingForceInit = false;
      if (newForceInit) {
        newLines.push(newForceInit);
        newForceInit = null;
      }
    }
    newLines.push(line);
  });
  const output = newLines.join(';');
  return writeAndPrettify(output, filePath);
}

/**
 * Generates a new injectable class (DomainStore, ScreenStore)
 *
 * @param item params to generate from
 * @param fileTemplateFilename template to build from
 */
async function writeInjectableClass(
  item: INewInjectable,
  fileTemplateFilename: string,
): Promise<() => void> {
  const tokens = await getInjectableTokens(item);
  const template = await readFile(fileTemplateFilename);
  const result = replaceTokens(template, tokens);

  // Write output
  return writeAndPrettify(result, `${kWfReactSrcFolder}/${item.importPath}/${item.name}.ts`);
}

/**
 * Generates a new injectable Service class
 *
 * @param item params to generate from
 * @param fileTemplateFilename template to build from
 */
async function writeServiceClass(
  item: INewService,
  fileTemplateFilename: string,
): Promise<() => void> {
  const tokens = await getServiceTokens(item);
  const template = await readFile(fileTemplateFilename);
  const result = replaceTokens(template, tokens);

  // Write output
  return writeAndPrettify(result, `${kWfReactSrcFolder}/${item.importPath}/${item.name}.ts`);
}

async function getZsrApiReplacement(snippetFile: string, item: INewService): Promise<string> {
  const template = await readFile(snippetFile);
  return item.zsrRequests
    .map(zsrRequest => {
      const tokens = getZsrApiTokens(zsrRequest, item.apiFilename);
      return replaceTokens(template, tokens);
    })
    .join('\n');
}

async function writeServiceApiFile(item: INewService): Promise<() => void> {
  let result = '';
  for (const zsrRequest of item.zsrRequests) {
    result += await writeApi(zsrRequest);
  }
  return writeAndPrettify(result, `${kWfReactSrcFolder}/${item.importPath}/${item.apiFilename}.ts`);
}

async function writeApi(item: IZsrRequest): Promise<string> {
  const tokens = new Map([
    [
      '__REQUEST_INTERFACE__',
      generateInterfaceFromJson(item.requestObjectInterfaceName, item.requestJson),
    ],
    [
      '__RESPONSE_INTERFACE__',
      generateInterfaceFromJson(item.responseObjectInterfaceName, item.responseJson),
    ],
  ]);
  const template = await readFile(kServiceApiTemplateFile);
  return replaceTokens(template, tokens);
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

function getZsrApiTokens(item: IZsrRequest, apiFilename: string): Map<string, string> {
  return new Map([
    ['__REQUEST_INTERFACE_NAME__', item.requestObjectInterfaceName],
    ['__RESPONSE_INTERFACE_NAME__', item.responseObjectInterfaceName],
    ['__API_FILENAME__', apiFilename],
  ]);
}

async function getServiceTokens(item: INewService): Promise<Map<string, string>> {
  const tokens = await getInjectableTokens(item);
  const apiImports = await getZsrApiReplacement(
    'templates/snippets/ImportRequestResponseFromApi._ts',
    item,
  );
  tokens.set('__API_IMPORTS__', apiImports);
  return tokens;
}

/**
 * Generates a map of tokens from the template to their replacement for Stores and Services
 * This is used to populate the file template later.
 *
 * @param item Item to build the map from
 */
async function getInjectableTokens(item: INewInjectable): Promise<Map<string, string>> {
  const dependencyMembers = await getDependencyReplacement(
    'templates/snippets/DependencyMember._ts',
    item,
  );
  const ctorParams = await getDependencyReplacement(
    'templates/snippets/ConstructorInjection._ts',
    item,
  );
  const depImports = await getDependencyReplacement('templates/snippets/ImportInterface._ts', item);
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
  const tokens = getStandardTokens(item);
  tokens.set('__DEPENDENCY_MEMBERS__', dependencyMembers);
  tokens.set('__CONSTRUCTOR_INJECTION__', ctorParams);
  tokens.set('__DEPENDENCY_IMPORTS__', depImports);
  tokens.set('__CONSTRUCTOR_MEMBER_ASSIGNMENTS__', memberAssignments);
  tokens.set('__TYPE_IMPORTS__', typeImports);
  tokens.set('__INJECT_IMPORT__', injectImport);
  return tokens;
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

export async function generateInjectableClass(
  item: INewInjectable,
  category: InjectableCategory,
  onProgress: (progress: IProgressStep[]) => void,
): Promise<void> {
  switch (category) {
    case 'Service':
      return generateService(item, onProgress);
    case 'DomainStore':
      return generateDomainStore(item, onProgress);
    case 'ScreenStore':
      return generateScreenStore(item, onProgress);
  }
}

/**
 * Executes a series of steps and calls back when status changes.
 *
 * @param steps array of steps to execute
 * @param onProgress callback when a step status changes
 */
async function executeSteps(
  steps: IProgressStep[],
  onProgress: (progress: IProgressStep[]) => void,
) {
  const updateStatus = (index: number, status: ProgressStepStatus): void => {
    steps[index].status = status;
    onProgress([...steps]);
  };
  let currentStep = -1;
  try {
    for (const step of steps) {
      ++currentStep;
      updateStatus(currentStep, ProgressStepStatus.InProgress);
      await step.execute();
      updateStatus(currentStep, ProgressStepStatus.Complete);
    }
  } catch (error) {
    updateStatus(currentStep, ProgressStepStatus.Error);
    throw error;
  }
}

/**
 * Generates a new `Service` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
export async function generateService(
  item: INewService,
  onProgress: (progress: IProgressStep[]) => void,
): Promise<void> {
  const submissionProgress: IProgressStep[] = [];
  try {
    const finalizeFunctions = new Array<() => void>();

    submissionProgress.push({
      description: `Adding ${item.serviceIdentifier} to App Types`,
      execute: async () => {
        finalizeFunctions.push(await updateAppTypes(item.serviceIdentifier));
      },
    });

    submissionProgress.push({
      description: `Adding ${item.serviceIdentifier} to Dependency Container`,
      execute: async () => {
        finalizeFunctions.push(
          await updateDependencyContainer(item, kServiceDependencyContainerPath, false),
        );
      },
    });

    submissionProgress.push({
      description: `Writing class file for ${item.importPath}/${item.name}.ts`,
      execute: async () => {
        finalizeFunctions.push(await writeServiceClass(item, kServiceTemplateFile));
      },
    });

    if (item.zsrRequests && item.zsrRequests.length > 0) {
      submissionProgress.push({
        description: `Writing Api file for ${item.importPath}/${item.apiFilename}.ts`,
        execute: async () => {
          finalizeFunctions.push(await writeServiceApiFile(item));
        },
      });
    }

    submissionProgress.push({
      description: `Copying and finalizing output`,
      execute: async () => {
        finalizeFunctions.forEach(async f => await f());
      },
    });
    await executeSteps(submissionProgress, onProgress);
  } catch (error) {
    throw new Error(
      `Error generating injectable ${item.name}. ${error.message ? error.message : error}`,
    );
  }
}

/**
 * Generates a new `DomainStore` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
export async function generateDomainStore(
  item: INewInjectable,
  onProgress: (progress: IProgressStep[]) => void,
): Promise<void> {
  return internalGenerateInjectableClass(
    item,
    kDomainStoreDependencyContainerPath,
    kDomainStoreTemplateFile,
    true,
    onProgress,
  );
}

/**
 * Generates a new `DomainStore` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
export async function generateScreenStore(
  item: INewInjectable,
  onProgress: (progress: IProgressStep[]) => void,
): Promise<void> {
  return internalGenerateInjectableClass(
    item,
    kScreenStoreDependencyContainerPath,
    kScreenStoreTemplateFile,
    true,
    onProgress,
  );
}

/**
 * Generates a new `DomainStore` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
async function internalGenerateInjectableClass(
  item: INewInjectable,
  dependencyContainerPath: string,
  fileTemplate: string,
  forceDependencyInit: boolean,
  onProgress: (progress: IProgressStep[]) => void,
): Promise<void> {
  const submissionProgress: IProgressStep[] = [];

  try {
    const finalizeFunctions = new Array<() => void>();
    submissionProgress.push({
      description: `Adding ${item.serviceIdentifier} to App Types`,
      execute: async () => {
        finalizeFunctions.push(await updateAppTypes(item.serviceIdentifier));
      },
    });

    submissionProgress.push({
      description: `Adding ${item.serviceIdentifier} to Dependency Container`,
      execute: async () => {
        finalizeFunctions.push(
          await updateDependencyContainer(item, dependencyContainerPath, forceDependencyInit),
        );
      },
    });

    submissionProgress.push({
      description: `Writing class file for ${item.importPath}/${item.name}.ts`,
      execute: async () => {
        finalizeFunctions.push(await writeInjectableClass(item, fileTemplate));
      },
    });

    submissionProgress.push({
      description: `Copying and finalizing output`,
      execute: async () => {
        finalizeFunctions.forEach(async f => await f());
      },
    });
    await executeSteps(submissionProgress, onProgress);
  } catch (error) {
    throw new Error(
      `Error generating injectable ${item.name}. ${error.message ? error.message : error}`,
    );
  }
}

export function getStringForZsrService(zsrService: ZsrRequestService): string {
  switch (zsrService) {
    case ZsrRequestService.Gwf:
      return 'AppInfoService.gwfServer()';
    case ZsrRequestService.NetworkAccount:
      return 'AppInfoService.networkAccountServer()';
    default:
      return `'${zsrService}'`;
  }
}
