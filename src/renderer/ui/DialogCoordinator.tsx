import * as React from 'react';
import { cloneMap, cloneSet } from '../generator/Utils';
import { ErrorDialog, InfoDialog } from './Dialogs';

let nextDialogKey = 0;
function getNextKey(): string {
  return `${++nextDialogKey}`;
}

interface IDialogCoordinator {
  showError(message: string): void;
  showInfo(message: string, title?: string): void;
}

export const DialogCoordinatorContext = React.createContext<IDialogCoordinator | undefined>(
  undefined,
);

export const DialogCoordinator: React.FunctionComponent = props => {
  const [dialogs, setDialogs] = React.useState(new Map());
  const [openDialogKeys, setOpenDialogKeys] = React.useState(new Set());

  const showDialog = (element: React.ReactElement<any>): void => {
    const key = getNextKey();
    const handleClose = () => {
      openDialogKeys.delete(key);
      setOpenDialogKeys(cloneSet(openDialogKeys));
    };

    const onExited = () => {
      if (!openDialogKeys.has(key)) {
        dialogs.delete(key);
        setDialogs(cloneMap(dialogs));
      }
    };

    const content = React.cloneElement(element, {
      handleClose,
      onExited,
    });
    dialogs.set(key, content);
    openDialogKeys.add(key);
    setOpenDialogKeys(cloneSet(openDialogKeys));
    setDialogs(cloneMap(dialogs));
  };

  const showErrorDialog = (message: string): void => {
    showDialog(<ErrorDialog message={message} />);
  };

  const showInfoDialog = (message: string): void => {
    showDialog(<InfoDialog message={message} title={undefined} />);
  };

  const [dialogContext] = React.useState<IDialogCoordinator>({
    showError: showErrorDialog,
    showInfo: showInfoDialog,
  });

  return (
    <DialogCoordinatorContext.Provider value={dialogContext}>
      {props.children}
      {Array.from(dialogs.keys()).map(dialogKey =>
        React.cloneElement(dialogs.get(dialogKey), {
          key: dialogKey,
          open: openDialogKeys.has(dialogKey),
        }),
      )}
    </DialogCoordinatorContext.Provider>
  );
};
