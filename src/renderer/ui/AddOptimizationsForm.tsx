import React from 'react';
import { addOptimizations } from '../generator/OptimizationGenerator';
import { FormAddMultiple } from './common/FormAddMultiple';
import { OptimizationForm } from './OptimizationForm';

interface IProps {
  navigate: (route: string) => void;
}

/**
 * Form to just add an EOS optimization
 */
export const AddOptimizationsForm: React.FunctionComponent<IProps> = props => {
  return (
    <FormAddMultiple
      submit={addOptimizations}
      title="EOS Optimizations"
      elementName="Experiment"
      elementCreateForm={OptimizationForm}
      defaultElement={{ name: '', variables: '{}' }}
      navigate={props.navigate}
    />
  );
};
