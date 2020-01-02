import * as React from 'react';
import { setErrorFunction, setInfoAlertFunction } from '../Logging';
import { ErrorDialog, InfoDialog } from './Dialogs';

interface IState {
  // All dialogs, including those animating out.
  dialogs: Map<string, React.ReactElement<any>>;

  // Any dialogs that should be considered "open"
  openDialogKeys: Set<string>;
}

export class DialogCoordinator extends React.Component<{}, IState> {
  private nextDialogKey: number = 0;

  state: IState = {
    dialogs: new Map(),
    openDialogKeys: new Set(),
  };

  componentDidMount() {
    setErrorFunction(this.showErrorDialog);
    setInfoAlertFunction(this.showInfoDialog);
  }

  componentWillUnmount() {
    setInfoAlertFunction(null);
    setErrorFunction(null);
  }

  getNextKey(): string {
    return `${++this.nextDialogKey}`;
  }

  showDialog = (element: React.ReactElement<any>): void => {
    const key = this.getNextKey();
    const handleClose = () => {
      this.state.openDialogKeys.delete(key);
      this.setState({ openDialogKeys: this.state.openDialogKeys });
    };

    const onExited = () => {
      if (!this.state.openDialogKeys.has(key)) {
        this.state.dialogs.delete(key);
        this.setState({ dialogs: this.state.dialogs });
      }
    };

    const content = React.cloneElement(element, {
      handleClose,
      onExited,
    });
    this.state.dialogs.set(key, content);
    this.state.openDialogKeys.add(key);
    this.setState({
      dialogs: this.state.dialogs,
      openDialogKeys: this.state.openDialogKeys,
    });
  };

  showErrorDialog = (message: string): void => {
    this.showDialog(<ErrorDialog message={message} />);
  };

  showInfoDialog = (message: string, title?: string): void => {
    this.showDialog(<InfoDialog message={message} title={title} />);
  };

  render() {
    return (
      <React.Fragment>
        {Array.from(this.state.dialogs.keys()).map(dialogKey =>
          React.cloneElement(this.state.dialogs.get(dialogKey), {
            key: dialogKey,
            open: this.state.openDialogKeys.has(dialogKey),
          }),
        )}
      </React.Fragment>
    );
  }
}
