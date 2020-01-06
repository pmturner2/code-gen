import { TextField } from '@material-ui/core';
import React from 'react';

interface IProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MultiLineTextInput: React.FunctionComponent<IProps> = props => {
  const { className, label, ...inputProps } = props;

  return (
    <TextField
      className={`element ${className}`}
      label={label}
      variant="outlined"
      {...inputProps}
      multiline
      rows={6}
    />
  );
};
