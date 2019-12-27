import React from 'react';
import { InjectableCreateForm } from './InjectableCreateForm';

interface IProps {
  navigate: (route: string) => void;
}

export class DomainStoreCreateForm extends React.Component<IProps> {
  render() {
    return (
      <InjectableCreateForm
        navigate={this.props.navigate}
        dependencyCategories={['Service', 'DomainStore']}
        category="DomainStore"
      />
    );
  }
}
