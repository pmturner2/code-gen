import { Checkbox, FormControlLabel } from '@material-ui/core';
import * as React from 'react';
import { useEffect } from 'react';
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
  const [fetchOnWarmLaunch, setFetchOnWarmLaunch] = React.useState(false);
  const [variablesJson, setVariablesJson] = React.useState('{}');

  useEffect(() => {
    props.onChange({
      fetchOnWarmLaunch,
      name,
      variables: variablesJson,
    });
  }, [name, fetchOnWarmLaunch, variablesJson]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
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
        placeholder="e.g. `wwf3_rn_ipad`"
        onChange={handleNameChange}
        value={name}
        className={'smalltop'}
        required={true}
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
