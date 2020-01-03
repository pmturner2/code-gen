import * as React from 'react';
import { AppHeader } from './AppHeader';
import { DialogCoordinator } from './DialogCoordinator';
import { DomainStoreCreateForm } from './DomainStoreCreateForm';
import { HomeContent } from './HomeContent';
import { MainPanel } from './MainPanel';
import { ScreenStoreCreateForm } from './ScreenStoreCreateForm';
import { ServiceCreateForm } from './ServiceCreateForm';
import { ISidePanelOption, ISidePanelSection, SidePanel } from './SidePanel';

interface IState {
  mainContent: React.ReactElement<any>;
}

export class App extends React.Component<{}, IState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      mainContent: <HomeContent navigate={this.navigateTo} />,
    };
  }

  componentDidCatch?(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(error, errorInfo);
  }

  render() {
    return (
      <div className="app-root">
        <AppHeader />
        <DialogCoordinator>
          <main className="app-content">
            <SidePanel sections={this.sidePanelSections()} />
            <MainPanel>{this.state.mainContent}</MainPanel>
          </main>
        </DialogCoordinator>
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
        });
        break;
      case 'Generate Service':
        this.setState({
          mainContent: <ServiceCreateForm navigate={this.navigateTo} />,
        });
        break;
      case 'Generate Domain Store':
        this.setState({
          mainContent: <DomainStoreCreateForm navigate={this.navigateTo} />,
        });
        break;
      case 'Generate Screen Store':
        this.setState({
          mainContent: <ScreenStoreCreateForm navigate={this.navigateTo} />,
        });
        break;
    }
  };
}
