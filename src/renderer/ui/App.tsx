import * as React from 'react';
import { IInjectable } from '../Types';
import { AppHeader } from './AppHeader';
import { DomainStoreCreateForm } from './DomainStoreCreateForm';
import { HomeContent } from './HomeContent';
import { MainPanel } from './MainPanel';
import { ScreenStoreCreateForm } from './ScreenStoreCreateForm';
import { ServiceCreateForm } from './ServiceCreateForm';
import { ISidePanelOption, ISidePanelSection, SidePanel } from './sidepanel/SidePanel';

interface IState {
  mainContent: React.ReactElement<any>;
  selectedOptionId: string;
  services: IInjectable[];
}

export class App extends React.Component<{}, IState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      mainContent: <HomeContent navigate={this.navigateTo} />,
      selectedOptionId: 'Home',
      services: new Array<IInjectable>(),
    };
  }

  componentDidCatch?(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(error, errorInfo);
  }

  render() {
    return (
      <div className="app-root">
        <AppHeader />
        <main className="app-content">
          <SidePanel sections={this.sidePanelSections()} />
          <MainPanel>{this.state.mainContent}</MainPanel>
        </main>
      </div>
    );
  }

  private sidePanelSections(): ISidePanelSection[] {
    return [
      {
        options: [this.createSidePanelOption('Home')],
      },
      {
        options: [
          this.createSidePanelOption('Generate Service'),
          this.createSidePanelOption('Generate Domain Store'),
          this.createSidePanelOption('Generate Screen Store'),
        ],
      },
    ];
  }

  private createSidePanelOption(title: string): ISidePanelOption {
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
          mainContent: <HomeContent navigate={this.navigateTo} />,
          selectedOptionId: 'Home',
        });
        break;
      case 'Generate Service':
        this.setState({
          mainContent: <ServiceCreateForm navigate={this.navigateTo} />,
          selectedOptionId: 'Generate Service',
        });
        break;
      case 'Generate Domain Store':
        this.setState({
          mainContent: <DomainStoreCreateForm navigate={this.navigateTo} />,
          selectedOptionId: 'Generate Domain Store',
        });
        break;
      case 'Generate Screen Store':
        this.setState({
          mainContent: <ScreenStoreCreateForm navigate={this.navigateTo} />,
          selectedOptionId: 'Generate Screen Store',
        });
        break;
    }
  };
}
