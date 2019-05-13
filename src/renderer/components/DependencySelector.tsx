import React from 'react';
import { IInjectable } from '../Types';
import { DependencySelectorItem } from './DependencySelectorItem';

interface IProps {
  items: IInjectable[];
  selectedItems: Map<string, string>;
  onChange: (serviceIdentifier: string, isSelected: boolean) => void;
}

export class DependencySelector extends React.Component<IProps> {
  render() {
    const { items, onChange } = this.props;

    return (
      <ul>
        {items.map(item => (
          <DependencySelectorItem
            isSelected={!!this.props.selectedItems.get(item.serviceIdentifier)}
            key={item.serviceIdentifier}
            item={item}
            onChange={onChange}
          />
        ))}
      </ul>
    );
  }
}
