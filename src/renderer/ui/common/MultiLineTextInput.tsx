import { TextField } from '@material-ui/core';
import React, { useState } from 'react';

interface IProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  // Returns true if input is valid
  validator?: (input: string) => boolean;
}

export const MultiLineTextInput: React.FunctionComponent<IProps> = props => {
  const { className, label, onChange, validator, ...inputProps } = props;
  const [error, setError] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (validator) {
      setError(!validator(event.target.value));
    }
    onChange(event);
  };

  return (
    <TextField
      className={`element ${className}`}
      label={label}
      variant="outlined"
      {...inputProps}
      multiline
      rows={6}
      error={error}
      onChange={handleChange}
    />
  );
};
