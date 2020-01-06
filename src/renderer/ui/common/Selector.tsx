import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
} from '@material-ui/core';
import React from 'react';

interface IProps {
  key: string;
  title: string;
  items: string[];
  selectedItem: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Selector: React.FunctionComponent<IProps> = props => {
  const { key, title, items, selectedItem, onChange } = props;
  return (
    <FormControl className="element">
      <InputLabel id={`${key}-label`}>{title}</InputLabel>
      <Select
        labelId={`${key}-label`}
        id={`${key}`}
        value={selectedItem}
        onChange={onChange}
        renderValue={(selected: string) => selected}
      >
        {items.map((item, index) => (
          <MenuItem key={index.toString()} value={item}>
            <Checkbox checked={selectedItem === item} />
            <ListItemText primary={item} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
