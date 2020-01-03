import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fade,
  Grid,
  Typography,
} from '@material-ui/core';
import ErrorIcon from '@material-ui/icons/Error';
import * as React from 'react';

const kTransitionInDuration = 700;
const kTransitionOutDuration = 350;

interface ISimpleDialogProps {
  open?: boolean;
  onExited?: () => void;
  handleClose?: () => void;
}

interface ISimpleOneButtonDialogProps extends ISimpleDialogProps {
  buttonText?: string;
  onClick?: () => void;
}

interface IErrorDialogProps extends ISimpleOneButtonDialogProps {
  message: string;
  title?: string;
}

interface IInfoDialogProps extends ISimpleOneButtonDialogProps {
  message: string;
  title?: string;
}

export const SimpleDialog: React.FunctionComponent<ISimpleDialogProps> = props => {
  const { open, onExited, handleClose, children } = props;
  return (
    <Dialog
      open={open}
      closeAfterTransition
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="xs"
      fullWidth={true}
      onExited={onExited}
      transitionDuration={{ enter: kTransitionInDuration, exit: kTransitionOutDuration }}
    >
      <Fade timeout={{ enter: kTransitionInDuration, exit: kTransitionOutDuration }} in={open}>
        <div>{children}</div>
      </Fade>
    </Dialog>
  );
};

export const SimpleOneButtonDialog: React.FunctionComponent<ISimpleOneButtonDialogProps> = props => {
  const { buttonText, onClick, handleClose, children } = props;
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (handleClose) {
      handleClose();
    }
  };

  return (
    <SimpleDialog {...props}>
      {children}
      <DialogActions>
        <Button onClick={handleClick} color="primary">
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
