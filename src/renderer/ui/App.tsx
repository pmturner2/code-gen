import * as React from 'react';
import { AddConfigsForm } from './AddConfigsForm';
import { AddOptimizationsForm } from './AddOptimizationsForm';
import { AppHeader } from './AppHeader';
import { DialogCoordinator } from './DialogCoordinator';
import { DomainStoreCreateForm } from './DomainStoreCreateForm';
import { FeatureCreateForm } from './FeatureCreateForm';
import { HomeContent } from './HomeContent';
import { MainPanel } from './MainPanel';
import { ScreenStoreCreateForm } from './ScreenStoreCreateForm';
import { ServiceCreateForm } from './ServiceCreateForm';
import { ISidePanelOption, ISidePanelSection, SidePanel } from './SidePanel';

interface IState {
  mainContent: React.ReactElement<any>;
}

enum SidePanelOption {
  Configs = 'Add Server Configs',
  DomainStore = 'Generate Domain Store',
  Feature = 'Generate Feature',
  Home = 'Home',
  Optimizations = 'Add EOS Optimizations',
  ScreenStore = 'Generate UI Store',
  Service = 'Generate Service',
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
        options: [this.createSidePanelOption(SidePanelOption.Home)],
      },
      {
        options: [
          this.createSidePanelOption(SidePanelOption.Service),
          this.createSidePanelOption(SidePanelOption.DomainStore),
          this.createSidePanelOption(SidePanelOption.ScreenStore),
        ],
      },
      {
        options: [this.createSidePanelOption(SidePanelOption.Feature)],
      },
      {
        options: [
          this.createSidePanelOption(SidePanelOption.Optimizations),
          this.createSidePanelOption(SidePanelOption.Configs),
        ],
      },
    ];
  }

  private createSidePanelOption(title: SidePanelOption): ISidePanelOption {
    return {
      id: title,
      onClick: () => {
        this.navigateTo(title);
      },
      title,
    };
  }

  private navigateTo = (screen: SidePanelOption): void => {
    this.setState({
      mainContent: this.getContent(screen),
    });
  };

  private getContent = (screen: SidePanelOption): React.ReactElement<any> => {
    switch (screen) {
      case SidePanelOption.Home:
        return <HomeContent navigate={this.navigateTo} />;
      case SidePanelOption.Service:
        return <ServiceCreateForm navigate={this.navigateTo} />;
      case SidePanelOption.DomainStore:
        return <DomainStoreCreateForm navigate={this.navigateTo} />;
      case SidePanelOption.ScreenStore:
        return <ScreenStoreCreateForm navigate={this.navigateTo} />;
      case SidePanelOption.Feature:
        return <FeatureCreateForm navigate={this.navigateTo} />;
      case SidePanelOption.Optimizations:
        return <AddOptimizationsForm navigate={this.navigateTo} />;
      case SidePanelOption.Configs:
        return <AddConfigsForm navigate={this.navigateTo} />;
    }
  };
}
