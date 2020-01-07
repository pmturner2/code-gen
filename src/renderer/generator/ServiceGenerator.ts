import {
  kServiceApiTemplateFile,
  kServiceDependencyContainerPath,
  kServiceTemplateFile,
  kWfReactSrcFolder,
} from '../Constants';
import {
  HttpRequestVerb,
  INewService,
  IProgressStep,
  IZsrRequest,
  ZsrRequestService,
} from '../Types';
import {
  executeSteps,
  getInjectableTokens,
  updateAppTypes,
  updateDependencyContainer,
} from './FileGenerator';
import { generateInterfaceFromJson } from './TypescriptUtils';
import { readFile, replaceTokens, writeAndPrettify } from './Utils';

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

async function getZsrApiReplacement(
  snippetFile: string,
  item: INewService,
  filter: (zsrRequest: IZsrRequest) => boolean = () => true,
): Promise<string> {
  const template = await readFile(snippetFile);
  return item.zsrRequests
    .filter(filter)
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

function getZsrApiTokens(item: IZsrRequest, apiFilename: string): Map<string, string> {
  return new Map([
    ['__REQUEST_INTERFACE_NAME__', item.requestObjectInterfaceName],
    ['__RESPONSE_INTERFACE_NAME__', item.responseObjectInterfaceName],
    ['__API_FILENAME__', apiFilename],
    ['__FUNCTION_NAME__', item.functionName],
    ['__METHOD__', item.method],
    ['__RETRY_POLICY__', item.retryPolicy],
    ['__SERVICE__', getStringForZsrService(item.service)],
  ]);
}

async function getServiceTokens(item: INewService): Promise<Map<string, string>> {
  const tokens = await getInjectableTokens(item);
  let apiImports = await getZsrApiReplacement(
    'templates/snippets/ImportRequestResponseFromApi._ts',
    item,
  );

  if (item.zsrRequests.length > 0) {
    apiImports += `
    import { RetryPolicy } from 'services/networking/zsr/ZSRApi';`;
    if (
      item.zsrRequests.some(
        (request: IZsrRequest) =>
          request.service === ZsrRequestService.Gwf ||
          request.service === ZsrRequestService.NetworkAccount,
      )
    ) {
      apiImports += `
      import { AppInfoService } from 'services/appinfo/AppInfoService'`;
    }
  }

  const getApis = await getZsrApiReplacement(
    'templates/snippets/ZsrGetRequest._ts',
    item,
    (zsrRequest: IZsrRequest) => zsrRequest.verb === HttpRequestVerb.Get,
  );
  const postApis = await getZsrApiReplacement(
    'templates/snippets/ZsrPostRequest._ts',
    item,
    (zsrRequest: IZsrRequest) => zsrRequest.verb === HttpRequestVerb.Post,
  );
  const putApis = await getZsrApiReplacement(
    'templates/snippets/ZsrPutRequest._ts',
    item,
    (zsrRequest: IZsrRequest) => zsrRequest.verb === HttpRequestVerb.Put,
  );
  const deleteApis = await getZsrApiReplacement(
    'templates/snippets/ZsrDeleteRequest._ts',
    item,
    (zsrRequest: IZsrRequest) => zsrRequest.verb === HttpRequestVerb.Delete,
  );

  tokens.set('__API_IMPORTS__', apiImports);
  tokens.set('__GET_API_CALLS__', getApis);
  tokens.set('__PUT_API_CALLS__', putApis);
  tokens.set('__POST_API_CALLS__', postApis);
  tokens.set('__DELETE_API_CALLS__', deleteApis);

  return tokens;
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
