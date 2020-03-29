import { kConfigDefaultsPath, kConfigModelPath } from '../Constants';
import { IProgressStep, IServerConfig } from '../Types';
import { executeSteps } from './FileGenerator';
import { addClassMember, addObjectMember } from './TypescriptUtils';

export async function updateConfig(config: IServerConfig): Promise<() => void> {
  return addClassMember({
    className: 'ConfigModel',
    decorators: ['serializable', 'observable'],
    filename: kConfigModelPath,
    newKey: config.name,
    newValue: JSON.parse(config.defaultValue),
  });
}

export async function updateConfigDefaults(config: IServerConfig): Promise<() => void> {
  return addObjectMember({
    filename: kConfigDefaultsPath,
    newKey: config.name,
    newValue: JSON.parse(config.defaultValue),
    objectName: 'ConfigDefaults',
  });
}

/**
 * Adds configs and defaults to the wf-react codebase
 *
 * @param params params to generate configs from
 */
export async function addConfigs(params: {
  elements: IServerConfig[];
  onProgress: (progress: IProgressStep[]) => void;
}): Promise<void> {
  const submissionProgress: IProgressStep[] = [];
  try {
    const finalizeFunctions: Array<() => void> = [];

    if (params.elements && params.elements.length > 0) {
      submissionProgress.push({
        description: 'Updating Server Configs',
        execute: async () => {
          for (const element of params.elements) {
            finalizeFunctions.push(await updateConfig(element));
          }
        },
      });
      submissionProgress.push({
        description: 'Updating Server Config Defaults',
        execute: async () => {
          for (const element of params.elements) {
            finalizeFunctions.push(await updateConfigDefaults(element));
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
    throw new Error(`Error adding configs. ${error.message ? error.message : error}`);
  }
}
