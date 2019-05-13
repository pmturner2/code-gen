import React from 'react';
import { SidebarOption } from './SidebarOption';

export interface ISidebarOption {
  id: string;
  title: string;
  onClick: () => void;
}

export interface IProps {
  selectedOptionId: string;
  options: ISidebarOption[];
}

export class Sidebar extends React.Component<IProps> {
  render() {
    return (
      <div className="sidebar">
        {this.props.options.map(option => (
          <SidebarOption
            id={option.id}
            key={option.id}
            isSelected={this.isSelected(option.id)}
            title={option.title}
            onClick={option.onClick}
          />
        ))}
      </div>
    );
  }

  private isSelected(id: string): boolean {
    return this.props.selectedOptionId === id;
  }
}
