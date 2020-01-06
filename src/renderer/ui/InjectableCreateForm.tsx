import { Button, Typography } from '@material-ui/core';
import * as React from 'react';
import { InjectableCategory } from '../Constants';
import { generateInjectableClass } from '../generator/FileGenerator';
import { getAvailableInjectables } from '../generator/InjectableUtils';
import { cloneMap, uppercaseFirstLetter } from '../generator/Utils';
import { IInjectable, IProgressStep } from '../Types';
import { FormSection } from './common/FormSection';
import { TextInput } from './common/TextInput';
import { DependencySelector } from './DependencySelector';
import { DialogCoordinatorContext } from './DialogCoordinator';
import { ProgressDialog } from './ProgressDialog';

interface IProps {
  navigate: (route: string) => void;
  dependencyCategories: InjectableCategory[];
  category: InjectableCategory;
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
export const InjectableCreateForm: React.FunctionComponent<IProps> = props => {
  const { category } = props;
  const [availableDependencies, setAvailableDependencies] = React.useState<
    Map<string, Map<string, IInjectable>>
  >(null);
  const [dependencies, setDependencies] = React.useState<string[]>([]);
  const [hasEditedPath, setHasEditedPath] = React.useState(false);
  const [name, setName] = React.useState('');
  const [path, setPath] = React.useState('');
  const [submissionProgress, setSubmissionProgress] = React.useState([]);
  const dialogCoordinator = React.useContext(DialogCoordinatorContext);

  function getSelectedDependencies(category: InjectableCategory): string[] {
    const availableForCategory = availableDependencies.get(category);
    return dependencies.filter(dep => availableForCategory.get(dep));
  }

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

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    try {
      if (!validateFormItem('Name', name)) {
        return;
      }

      const serviceIdentifier = getServiceIdentifier(name, category);
      const importPath = getFullImportPath(path, category);

      const selectedDependencies = dependencies.map(serviceIdentifier => {
        for (const category of props.dependencyCategories) {
          const depsForCategory = availableDependencies.get(category);
          const result = depsForCategory.get(serviceIdentifier);
          if (result) {
            return result;
          }
        }
        return null;
      });

      await generateInjectableClass(
        {
          dependencies: selectedDependencies,
          importPath,
          interfaceName: getInterfaceName(name, category),
          name: getClassName(name, category),
          serviceIdentifier,
        },
        category,
        onSubmissionProgress,
      );
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
      if (!hasEditedPath) {
        setPath(value.toLowerCase());
      }
      setName(uppercaseFirstLetter(value));
    } else if (name === 'Path') {
      setPath(value.toLowerCase());
      setHasEditedPath(true);
    }
  };

  const fetchAvailableDependencies = async () => {
    const availableDependencies = new Map<string, Map<string, IInjectable>>();
    for (const category of props.dependencyCategories) {
      const dependenciesForCategory = new Map<string, IInjectable>();
      const injectables = await getAvailableInjectables(category);
      injectables.forEach(injectable => {
        dependenciesForCategory.set(injectable.serviceIdentifier, injectable);
      });
      availableDependencies.set(category, dependenciesForCategory);
    }
    setAvailableDependencies(cloneMap(availableDependencies));
  };

  React.useEffect(() => {
    fetchAvailableDependencies();
  }, []);

  if (!availableDependencies) {
    return null;
  }

  return (
    <React.Fragment>
      <form onSubmit={handleSubmit} className="main-content">
        <FormSection title={`Generate ${category}`}>
          <TextInput
            label="Name"
            name="Name"
            placeholder={`e.g. Game for Game${category}`}
            onChange={handleTextChange}
            value={name}
          />
          <TextInput
            label="Path"
            name="Path"
            placeholder="e.g. game for src/services/game"
            onChange={handleTextChange}
            value={path}
          />
        </FormSection>
        <FormSection title="Dependencies">
          {props.dependencyCategories.map(category => {
            const items = Array.from(availableDependencies.get(category).values());

            return (
              <DependencySelector
                category={category}
                selectedItems={getSelectedDependencies(category)}
                items={items}
                onChange={handleDependencyChange}
                key={category}
              />
            );
          })}
        </FormSection>
        {props.children}
        <FormSection title={`Create a new ${category}`}>
          {name && path && (
            <Typography variant="subtitle2" className="element">{`${getFullImportPath(
              path,
              props.category,
            )}/${getClassName(name, props.category)}.ts`}</Typography>
          )}
          {name && path && (
            <Typography variant="subtitle2" className="element">{`${getFullImportPath(
              path,
              props.category,
            )}/${getInterfaceName(name, props.category)}.ts`}</Typography>
          )}
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
        title={`Generating ${getClassName(name, props.category)}`}
        handleClose={handleDialogClose}
      />
    </React.Fragment>
  );
};
