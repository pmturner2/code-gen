import { IOptimization, IProgressStep, IServerConfig } from '../Types';
import { updateConfig, updateConfigDefaults } from './ConfigGenerator';
import { executeSteps } from './FileGenerator';
import { updateOptimization, updateOptimizationDefaults } from './OptimizationGenerator';

/**
 * Generates a new Feature, and properly updates the `wf-react` codebase
 *
 * @param item params to generate from
 */
export async function generateFeature(feature: {
  name: string;
  configs: IServerConfig[];
  optimizations: IOptimization[];
  onProgress: (progress: IProgressStep[]) => void;
}): Promise<void> {
  const submissionProgress: IProgressStep[] = [];
  try {
    const finalizeFunctions: Array<() => void> = [];

    if (feature.optimizations && feature.optimizations.length > 0) {
      submissionProgress.push({
        description: 'Updating Optimizations',
        execute: async () => {
          for (const optimization of feature.optimizations) {
            finalizeFunctions.push(await updateOptimization(optimization));
          }
        },
      });

      submissionProgress.push({
        description: 'Updating Optimization Defaults',
        execute: async () => {
          for (const optimization of feature.optimizations) {
            finalizeFunctions.push(await updateOptimizationDefaults(optimization));
          }
        },
      });
    }

    if (feature.configs && feature.configs.length > 0) {
      submissionProgress.push({
        description: 'Updating Server Configs',
        execute: async () => {
          for (const config of feature.configs) {
            finalizeFunctions.push(await updateConfig(config));
          }
        },
      });

      submissionProgress.push({
        description: 'Updating Server Config Defaults',
        execute: async () => {
          for (const config of feature.configs) {
            finalizeFunctions.push(await updateConfigDefaults(config));
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
    await executeSteps(submissionProgress, feature.onProgress);
  } catch (error) {
    throw new Error(
      `Error generating feature ${feature.name}. ${error.message ? error.message : error}`,
    );
  }
}
