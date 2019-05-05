import React from 'react';
import { SidebarOption } from './SidebarOption';

interface IState {
  selectedOptionId: string;
}

export class Sidebar extends React.Component<{}, IState> {
  state = {
    selectedOptionId: 'none',
  };

  render() {
    return (
      <div className="sidebar">
        <SidebarOption
          id={'1'}
          key={'1'}
          isSelected={this.isSelected('1')}
          title="Generate Service"
          onClick={this.createService}
        />
        <SidebarOption
          id={'2'}
          key={'2'}
          isSelected={this.isSelected('2')}
          title="Generate Domain Store"
          onClick={this.createService}
        />
        <SidebarOption
          id={'3'}
          key={'3'}
          isSelected={this.isSelected('3')}
          title="Generate UI Store"
          onClick={this.createService}
        />
        <SidebarOption
          id={'4'}
          key={'4'}
          isSelected={this.isSelected('4')}
          title="Generate Feature"
          onClick={this.createService}
        />
        <SidebarOption
          id={'5'}
          key={'5'}
          isSelected={this.isSelected('5')}
          title="Explore Dependencies"
          onClick={this.createService}
        />
      </div>
    );
  }

  private createService = (id: string) => {
    console.log('Create Service');
    this.setState({ selectedOptionId: id });
  };

  private isSelected(id: string): boolean {
    return this.state.selectedOptionId === id;
  }
}
