import * as React from 'react';
import { getServices } from '../generator/ServiceHelper';
import { IInjectable } from '../IInjectable';
import { DependencySelector } from './DependencySelector';
import { CardWithHeader } from './CardWithHeader';
import { TextInput } from './TextInput';

interface IState {
  services: IInjectable[];
  dependencies: Map<string, boolean>;
}

export class ServiceCreateForm extends React.Component<{}, IState> {
  state = { dependencies: new Map(), services: new Array<IInjectable>() };

  componentDidMount() {
    this.fetchServiceList();
  }

  render() {
    if (!this.state.services) {
      return null;
    }
    return (
      <form onSubmit={this.handleSubmit}>
        <CardWithHeader title="Service Name">
          <TextInput name="Name" placeholder="ABC" onChange={null} />
        </CardWithHeader>
        <CardWithHeader title="Dependencies">
          <DependencySelector items={this.state.services} onChange={this.handleDependencyChange} />
        </CardWithHeader>
        <CardWithHeader title="Submit">
          <input type="submit" name="Submit" value="Create Service" />
        </CardWithHeader>
      </form>
    );
  }

  private fetchServiceList = async () => {
    const services = await getServices();
    this.setState({ services });
  };

  private handleSubmit = (event: React.SyntheticEvent) => {
    this.state.dependencies.forEach((value, key) => {
      if (value) {
        console.log('KEY ' + key);
      }
    });
    // console.log('Selected deps', JSON.stringify(this.state.dependencies.keys()));
    event.preventDefault();
  };

  private handleDependencyChange = (serviceIdentifier: string, isSelected: boolean) => {
    const dependencies = this.state.dependencies;
    const dependency = this.state.dependencies.get(serviceIdentifier);
    if ((dependency && !isSelected) || (!dependency && isSelected)) {
      dependencies.set(serviceIdentifier, isSelected);
      this.setState({ dependencies });
    }
  };
}
