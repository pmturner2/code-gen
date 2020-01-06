import {
  InjectableCategory,
  kAppTypesPath,
  kDomainStoreDependencyContainerPath,
  kDomainStoreTemplateFile,
  kScreenStoreDependencyContainerPath,
  kScreenStoreTemplateFile,
  kServiceDependencyContainerPath,
  kServiceTemplateFile,
  kWfReactSrcFolder,
} from '../Constants';
import { IInjectable, INewInjectable, IProgressStep, ProgressStepStatus } from '../Types';
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
 * Generates a new injectable class (Service, DomainStore, ScreenStore)
 *
 * @param item params to generate from
 * @param fileTemplateFilename template to build from
 */
async function writeInjectableClass(
  item: INewInjectable,
  fileTemplateFilename: string,
): Promise<() => void> {
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
  return writeAndPrettify(result, `${kWfReactSrcFolder}/${item.importPath}/${item.name}.ts`);
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
 * Generates a new `Service` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
export async function generateService(
  item: INewInjectable,
  onProgress: (progress: IProgressStep[]) => void,
): Promise<void> {
  return internalGenerateInjectableClass(
    item,
    kServiceDependencyContainerPath,
    kServiceTemplateFile,
    false,
    onProgress,
  );
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
  const submissionProgress: IProgressStep[] = [
    { description: `Adding ${item.serviceIdentifier} to App Types` },
    { description: `Adding ${item.serviceIdentifier} to Dependency Container` },
    { description: `Writing class file for ${item.importPath}/${item.name}.ts` },
    { description: `Copying and finalizing output` },
  ];

  const updateStatus = (index: number, status: ProgressStepStatus): void => {
    submissionProgress[index].status = status;
    onProgress([...submissionProgress]);
  };

  let currentStep = 0;
  try {
    const finalizeFunctions = new Array<() => void>();

    // Add a ServiceIdentifier for the new Injectable to `Types.ts`
    updateStatus(currentStep, ProgressStepStatus.InProgress);
    submissionProgress[currentStep].status = finalizeFunctions.push(
      await updateAppTypes(item.serviceIdentifier),
    );
    updateStatus(currentStep, ProgressStepStatus.Complete);

    ++currentStep;
    // Adds a call to `bind` the injectable in the DependencyContainer class
    updateStatus(currentStep, ProgressStepStatus.InProgress);
    finalizeFunctions.push(
      await updateDependencyContainer(item, dependencyContainerPath, forceDependencyInit),
    );
    updateStatus(currentStep, ProgressStepStatus.Complete);

    ++currentStep;
    // Generates the new class from the template
    updateStatus(currentStep, ProgressStepStatus.InProgress);
    finalizeFunctions.push(await writeInjectableClass(item, fileTemplate));
    updateStatus(currentStep, ProgressStepStatus.Complete);

    // Iterate over functions to finalize (write) output to `wf-react` repo
    ++currentStep;
    updateStatus(currentStep, ProgressStepStatus.InProgress);
    finalizeFunctions.forEach(async f => await f());
    updateStatus(currentStep, ProgressStepStatus.Complete);
  } catch (error) {
    updateStatus(currentStep, ProgressStepStatus.Error);
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
