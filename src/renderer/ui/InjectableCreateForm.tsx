import { Button, Typography } from '@material-ui/core';
import * as React from 'react';
import { InjectableCategory } from '../Constants';
import { generateInjectableClass } from '../generator/FileGenerator';
import { getAvailableInjectables } from '../generator/InjectableUtils';
import { cloneMap, uppercaseFirstLetter } from '../generator/Utils';
import { IInjectable, INewInjectable, IProgressStep } from '../Types';
import { FormSection } from './common/FormSection';
import { TextInput } from './common/TextInput';
import { DependencySelector } from './DependencySelector';
import { DialogCoordinatorContext } from './DialogCoordinator';
import { ProgressDialog } from './ProgressDialog';

interface IProps {
  navigate: (route: string) => void;
  dependencyCategories: InjectableCategory[];
  category: InjectableCategory;
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
      return `I${name}Store`;
    case 'ScreenStore':
      return `I${name}UIStore`;
  }
}

function getClassName(name: string, category: InjectableCategory) {
  switch (category) {
    case 'Service':
      return `${name}Service`;
    case 'DomainStore':
      return `${name}Store`;
    case 'ScreenStore':
      return `${name}UIStore`;
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

function getFormTitle(category: InjectableCategory) {
  switch (category) {
    case 'Service':
      return 'Generate Service';
    case 'DomainStore':
      return 'Generate Domain Store';
    case 'ScreenStore':
      return 'Generate UI Store';
  }
}

function getNamePlaceholder(category: InjectableCategory) {
  switch (category) {
    case 'Service':
      return 'e.g. Game for GameService';
    case 'DomainStore':
      return 'e.g. Game for GameStore';
    case 'ScreenStore':
      return 'e.g. Game for GameUIStore';
  }
}

function getPathPlaceholder(category: InjectableCategory) {
  switch (category) {
    case 'Service':
      return 'e.g. game for src/services/game';
    case 'DomainStore':
      return 'e.g. game for src/domains/game';
    case 'ScreenStore':
      return 'e.g. game for src/screens/game';
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

  function getSelectedDependencies(injectableCategory: InjectableCategory): string[] {
    const availableForCategory = availableDependencies.get(injectableCategory);
    return dependencies.filter(dep => availableForCategory.get(dep));
  }

  function validateFormItem(itemName: string, itemValue: string) {
    if (!itemValue) {
      dialogCoordinator.showError('Required param missing: ' + itemName);
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

      const { submit = generateInjectableClass, forceAddDependencies } = props;
      if (forceAddDependencies) {
        const forcedDependencies = forceAddDependencies();
        for (const dep of forcedDependencies) {
          if (dependencies.indexOf(dep) === -1) {
            dependencies.push(dep);
          }
        }
      }
      const selectedDependencies = dependencies.map(selectedServiceIdentifier => {
        for (const dependencyCategory of props.dependencyCategories) {
          const depsForCategory = availableDependencies.get(dependencyCategory);
          const result = depsForCategory.get(selectedServiceIdentifier);
          if (result) {
            return result;
          }
        }
        return null;
      });

      await submit(
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

  const handleDependencyChange = (
    injectableCategory: InjectableCategory,
    selectedForCategory: string[],
  ) => {
    const availableForCategory = availableDependencies.get(injectableCategory);
    const selectedForOtherCategories = dependencies.filter(dep => !availableForCategory.has(dep));
    // Make sure when we change one category (e.g. Services) that we don't effect others (e.g. Domains)
    setDependencies([...selectedForOtherCategories, ...selectedForCategory]);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target?.name === 'Name') {
      if (!hasEditedPath) {
        setPath(event.target?.value?.toLowerCase());
      }
      setName(uppercaseFirstLetter(event.target?.value));
    } else if (event.target?.name === 'Path') {
      setPath(event.target?.value?.toLowerCase());
      setHasEditedPath(true);
    }
  };

  React.useEffect(() => {
    const fetchAvailableDependencies = async () => {
      const availableDeps = new Map<string, Map<string, IInjectable>>();
      for (const dependencyCategory of props.dependencyCategories) {
        const dependenciesForCategory = new Map<string, IInjectable>();
        const injectables = await getAvailableInjectables(dependencyCategory);
        injectables.forEach(injectable => {
          dependenciesForCategory.set(injectable.serviceIdentifier, injectable);
        });
        availableDeps.set(dependencyCategory, dependenciesForCategory);
      }
      setAvailableDependencies(cloneMap(availableDeps));
    };
    fetchAvailableDependencies();
  }, [props.dependencyCategories]);

  if (!availableDependencies) {
    return null;
  }

  return (
    <React.Fragment>
      <form onSubmit={handleSubmit} className="main-content">
        <FormSection title={getFormTitle(category)}>
          <TextInput
            label="Name"
            name="Name"
            placeholder={getNamePlaceholder(category)}
            onChange={handleTextChange}
            value={name}
            required={true}
          />
          <TextInput
            label="Path"
            name="Path"
            placeholder={getPathPlaceholder(category)}
            onChange={handleTextChange}
            value={path}
            required={true}
          />
        </FormSection>
        <FormSection title="Dependencies">
          {props.dependencyCategories.map(dependencyCategory => {
            const items = Array.from(availableDependencies.get(dependencyCategory).values());
            const changeHandler = (event: React.ChangeEvent<{ value: unknown }>) => {
              handleDependencyChange(dependencyCategory, event.target.value as string[]);
            };
            return (
              <DependencySelector
                category={dependencyCategory}
                selectedItems={getSelectedDependencies(dependencyCategory)}
                items={items}
                onChange={changeHandler}
                key={dependencyCategory}
              />
            );
          })}
        </FormSection>
        {props.children}
        <FormSection>
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
