import { kOptimizationDefaultsPath, kOptimizationsPath } from '../Constants';
import { IOptimization, IProgressStep } from '../Types';
import { executeSteps } from './FileGenerator';
import { addEnumMember } from './TypescriptUtils';
import { updateJson } from './Utils';

export async function updateOptimization(optimization: IOptimization): Promise<() => void> {
  const enumName = optimization.fetchOnWarmLaunch
    ? 'WarmLaunchOptimizations'
    : 'ColdLaunchOptimizations';
  return addEnumMember({
    filename: kOptimizationsPath,
    enumName,
    newKey: optimization.key,
    newValue: optimization.name,
    sortEnum: true,
  });
}

export async function updateOptimizationDefaults(optimization: IOptimization): Promise<() => void> {
  return updateJson(kOptimizationDefaultsPath, optimization.name, {
    experiment: optimization.name,
    variables: JSON.parse(optimization.variables),
  });
}

/**
 * Generates a new `Service` class, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
export async function generateFeature(feature: {
  name: string;
  optimizations: IOptimization[];
  onProgress: (progress: IProgressStep[]) => void;
}): Promise<void> {
  const submissionProgress: IProgressStep[] = [];
  try {
    const finalizeFunctions = new Array<() => void>();

    // submissionProgress.push({
    //   description: `Adding ${item.serviceIdentifier} to App Types`,
    //   execute: async () => {
    //     finalizeFunctions.push(await updateAppTypes(item.serviceIdentifier));
    //   },
    // });

    // submissionProgress.push({
    //   description: `Adding ${item.serviceIdentifier} to Dependency Container`,
    //   execute: async () => {
    //     finalizeFunctions.push(
    //       await updateDependencyContainer(item, kServiceDependencyContainerPath, false),
    //     );
    //   },
    // });

    // submissionProgress.push({
    //   description: `Writing class file for ${item.importPath}/${item.name}.ts`,
    //   execute: async () => {
    //     finalizeFunctions.push(await writeServiceClass(item, kServiceTemplateFile));
    //   },
    // });

    if (feature.optimizations && feature.optimizations.length > 0) {
      submissionProgress.push({
        description: `Updating Optimizations`,
        execute: async () => {
          for (const optimization of feature.optimizations) {
            finalizeFunctions.push(await updateOptimization(optimization));
          }
        },
      });

      submissionProgress.push({
        description: `Updating Optimization Defaults`,
        execute: async () => {
          for (const optimization of feature.optimizations) {
            finalizeFunctions.push(await updateOptimizationDefaults(optimization));
          }
        },
      });
    }

    // TODO:
    // Optimization default.

    submissionProgress.push({
      description: `Copying and finalizing output`,
      execute: async () => {
        finalizeFunctions.forEach(async f => await f());
      },
    });
    await executeSteps(submissionProgress, feature.onProgress);
  } catch (error) {
    throw new Error(
      `Error generating feature ${feature.name}. ${error.message ? error.message : error}`,
    );
  }
}
