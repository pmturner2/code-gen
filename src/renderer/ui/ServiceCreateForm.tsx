import React from 'react';
import { InjectableCreateForm } from './InjectableCreateForm';

interface IProps {
  navigate: (route: string) => void;
}

export const ServiceCreateForm: React.FunctionComponent<IProps> = props => {
  return (
    <InjectableCreateForm
      navigate={props.navigate}
      dependencyCategories={['Service']}
      category="Service"
    />
  );
};
