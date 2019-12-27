import React from 'react';
import { InjectableCategory } from '../../Constants';
import { IInjectable } from '../../Types';
import { DependencySelectorItem } from './DependencySelectorItem';

interface IProps {
  category: InjectableCategory;
  items: IInjectable[];
  selectedItems: Map<string, boolean>;
  onChange: (serviceIdentifier: string, isSelected: boolean) => void;
}

export class DependencySelector extends React.Component<IProps> {
  render() {
    const { category, items, onChange } = this.props;

    return (
      <React.Fragment>
        <span className="header-text">{category}</span>
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
      </React.Fragment>
    );
  }
}
