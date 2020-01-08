import { FormControl, Input, InputLabel, InputProps } from '@material-ui/core';
import React, { useState } from 'react';

interface IProps extends InputProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  // Returns true if input is valid
  validator?: (input: string) => boolean;
}

export const TextInput: React.FunctionComponent<IProps> = props => {
  const { className, label, onChange, validator, ...inputProps } = props;
  const [error, setError] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (validator) {
      setError(!validator(event.target.value));
    }
    onChange(event);
  };

  return (
    <FormControl className={`element ${className}`}>
      <InputLabel>{label}</InputLabel>
      <Input type="text" {...inputProps} onChange={handleChange} error={error} />
    </FormControl>
  );
};
