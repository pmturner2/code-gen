import {
  kConfigDefaultsPath,
  kConfigModelPath,
  kOptimizationDefaultsPath,
  kOptimizationsPath,
} from '../Constants';
import { IOptimization, IProgressStep, IServerConfig } from '../Types';
import { executeSteps } from './FileGenerator';
import { addClassMember, addEnumMember, addObjectMember } from './TypescriptUtils';
import { updateJson } from './Utils';

async function updateOptimization(optimization: IOptimization): Promise<() => void> {
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

async function updateOptimizationDefaults(optimization: IOptimization): Promise<() => void> {
  return updateJson(kOptimizationDefaultsPath, optimization.name, {
    experiment: optimization.name,
    variables: JSON.parse(optimization.variables),
  });
}

async function updateConfig(config: IServerConfig): Promise<() => void> {
  return addClassMember({
    filename: kConfigModelPath,
    className: 'ConfigModel',
    newKey: config.name,
    newValue: JSON.parse(config.defaultValue),
    decorators: ['serializable', 'observable'],
  });
}

async function updateConfigDefaults(config: IServerConfig): Promise<() => void> {
  return addObjectMember({
    filename: kConfigDefaultsPath,
    objectName: 'ConfigDefaults',
    newKey: config.name,
    newValue: JSON.parse(config.defaultValue),
  });
}

// // TEST CODE
// async function f() {
//   const c = {
//     name: `best${Math.floor(Math.random() * 10000)}`,
//     defaultValue: `{
//       "test": "bac",
//       "waaah": ["cheese", "burger", "tests"],
//       "Okayy": [
//         {
//           "test": 2
//         },
//         {
//           "test": 3
//         }
//       ]
//     }`,
//   };
//   const r = await updateConfig(c);
//   const r2 = await updateConfigDefaults(c);
//   await r();
//   await r2();
// }

// f();

/**
 * Generates a new `Service` class, and properly updates the `wf-react` codebase
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

    if (feature.configs && feature.configs.length > 0) {
      submissionProgress.push({
        description: `Updating Server Configs`,
        execute: async () => {
          for (const config of feature.configs) {
            finalizeFunctions.push(await updateConfig(config));
          }
        },
      });

      submissionProgress.push({
        description: `Updating Server Config Defaults`,
        execute: async () => {
          for (const config of feature.configs) {
            finalizeFunctions.push(await updateConfigDefaults(config));
          }
        },
      });
    }

    submissionProgress.push({
      description: `Copying and finalizing output`,
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
