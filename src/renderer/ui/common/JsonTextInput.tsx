import React from 'react';
import { MultiLineTextInput } from './MultiLineTextInput';

interface IProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function validateJson(input: string) {
  try {
    JSON.parse(input);
  } catch (error) {
    return false;
  }
  return true;
}

export const JsonTextInput: React.FunctionComponent<IProps> = props => {
  return <MultiLineTextInput {...props} validator={validateJson} />;
};
