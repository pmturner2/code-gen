import { Checkbox, FormControlLabel } from '@material-ui/core';
import * as React from 'react';
import { useEffect } from 'react';
import { generateCapitalizedCamelCaseName } from '../generator/Utils';
import { IOptimization } from '../Types';
import { JsonTextInput } from './common/JsonTextInput';
import { TextInput } from './common/TextInput';

interface IProps {
  onChange: (optimization: IOptimization) => void;
}

/**
 * Form for generating Optimization with defaults.
 */
export const OptimizationForm: React.FunctionComponent<IProps> = props => {
  const [name, setName] = React.useState('');
  const [key, setKey] = React.useState('');
  const [hasEditedKey, setHasEditedKey] = React.useState(false);
  const [fetchOnWarmLaunch, setFetchOnWarmLaunch] = React.useState(false);
  const [variablesJson, setVariablesJson] = React.useState('{}');

  useEffect(() => {
    if (!hasEditedKey) {
      let newKey = '';
      if (
        name === 'w' ||
        name === 'ww' ||
        name === 'wwf' ||
        name.startsWith('wwf2') ||
        name.startsWith('wwf3')
      ) {
        newKey = generateCapitalizedCamelCaseName(name.slice(4));
      } else {
        newKey = generateCapitalizedCamelCaseName(name);
      }
      if (newKey !== key) {
        setKey(newKey);
      }
    }
    props.onChange({
      fetchOnWarmLaunch,
      key,
      name,
      variables: variablesJson,
    });
  }, [name, key, fetchOnWarmLaunch, variablesJson, hasEditedKey]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHasEditedKey(true);
    setKey(event.target.value);
  };

  const handleVariablesJsonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVariablesJson(event.target.value);
  };

  const handleFetchOnWarmLaunchChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFetchOnWarmLaunch(event.target.checked);
  };

  return (
    <React.Fragment>
      <TextInput
        label="Experiment Name"
        name="name"
        placeholder="e.g. `wwf3_practice_partners`"
        onChange={handleNameChange}
        value={name}
        className={'smalltop'}
        required={true}
      />
      <TextInput
        label="Optimizations Key"
        name="key"
        placeholder="e.g. `PracticePartners`"
        onChange={handleKeyChange}
        value={key}
      />
      <JsonTextInput
        label="Defaults"
        name="variables"
        placeholder="e.g. `{}`"
        onChange={handleVariablesJsonChange}
        value={variablesJson}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={fetchOnWarmLaunch}
            onChange={handleFetchOnWarmLaunchChanged}
            value="fetchOnWarmLaunch"
          />
        }
        label="Fetch on warm launch"
      />
    </React.Fragment>
  );
};
