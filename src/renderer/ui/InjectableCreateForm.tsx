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
  dependencies: Map<string, boolean>;
  name: string;
  path: string;
}

interface IProps {
  navigate: (route: string) => void;
  dependencyCategories: InjectableCategory[];
  category: InjectableCategory;
}

/**
 * Form for generating Service classes
 */
export class InjectableCreateForm extends React.Component<IProps, IState> {
  state: IState = {
    availableDependencies: null,
    dependencies: new Map(),
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
      <form onSubmit={this.handleSubmit}>
        <FormSection title={`Create ${category}`}>
          <TextInput
            label="Name"
            name="Name"
            placeholder={`e.g. Game for Game${category}`}
            onChange={this.handleTextChange}
          />
          <TextInput
            label="Path"
            name="Path"
            placeholder="e.g. game for src/services/game"
            onChange={this.handleTextChange}
          />
        </FormSection>
        <FormSection title="Dependencies" collapsible={true}>
          {this.props.dependencyCategories.map(category => {
            const availableDependencies = Array.from(
              this.state.availableDependencies.get(category).values(),
            );

            return (
              <DependencySelector
                category={category}
                selectedItems={this.state.dependencies}
                items={availableDependencies}
                onChange={this.handleDependencyChange}
                key={category}
              />
            );
          })}
        </FormSection>
        {this.props.children}
        <FormSection title="Submit">
          <input type="submit" name="Submit" value={`Create ${category}`} />
        </FormSection>
      </form>
    );
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

      const dependencies = Array.from(this.state.dependencies.keys())
        .filter(k => this.state.dependencies.get(k))
        .map(serviceIdentifier => {
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
      const name = uppercaseFirstLetter(this.state.name);
      const importPath = this.state.path || this.state.name;
      await generateInjectableClass(
        {
          dependencies,
          importPath: this.getFullImportPath(importPath, category),
          interfaceName: this.getInterfaceName(name, category),
          name: this.getClassName(name, category),
          serviceIdentifier: this.getServiceIdentifier(name, category),
        },
        category,
      );
      showInfoAlert(`Successfully generated ${category}: ${name}`);
    } catch (error) {
      showError(error);
    }

    this.props.navigate('Home');
  };

  private getFullImportPath(importPath: string, category: InjectableCategory): string {
    switch (category) {
      case 'Service':
        return `services/${importPath.toLowerCase()}`;
      case 'DomainStore':
        return `domains/${importPath.toLowerCase()}`;
      case 'ScreenStore':
        return `screens/${importPath.toLowerCase()}`;
    }
  }

  private getInterfaceName(name: string, category: InjectableCategory) {
    switch (category) {
      case 'Service':
        return `I${name}Service`;
      case 'DomainStore':
      case 'ScreenStore':
        return `I${name}Store`;
    }
  }

  private getClassName(name: string, category: InjectableCategory) {
    switch (category) {
      case 'Service':
        return `${name}Service`;
      case 'DomainStore':
      case 'ScreenStore':
        return `${name}Store`;
    }
  }

  private getServiceIdentifier(name: string, category: InjectableCategory) {
    switch (category) {
      case 'Service':
        return `ServiceTypes.${name}`;
      case 'DomainStore':
        return `ScreenStoreTypes.${name}`;
      case 'ScreenStore':
        return `DomainStoreTypes.${name}`;
    }
  }

  private handleDependencyChange = (serviceIdentifier: string, isSelected: boolean) => {
    const dependencies = this.state.dependencies;
    const dependency = this.state.dependencies.get(serviceIdentifier);
    if ((dependency && !isSelected) || (!dependency && isSelected)) {
      dependencies.set(serviceIdentifier, isSelected);
      this.setState({ dependencies });
    }
  };

  private handleTextChange = (key: string, value: string) => {
    if (key === 'Name') {
      this.setState({ name: value });
    } else if (key === 'Path') {
      this.setState({ path: value });
    }
  };
}
