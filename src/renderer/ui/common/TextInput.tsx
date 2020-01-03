import { FormControl, Input, InputLabel } from '@material-ui/core';
import React from 'react';

interface IProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TextInput: React.FunctionComponent<IProps> = props => {
  const { className, label, name, placeholder, value, onChange } = props;

  return (
    <FormControl className={`element ${className}`}>
      <InputLabel>{label}</InputLabel>
      <Input type="text" name={name} placeholder={placeholder} onChange={onChange} value={value} />
    </FormControl>
  );
};
