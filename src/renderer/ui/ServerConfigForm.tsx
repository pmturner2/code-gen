import * as React from 'react';
import { useEffect } from 'react';
import { IServerConfig } from '../Types';
import { JsonTextInput } from './common/JsonTextInput';
import { TextInput } from './common/TextInput';

interface IProps {
  onChange: (config: IServerConfig) => void;
}

/**
 * Form for generating Optimization with defaults.
 */
export const ServerConfigForm: React.FunctionComponent<IProps> = props => {
  const [name, setName] = React.useState('');
  const [defaultValue, setDefaultValue] = React.useState('');

  useEffect(() => {
    props.onChange({
      defaultValue,
      name,
    });
  }, [name, defaultValue, props]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleDefaultValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultValue(event.target.value);
  };

  return (
    <React.Fragment>
      <TextInput
        label="Config Name"
        name="name"
        placeholder="e.g. `ProfileFrameBaseImageUrl`"
        onChange={handleNameChange}
        value={name}
        className={'smalltop'}
        required={true}
      />
      <JsonTextInput
        label="Default Value (json or primitive)"
        name="defaultValue"
        placeholder="e.g. `{}`"
        onChange={handleDefaultValueChange}
        value={defaultValue}
        required={true}
      />
    </React.Fragment>
  );
};
