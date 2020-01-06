import React from 'react';
import { InjectableCategory } from '../Constants';
import { IInjectable } from '../Types';
import { MultiSelector } from './common/MultiSelector';

interface IProps {
  category: InjectableCategory;
  items: IInjectable[];
  selectedItems: string[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const DependencySelector: React.FunctionComponent<IProps> = props => {
  const { category, items, selectedItems, onChange } = props;
  return (
    <MultiSelector
      title={`${category} Dependencies`}
      items={items.map(item => item.serviceIdentifier)}
      selectedItems={selectedItems}
      id={`${category}-dependencies`}
      onChange={onChange}
    />
  );
};
