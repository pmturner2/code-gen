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
  selectedItems: string[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const MultiSelector: React.FunctionComponent<IProps> = props => {
  const { key, title, items, selectedItems, onChange } = props;
  return (
    <FormControl className="element">
      <InputLabel id={`${key}-label`}>{title}</InputLabel>
      <Select
        labelId={`${key}-label`}
        id={`${key}`}
        multiple
        value={selectedItems}
        onChange={onChange}
        renderValue={(selected: string[]) => selected.join(', ')}
      >
        {items.map((item, index) => (
          <MenuItem key={index.toString()} value={item}>
            <Checkbox checked={selectedItems.indexOf(item) > -1} />
            <ListItemText primary={item} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
