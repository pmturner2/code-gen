import React from 'react';
import { SidePanelOption } from './SidePanelOption';

export interface ISidePanelOption {
  id: string;
  title: string;
  onClick: () => void;
}

interface IProps {
  selectedOptionId: string;
  options: ISidePanelOption[];
}

/**
 * Panel on the left side of the screen with options
 */
export class SidePanel extends React.Component<IProps> {
  render() {
    return (
      <div className="sidebar">
        {this.props.options.map(option => (
          <SidePanelOption
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
