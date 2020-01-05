import { DialogContent, DialogContentText, DialogTitle, Grid } from '@material-ui/core';
import ErrorIcon from '@material-ui/icons/Error';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import * as React from 'react';
import { IProgressStep, ProgressStepStatus } from '../Types';
import { ISimpleOneButtonDialogProps, SimpleOneButtonDialog } from './Dialogs';

interface IProgressDialogProps extends ISimpleOneButtonDialogProps {
  title: string;
  steps: IProgressStep[];
}

function getClassNameForColor(status: ProgressStepStatus) {
  switch (status) {
    case ProgressStepStatus.Incomplete:
      return 'incomplete';
    case ProgressStepStatus.Complete:
      return 'success';
    case ProgressStepStatus.InProgress:
      return 'inprogress';
    case ProgressStepStatus.Error:
      return 'error';
    default:
      return 'incomplete';
  }
}

function renderIcon(status: ProgressStepStatus) {
  switch (status) {
    case ProgressStepStatus.Incomplete:
      return (
        <RadioButtonUncheckedIcon className={`${getClassNameForColor(status)} progress-icon`} />
      );
    case ProgressStepStatus.InProgress:
      return (
        <RadioButtonUncheckedIcon className={`${getClassNameForColor(status)} progress-icon`} />
      );
    case ProgressStepStatus.Complete:
      return <RadioButtonCheckedIcon className={`${getClassNameForColor(status)} progress-icon`} />;
    case ProgressStepStatus.Error:
      return <ErrorIcon className={`${getClassNameForColor(status)} progress-icon`} />;
    default:
      return (
        <RadioButtonUncheckedIcon className={`${getClassNameForColor(status)} progress-icon`} />
      );
  }
}

export const ProgressDialog: React.FunctionComponent<IProgressDialogProps> = props => {
  const { title, steps } = props;
  const isFinished =
    steps.some(step => step.status === ProgressStepStatus.Error) ||
    steps.every(step => step.status === ProgressStepStatus.Complete);
  return (
    <SimpleOneButtonDialog
      {...props}
      hideButton={!isFinished}
      disableBackdropClick={true}
      disableEscapeKeyDown={true}
      buttonText={'Done'}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>
        <Grid container direction="column">
          {steps.map((step, index) => (
            <Grid key={index.toString()} container direction="row" spacing={2}>
              <Grid item>{renderIcon(step.status)}</Grid>
              <Grid item className={`${getClassNameForColor(step.status)} progress-label`}>
                <DialogContentText color="inherit" key={`${index}`}>
                  {step.description}
                </DialogContentText>
              </Grid>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </SimpleOneButtonDialog>
  );
};
