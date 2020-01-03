import * as React from 'react';
import { setErrorFunction, setInfoAlertFunction } from '../Logging';
import { ErrorDialog, InfoDialog } from './Dialogs';

let nextDialogKey = 0;
function getNextKey(): string {
  return `${++nextDialogKey}`;
}

function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
  const result = new Map();
  map.forEach((v, k) => {
    result.set(k, v);
  });
  return result;
}

function cloneSet<V>(set: Set<V>): Set<V> {
  const result = new Set<V>();
  set.forEach(v => {
    result.add(v);
  });
  return result;
}

export const DialogCoordinator: React.FunctionComponent = () => {
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

  setErrorFunction(showErrorDialog);
  setInfoAlertFunction(showInfoDialog);

  return (
    <React.Fragment>
      {Array.from(dialogs.keys()).map(dialogKey =>
        React.cloneElement(dialogs.get(dialogKey), {
          key: dialogKey,
          open: openDialogKeys.has(dialogKey),
        }),
      )}
    </React.Fragment>
  );
};
