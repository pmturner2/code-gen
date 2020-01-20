/**
 * Used for temporary scratch space
 */
export const kTmpFolder = './.TMP';

/**
 * Path to `wf-react` root, relative to the `code-gen` root
 */
export const kWfReactFolder = '../..';

/**
 * Path to `wf-react` src, relative to the `code-gen` root
 */
export const kWfReactSrcFolder = `${kWfReactFolder}/src`;

/**
 * File used as a template for new `Service` classes
 */

export const kServiceTemplateFile = 'templates/file/Service._ts';
export const kDomainStoreTemplateFile = 'templates/file/DomainStore._ts';
export const kScreenStoreTemplateFile = 'templates/file/ScreenStore._ts';
export const kServiceApiTemplateFile = 'templates/file/ServiceApi._ts';

/**
 * Paths to DependencyContainer.ts files in `wf-react` relative to `code-gen` root`
 */
export const kServiceDependencyContainerPath = `${kWfReactSrcFolder}/app/DependencyContainer.Services.ts`;
export const kDomainStoreDependencyContainerPath = `${kWfReactSrcFolder}/app/DependencyContainer.DomainStores.ts`;
export const kScreenStoreDependencyContainerPath = `${kWfReactSrcFolder}/app/DependencyContainer.ScreenStores.ts`;
export const kAppTypesPath = `${kWfReactSrcFolder}/app/Types.ts`;
export const kOptimizationDefaultsPath = `${kWfReactSrcFolder}/domains/optimization/optimizationDefaults.json`;
export const kOptimizationsPath = `${kWfReactSrcFolder}/domains/optimization/Optimizations.ts`;
export const kConfigDefaultsPath = `${kWfReactSrcFolder}/domains/config/ConfigDefaults.ts`;
export const kConfigModelPath = `${kWfReactSrcFolder}/domains/config/ConfigModel.ts`;

export type InjectableCategory = 'Service' | 'DomainStore' | 'ScreenStore';
