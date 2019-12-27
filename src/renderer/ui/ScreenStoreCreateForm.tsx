import React from 'react';
import { InjectableCreateForm } from './InjectableCreateForm';

interface IProps {
  navigate: (route: string) => void;
}

export class ScreenStoreCreateForm extends React.Component<IProps> {
  render() {
    return (
      <InjectableCreateForm
        navigate={this.props.navigate}
        dependencyCategories={['Service', 'DomainStore', 'ScreenStore']}
        category="ScreenStore"
      />
    );
  }
}
