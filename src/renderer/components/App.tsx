import * as React from 'react';
import { IInjectable } from '../Types';
import { HomeContent } from './HomeContent';
import { MainContent } from './MainContent';
import { ServiceCreateForm } from './ServiceCreateForm';
import { ISidebarOption, Sidebar } from './sidebar/Sidebar';

interface IState {
  screenContent: React.ReactElement<any>;
  selectedOptionId: string;
  services: IInjectable[];
}

export class App extends React.Component<{}, IState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      screenContent: <HomeContent navigate={this.navigateTo} />,
      selectedOptionId: 'Home',
      services: new Array<IInjectable>(),
    };
  }

  componentDidCatch?(error: Error, errorInfo: React.ErrorInfo): void {
    console.log(error, errorInfo);
  }

  render() {
    return (
      <div className="app-root">
        <Sidebar selectedOptionId={this.state.selectedOptionId} options={this.sideBarOptions()} />
        <MainContent>{this.state.screenContent}</MainContent>
      </div>
    );
  }

  private sideBarOptions(): ISidebarOption[] {
    return [this.createSidebarOption('Home'), this.createSidebarOption('Generate Service')];
  }

  private createSidebarOption(title: string): ISidebarOption {
    return {
      id: title,
      onClick: () => {
        this.navigateTo(title);
      },
      title,
    };
  }

  private navigateTo = (screen: string): void => {
    switch (screen) {
      case 'Home':
        this.setState({
          screenContent: <HomeContent navigate={this.navigateTo} />,
          selectedOptionId: 'Home',
        });
        break;
      case 'Generate Service':
        this.setState({
          screenContent: <ServiceCreateForm navigate={this.navigateTo} />,
          selectedOptionId: 'Generate Service',
        });
        break;
    }
  };
}
