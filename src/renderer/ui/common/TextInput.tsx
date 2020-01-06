import { FormControl, Input, InputLabel, InputProps } from '@material-ui/core';
import React from 'react';

interface IProps extends InputProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TextInput: React.FunctionComponent<IProps> = props => {
  const { className, label, ...inputProps } = props;

  return (
    <FormControl className={`element ${className}`}>
      <InputLabel>{label}</InputLabel>
      <Input type="text" {...inputProps} />
    </FormControl>
  );
};
