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

function getSelectorTitle(category: InjectableCategory) {
  switch (category) {
    case 'Service':
      return 'Service Dependencies';
    case 'DomainStore':
      return 'Domain Store Dependencies';
    case 'ScreenStore':
      return 'UI Store Dependencies';
  }
}

export const DependencySelector: React.FunctionComponent<IProps> = props => {
  const { category, items, selectedItems, onChange } = props;
  return (
    <MultiSelector
      title={getSelectorTitle(category)}
      items={items.map(item => item.serviceIdentifier)}
      selectedItems={selectedItems}
      id={`${category}-dependencies`}
      onChange={onChange}
    />
  );
};
