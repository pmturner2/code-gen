import * as React from 'react';
import { IInjectable } from '../IInjectable';
import { MainContent } from './MainContent';
import { ServiceCreateForm } from './ServiceCreateForm';
import { Sidebar } from './Sidebar';

interface IState {
  services: IInjectable[];
}

export class App extends React.Component<{}, IState> {
  state = {
    services: new Array<IInjectable>(),
  };

  componentDidCatch?(error: Error, errorInfo: React.ErrorInfo): void {
    console.log(error, errorInfo);
  }

  render() {
    return (
      <div className="app-root">
        <Sidebar />
        <MainContent>
          <ServiceCreateForm />
        </MainContent>
      </div>
    );
  }
}
