import React from 'react';
import { IInjectable } from '../IInjectable';

interface IProps {
  item: IInjectable;
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
