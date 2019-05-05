import React from 'react';
import { SidebarOption } from './SidebarOption';

export interface ISidebarOption {
  id: string;
  title: string;
  onClick: () => void;
}

export interface IProps {
  defaultId: string;
  options: ISidebarOption[];
}

interface IState {
  selectedOptionId: string;
}

export class Sidebar extends React.Component<IProps, IState> {
  state = {
    selectedOptionId: this.props.defaultId,
  };

  render() {
    return (
      <div className="sidebar">
        {this.props.options.map(option => (
          <SidebarOption
            id={option.id}
            key={option.id}
            isSelected={this.isSelected(option.id)}
            title={option.title}
            onClick={this.generateHandleClick(option.id, option.onClick)}
          />
        ))}
      </div>
    );
  }

  private generateHandleClick = (id: string, onClick: () => void) => {
    return () => {
      this.setState({ selectedOptionId: id });
      onClick();
    };
  };

  private isSelected(id: string): boolean {
    return this.state.selectedOptionId === id;
  }
}
