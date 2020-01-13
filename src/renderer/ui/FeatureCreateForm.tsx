import { Button } from '@material-ui/core';
import * as React from 'react';
import { InjectableCategory } from '../Constants';
import { generateFeature } from '../generator/FeatureGenerator';
import { generateCapitalizedCamelCaseName, uppercaseFirstLetter } from '../generator/Utils';
import { IInjectable, INewInjectable, IOptimization, IProgressStep } from '../Types';
import { FormAddMultipleSection } from './common/FormAddMultipleSection';
import { FormSection } from './common/FormSection';
import { TextInput } from './common/TextInput';
import { DialogCoordinatorContext } from './DialogCoordinator';
import { OptimizationForm } from './OptimizationForm';
import { ProgressDialog } from './ProgressDialog';

// const AddEOSSection = FormAddMultipleSection<IOptimization>

interface IProps {
  navigate: (route: string) => void;
  // dependencyCategories: InjectableCategory[];
  submit?: (
    request: INewInjectable,
    category: InjectableCategory,
    onSubmissionProgress: (progress: IProgressStep[]) => void,
  ) => Promise<void>;
  forceAddDependencies?: () => string[];
}

function getFullImportPath(importPath: string, category: InjectableCategory): string {
  switch (category) {
    case 'Service':
      return `services/${importPath}`;
    case 'DomainStore':
      return `domains/${importPath}`;
    case 'ScreenStore':
      return `screens/${importPath}`;
  }
}

function getInterfaceName(name: string, category: InjectableCategory) {
  switch (category) {
    case 'Service':
      return `I${name}Service`;
    case 'DomainStore':
    case 'ScreenStore':
      return `I${name}Store`;
  }
}

function getClassName(name: string, category: InjectableCategory) {
  switch (category) {
    case 'Service':
      return `${name}Service`;
    case 'DomainStore':
    case 'ScreenStore':
      return `${name}Store`;
  }
}

function getServiceIdentifier(name: string, category: InjectableCategory) {
  switch (category) {
    case 'Service':
      return `ServiceTypes.${name}`;
    case 'DomainStore':
      return `DomainStoreTypes.${name}`;
    case 'ScreenStore':
      return `ScreenStoreTypes.${name}`;
  }
}

/**
 * Form for generating Service, DomainStore, or ScreenStore classes
 */
export const FeatureCreateForm: React.FunctionComponent<IProps> = props => {
  const [availableDependencies, setAvailableDependencies] = React.useState<
    Map<string, Map<string, IInjectable>>
  >(null);
  const [dependencies, setDependencies] = React.useState<string[]>([]);
  const [name, setName] = React.useState('');
  const [submissionProgress, setSubmissionProgress] = React.useState([]);
  const dialogCoordinator = React.useContext(DialogCoordinatorContext);

  const [optimizations, setOptimizations] = React.useState<IOptimization[]>([]);

  const handleOptimizationsChange = (optimizations: IOptimization[]) => {
    setOptimizations([...optimizations]);
  };

  function validateFormItem(name: string, value: string) {
    if (!value) {
      dialogCoordinator.showError('Required param missing: ' + name);
      return false;
    }
    return true;
  }

  const onSubmissionProgress = (progress: IProgressStep[]) => {
    setSubmissionProgress(progress);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (!validateFormItem('Name', name)) {
        return;
      }
      for (const optimization of optimizations) {
        try {
          JSON.parse(optimization.variables);
        } catch {
          dialogCoordinator.showError('Invalid json variables for ' + optimization.name);
          return;
        }
      }

      // const serviceIdentifier = getServiceIdentifier(name, category);
      // const importPath = getFullImportPath(path, category);

      // const { submit = generateInjectableClass, forceAddDependencies } = props;
      // if (forceAddDependencies) {
      //   const forcedDependencies = forceAddDependencies();
      //   for (const dep of forcedDependencies) {
      //     if (dependencies.indexOf(dep) == -1) {
      //       dependencies.push(dep);
      //     }
      //   }
      // }
      // const selectedDependencies = dependencies.map(serviceIdentifier => {
      //   for (const category of props.dependencyCategories) {
      //     const depsForCategory = availableDependencies.get(category);
      //     const result = depsForCategory.get(serviceIdentifier);
      //     if (result) {
      //       return result;
      //     }
      //   }
      //   return null;
      // });

      await generateFeature({
        name: generateCapitalizedCamelCaseName(name),
        optimizations,
        onProgress: onSubmissionProgress,
      });
    } catch (error) {
      dialogCoordinator.showError(error.message ? error.message : error);
    }
  };

  const handleDialogClose = () => {
    props.navigate('Home');
  };

  const handleDependencyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setDependencies(event.target.value as string[]);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'Name') {
      setName(uppercaseFirstLetter(value));
    }
  };

  return (
    <React.Fragment>
      <form onSubmit={handleSubmit} className="main-content">
        <FormSection title={`Generate Feature`}>
          <TextInput
            label="Feature Name"
            name="Name"
            placeholder={`e.g. WordRadar`}
            onChange={handleTextChange}
            value={name}
            required={true}
          />
        </FormSection>
        <FormAddMultipleSection
          title="EOS Optimizations"
          elementName="Experiment"
          onChange={handleOptimizationsChange}
          elementCreateForm={OptimizationForm}
          defaultElement={{ name: '', variables: '{}' }}
        />

        <FormSection>
          <Button
            type="submit"
            name="Submit"
            value="Create"
            fullWidth={false}
            className="form-submit element"
            variant="contained"
            color="primary"
          >
            Create
          </Button>
        </FormSection>
      </form>
      <ProgressDialog
        open={submissionProgress.length !== 0}
        steps={submissionProgress}
        title={`Generating Feature ${name}`}
        handleClose={handleDialogClose}
      />
    </React.Fragment>
  );
};
