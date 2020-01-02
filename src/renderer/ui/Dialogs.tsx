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

export class SimpleDialog extends React.Component<ISimpleDialogProps> {
  render() {
    const { open, onExited, handleClose, children } = this.props;

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
  }
}

export class SimpleOneButtonDialog extends React.Component<ISimpleOneButtonDialogProps> {
  render() {
    const { buttonText, onClick, handleClose, children } = this.props;
    const handleClick = () => {
      if (onClick) {
        onClick();
      }
      if (handleClose) {
        handleClose();
      }
    };

    return (
      <SimpleDialog {...this.props}>
        {children}
        <DialogActions>
          <Button onClick={handleClick} color="primary">
            {buttonText || 'Okay'}
          </Button>
        </DialogActions>
      </SimpleDialog>
    );
  }
}

export class InfoDialog extends React.Component<IInfoDialogProps> {
  render() {
    const { message, title } = this.props;
    return (
      <SimpleOneButtonDialog {...this.props}>
        {title && <DialogTitle>{title}</DialogTitle>}
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{message}</DialogContentText>
        </DialogContent>
      </SimpleOneButtonDialog>
    );
  }
}

export class ErrorDialog extends React.Component<IErrorDialogProps> {
  render() {
    const { message, title } = this.props;
    return (
      <SimpleOneButtonDialog {...this.props}>
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
  }
}
