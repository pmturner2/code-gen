import * as React from 'react';
import { generateService } from '../generator/FileGenerator';
import { getServices } from '../generator/InjectableUtils';
import { uppercaseFirstLetter } from '../generator/Utils';
import { showError, showInfo } from '../Logging';
import { IInjectable } from '../Types';
import { DependencySelector } from './common/DependencySelector';
import { FormSection } from './common/FormSection';
import { TextInput } from './common/TextInput';

interface IState {
  dependencies: Map<string, boolean>;
  serviceName: string;
  servicePath: string;
  services: IInjectable[];
}

interface IProps {
  navigate: (route: string) => void;
}

/**
 * Form for generating Service classes
 */
export class ServiceCreateForm extends React.Component<IProps, IState> {
  state = {
    dependencies: new Map(),
    serviceName: '',
    servicePath: '',
    services: new Array<IInjectable>(),
  };

  componentDidMount() {
    this.fetchServiceList();
  }

  render() {
    if (!this.state.services) {
      return null;
    }
    return (
      <form onSubmit={this.handleSubmit}>
        <FormSection title="Create Service">
          <TextInput
            label="Name"
            name="Name"
            placeholder="e.g. Game for GameService"
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
          <DependencySelector
            selectedItems={this.state.dependencies}
            items={this.state.services}
            onChange={this.handleDependencyChange}
          />
        </FormSection>
        <FormSection title="Submit">
          <input type="submit" name="Submit" value="Create Service" />
        </FormSection>
      </form>
    );
  }

  private fetchServiceList = async () => {
    const services = await getServices();
    this.setState({ services });
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
      if (!this.validateFormItem('Name', this.state.serviceName)) {
        return;
      }

      const dependencies = this.state.services.filter(s =>
        this.state.dependencies.get(s.serviceIdentifier),
      );

      const serviceName = uppercaseFirstLetter(this.state.serviceName);
      const importPath = this.state.servicePath || this.state.serviceName;
      await generateService({
        dependencies,
        importPath: `services/${importPath.toLowerCase()}`,
        interfaceName: `I${serviceName}Service`,
        name: `${serviceName}Service`,
        serviceIdentifier: `ServiceTypes.${serviceName}`,
      });
      showInfo(`Successfully generated Service: ${serviceName}`);
    } catch (error) {
      showError(error);
    }

    this.props.navigate('Home');
  };

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
      this.setState({ serviceName: value });
    } else if (key === 'Path') {
      this.setState({ servicePath: value });
    }
  };

  private resetForm = () => {
    this.setState({
      dependencies: new Map(),
      serviceName: '',
      servicePath: '',
    });
  };
}
