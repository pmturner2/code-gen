import { FormControl, Input, InputLabel } from '@material-ui/core';
import React from 'react';

interface IProps {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  className?: string;
  onChange: (name: string, value: string) => void;
}

export class TextInput extends React.Component<IProps> {
  render() {
    const { className, label, name, placeholder, value } = this.props;

    return (
      <FormControl className={`element ${className}`}>
        <InputLabel>{label}</InputLabel>
        <Input
          type="text"
          name={name}
          placeholder={placeholder}
          onChange={this.handleChange}
          value={value}
        />
      </FormControl>
    );
  }

  private handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    if (this.props.onChange) {
      this.props.onChange(this.props.name, target.value);
    }
  };
}
