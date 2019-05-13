import React from 'react';
import { IInjectable } from '../Types';

interface IProps {
  item: IInjectable;
  isSelected: boolean;
  onChange: (serviceIdentifier: string, isSelected: boolean) => void;
}

export class DependencySelectorItem extends React.Component<IProps> {
  render() {
    const { item } = this.props;
    if (!item) {
      throw new Error('Unexpected missing item');
    }

    return (
      <li>
        <label>
          <input
            className="checkbox"
            type="checkbox"
            name={item.serviceIdentifier}
            onChange={this.handleChange}
            checked={this.props.isSelected}
          />
          {item.serviceIdentifier}
        </label>
      </li>
    );
  }
  private handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    if (this.props.onChange) {
      this.props.onChange(target.name, target.checked);
    }
  };
}
