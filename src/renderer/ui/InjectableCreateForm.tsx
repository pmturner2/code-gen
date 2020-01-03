import { Button, Typography } from '@material-ui/core';
import * as React from 'react';
import { InjectableCategory } from '../Constants';
import { generateInjectableClass } from '../generator/FileGenerator';
import { getAvailableInjectables } from '../generator/InjectableUtils';
import { uppercaseFirstLetter } from '../generator/Utils';
import { showError, showInfoAlert } from '../Logging';
import { IInjectable } from '../Types';
import { DependencySelector } from './common/DependencySelector';
import { FormSection } from './common/FormSection';
import { TextInput } from './common/TextInput';

interface IState {
  availableDependencies: Map<string, Map<string, IInjectable>>;
  dependencies: string[];
  hasEditedPath: boolean;
  name: string;
  path: string;
}

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
      return `ScreenStoreTypes.${name}`;
    case 'ScreenStore':
      return `DomainStoreTypes.${name}`;
  }
}

/**
 * Form for generating Service classes
 */
export class InjectableCreateForm extends React.Component<IProps, IState> {
  state: IState = {
    availableDependencies: null,
    dependencies: [],
    hasEditedPath: false,
    name: '',
    path: '',
  };

  componentDidMount() {
    this.fetchAvailableDependencies();
  }

  render() {
    if (!this.state.availableDependencies) {
      return null;
    }

    const { category } = this.props;
    return (
      <form onSubmit={this.handleSubmit} className="main-content">
        <FormSection title={`Generate ${category}`}>
          <TextInput
            label="Name"
            name="Name"
            placeholder={`e.g. Game for Game${category}`}
            onChange={this.handleTextChange}
            value={this.state.name}
          />
          <TextInput
            label="Path"
            name="Path"
            placeholder="e.g. game for src/services/game"
            onChange={this.handleTextChange}
            value={this.state.path}
          />
        </FormSection>
        <FormSection title="Dependencies">
          {this.props.dependencyCategories.map(category => {
            const availableDependencies = Array.from(
              this.state.availableDependencies.get(category).values(),
            );

            return (
              <DependencySelector
                category={category}
                selectedItems={this.getSelectedDependencies(category)}
                items={availableDependencies}
                onChange={this.handleDependencyChange}
                key={category}
              />
            );
          })}
        </FormSection>
        {this.props.children}
        <FormSection title={`Create a new ${category}`}>
          {this.state.name && this.state.path && (
            <Typography variant="subtitle2" className="element">{`${getFullImportPath(
              this.state.path,
              this.props.category,
            )}/${getClassName(this.state.name, this.props.category)}.ts`}</Typography>
          )}
          {this.state.name && this.state.path && (
            <Typography variant="subtitle2" className="element">{`${getFullImportPath(
              this.state.path,
              this.props.category,
            )}/${getInterfaceName(this.state.name, this.props.category)}.ts`}</Typography>
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
    );
  }

  private getSelectedDependencies(category: InjectableCategory): string[] {
    const availableForCategory = this.state.availableDependencies.get(category);
    return this.state.dependencies.filter(dep => availableForCategory.get(dep));
  }

  private fetchAvailableDependencies = async () => {
    const availableDependencies = new Map<string, Map<string, IInjectable>>();
    for (const category of this.props.dependencyCategories) {
      const dependenciesForCategory = new Map<string, IInjectable>();
      const injectables = await getAvailableInjectables(category);
      injectables.forEach(injectable => {
        dependenciesForCategory.set(injectable.serviceIdentifier, injectable);
      });
      availableDependencies.set(category, dependenciesForCategory);
    }
    this.setState({ availableDependencies });
  };

  private validateFormItem(name: string, value: string) {
    if (!value) {
      showError('Required param missing: ' + name);
      return false;
    }
    return true;
  }

  private handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    try {
      if (!this.validateFormItem('Name', this.state.name)) {
        return;
      }

      // TODO: Should be a loading spinner
      showInfoAlert(`Generating: ${this.state.name}`);

      const dependencies = this.state.dependencies.map(serviceIdentifier => {
        for (const category of this.props.dependencyCategories) {
          const depsForCategory = this.state.availableDependencies.get(category);
          const result = depsForCategory.get(serviceIdentifier);
          if (result) {
            return result;
          }
        }
        return null;
      });

      const { category } = this.props;
      await generateInjectableClass(
        {
          dependencies,
          importPath: getFullImportPath(this.state.path, category),
          interfaceName: getInterfaceName(this.state.name, category),
          name: getClassName(this.state.name, category),
          serviceIdentifier: getServiceIdentifier(this.state.name, category),
        },
        category,
      );
      showInfoAlert(`Successfully generated ${category}: ${this.state.name}`);
    } catch (error) {
      showError(error.message ? error.message : error);
    }

    this.props.navigate('Home');
  };

  private handleDependencyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    this.setState({ dependencies: event.target.value as string[] });
  };

  private handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'Name') {
      if (!this.state.hasEditedPath) {
        this.setState({ path: value.toLowerCase() });
      }
      this.setState({ name: uppercaseFirstLetter(value) });
    } else if (name === 'Path') {
      this.setState({ path: value.toLowerCase(), hasEditedPath: true });
    }
  };
}
