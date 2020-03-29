import React from 'react';
import { addConfigs } from '../generator/ConfigGenerator';
import { FormAddMultiple } from './common/FormAddMultiple';
import { ServerConfigForm } from './ServerConfigForm';

interface IProps {
  navigate: (route: string) => void;
}

/**
 * Form to just add an EOS optimization
 */
export const AddConfigsForm: React.FunctionComponent<IProps> = props => {
  return (
    <FormAddMultiple
      submit={addConfigs}
      navigate={props.navigate}
      title="Server Configs"
      elementName="Config"
      elementCreateForm={ServerConfigForm}
      defaultElement={{ defaultValue: '{}', name: '' }}
    />
  );
};
