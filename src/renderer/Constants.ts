/**
 * Paths to DependencyContainer.ts files in `wf-react` relative to `wf-react/src`
 */
export const kServiceDependencyContainerPath = '../../src/app/DependencyContainer.Services.ts';
export const kDomainStoreDependencyContainerPath =
  '../../src/app/DependencyContainer.DomainStores.ts';
export const kScreenStoreDependencyContainerPath =
  '../../src/app/DependencyContainer.ScreenStores.ts';

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
