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
    enumName,
    filename: kOptimizationsPath,
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
 * Adds EOS optimizations and defaults to the wf-react codebase
 *
 * @param params params to generate configs from
 */
export async function addOptimizations(params: {
  elements: IOptimization[];
  onProgress: (progress: IProgressStep[]) => void;
}): Promise<void> {
  const submissionProgress: IProgressStep[] = [];
  try {
    const finalizeFunctions: Array<() => void> = [];

    if (params.elements && params.elements.length > 0) {
      submissionProgress.push({
        description: 'Updating Optimizations',
        execute: async () => {
          for (const element of params.elements) {
            finalizeFunctions.push(await updateOptimization(element));
          }
        },
      });
      submissionProgress.push({
        description: 'Updating Optimization Defaults',
        execute: async () => {
          for (const element of params.elements) {
            finalizeFunctions.push(await updateOptimizationDefaults(element));
          }
        },
      });
    }

    submissionProgress.push({
      description: 'Copying and finalizing output',
      execute: async () => {
        for (const f of finalizeFunctions) {
          await f();
        }
      },
    });
    await executeSteps(submissionProgress, params.onProgress);
  } catch (error) {
    throw new Error(`Error adding optimizations. ${error.message ? error.message : error}`);
  }
}
