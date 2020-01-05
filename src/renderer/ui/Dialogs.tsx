import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogProps,
  DialogTitle,
  Fade,
  Grid,
  Typography,
} from '@material-ui/core';
import ErrorIcon from '@material-ui/icons/Error';
import * as React from 'react';

const kTransitionInDuration = 700;
const kTransitionOutDuration = 350;

export interface ISimpleDialogProps extends DialogProps {
  onExited?: () => void;
  handleClose?: () => void;
}

export interface ISimpleOneButtonDialogProps extends ISimpleDialogProps {
  buttonText?: string;
  onClick?: () => void;
  hideButton?: boolean;
}

export interface IErrorDialogProps extends ISimpleOneButtonDialogProps {
  message: string;
  title?: string;
}

export interface IInfoDialogProps extends ISimpleOneButtonDialogProps {
  message: string;
  title?: string;
}

export const SimpleDialog: React.FunctionComponent<ISimpleDialogProps> = props => {
  const { open, onExited, handleClose, children, ...dialogProps } = props;
  return (
    <Dialog
      open={open}
      closeAfterTransition
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="sm"
      fullWidth={true}
      onExited={onExited}
      transitionDuration={{ enter: kTransitionInDuration, exit: kTransitionOutDuration }}
      {...dialogProps}
    >
      <Fade timeout={{ enter: kTransitionInDuration, exit: kTransitionOutDuration }} in={open}>
        <div>{children}</div>
      </Fade>
    </Dialog>
  );
};

export const SimpleOneButtonDialog: React.FunctionComponent<ISimpleOneButtonDialogProps> = props => {
  const { buttonText, onClick, hideButton, children, ...dialogProps } = props;
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (dialogProps.handleClose) {
      dialogProps.handleClose();
    }
  };

  return (
    <SimpleDialog {...dialogProps}>
      {children}
      <DialogActions>
        <Button
          onClick={handleClick}
          color="primary"
          style={{
            visibility: hideButton ? 'hidden' : 'visible',
          }}
        >
          {buttonText || 'Okay'}
        </Button>
      </DialogActions>
    </SimpleDialog>
  );
};

export const InfoDialog: React.FunctionComponent<IInfoDialogProps> = props => {
  const { message, title } = props;

  return (
    <SimpleOneButtonDialog {...props}>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{message}</DialogContentText>
      </DialogContent>
    </SimpleOneButtonDialog>
  );
};

export const ErrorDialog: React.FunctionComponent<IErrorDialogProps> = props => {
  const { message, title } = props;
  return (
    <SimpleOneButtonDialog {...props}>
      <Grid container direction="row" alignItems="center" className="dialog-title-with-icon">
        <Grid item>
          <ErrorIcon color="error" style={{ marginRight: 5 }} />
        </Grid>
        <Grid item>
          <Typography color="error">{title || 'ERROR'}</Typography>
        </Grid>
      </Grid>

      <DialogContent>
        <DialogContentText id="alert-dialog-description">{message}</DialogContentText>
      </DialogContent>
    </SimpleOneButtonDialog>
  );
};
