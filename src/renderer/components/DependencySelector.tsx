import React from 'react';
import { IInjectable } from '../IInjectable';
import { DependencySelectorItem } from './DependencySelectorItem';

interface IProps {
  items: IInjectable[];
  onChange: (serviceIdentifier: string, isSelected: boolean) => void;
}

export class DependencySelector extends React.Component<IProps> {
  render() {
    const { items, onChange } = this.props;

    return (
      <ul>
        {items.map(item => (
          <DependencySelectorItem key={item.serviceIdentifier} item={item} onChange={onChange} />
        ))}
      </ul>
    );
  }
}
