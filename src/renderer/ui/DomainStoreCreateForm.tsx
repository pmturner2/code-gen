import React from 'react';
import { InjectableCreateForm } from './InjectableCreateForm';

interface IProps {
  navigate: (route: string) => void;
}

export const DomainStoreCreateForm: React.FunctionComponent<IProps> = props => {
  return (
    <InjectableCreateForm
      navigate={props.navigate}
      dependencyCategories={['Service', 'DomainStore']}
      category="DomainStore"
    />
  );
};
