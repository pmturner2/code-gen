import { Button } from '@material-ui/core';
import * as React from 'react';
import { IProgressStep } from '../../Types';
import { DialogCoordinatorContext } from '../DialogCoordinator';
import { ProgressDialog } from '../ProgressDialog';
import { FormAddMultipleSection } from './FormAddMultipleSection';
import { FormSection } from './FormSection';

interface IProps<T> {
  navigate: (route: string) => void;
  submit?: (params: {
    elements: T[];
    onProgress: (progress: IProgressStep[]) => void;
  }) => Promise<void>;

  title: string;
  elementName: string;
  className?: string;
  startIcon?: React.ReactElement<any>;
  defaultElement: T;
  elementCreateForm: React.ComponentType<any>;
}

/**
 * Form wrapper for a single element type `FormAddMultipleSection`
 */
export function FormAddMultiple<T>(props: IProps<T>) {
  const [submissionProgress, setSubmissionProgress] = React.useState([]);
  const dialogCoordinator = React.useContext(DialogCoordinatorContext);
  const [elements, setElements] = React.useState<T[]>([]);

  const handleElementsChange = (newElements: T[]) => {
    setElements([...newElements]);
  };

  const onSubmissionProgress = (progress: IProgressStep[]) => {
    setSubmissionProgress(progress);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await props.submit({
        elements,
        onProgress: onSubmissionProgress,
      });
    } catch (error) {
      dialogCoordinator.showError(error.message ? error.message : error);
    }
  };

  const handleDialogClose = () => {
    props.navigate('Home');
  };

  return (
    <React.Fragment>
      <form onSubmit={handleSubmit} className="main-content">
        <FormAddMultipleSection
          title={props.title}
          elementName={props.elementName}
          onChange={handleElementsChange}
          elementCreateForm={props.elementCreateForm}
          defaultElement={props.defaultElement}
        />
        <FormSection>
          <Button
            type="submit"
            name="Submit"
            value="Create"
            fullWidth={false}
            className="form-submit element"
            variant="contained"
            color="primary"
          >
            Create
          </Button>
        </FormSection>
      </form>
      <ProgressDialog
        open={submissionProgress.length !== 0}
        steps={submissionProgress}
        title={`Updating code for ${props.elementName}`}
        handleClose={handleDialogClose}
      />
    </React.Fragment>
  );
}
