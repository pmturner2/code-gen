import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
} from '@material-ui/core';
import React from 'react';
import { InjectableCategory } from '../../Constants';
import { IInjectable } from '../../Types';

interface IProps {
  category: InjectableCategory;
  items: IInjectable[];
  selectedItems: string[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const DependencySelector: React.FunctionComponent<IProps> = props => {
  const { category, items, selectedItems, onChange } = props;
  return (
    <FormControl className="element">
      <InputLabel id={`dependency-${category}-label`}>{`${category} Dependencies`}</InputLabel>
      <Select
        labelId={`dependency-${category}-label`}
        id={`dependency-${category}`}
        multiple
        value={selectedItems}
        onChange={onChange}
        renderValue={(selected: string[]) => selected.join(', ')}
      >
        {items.map(item => (
          <MenuItem key={item.serviceIdentifier} value={item.serviceIdentifier}>
            <Checkbox checked={selectedItems.indexOf(item.serviceIdentifier) > -1} />
            <ListItemText primary={item.serviceIdentifier} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
