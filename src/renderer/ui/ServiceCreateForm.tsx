import React from 'react';
import { InjectableCreateForm } from './InjectableCreateForm';
import { ZsrApiForm } from './ZsrApiForm';

interface IProps {
  navigate: (route: string) => void;
}

export const ServiceCreateForm: React.FunctionComponent<IProps> = props => {
  const handleZsrApiChange = () => {};

  return (
    <InjectableCreateForm
      navigate={props.navigate}
      dependencyCategories={['Service']}
      category="Service"
    >
      <ZsrApiForm onChange={handleZsrApiChange} />
    </InjectableCreateForm>
  );
};
