import React from 'react';
import { InjectableCategory } from '../Constants';
import { generateService } from '../generator/ServiceGenerator';
import {
  HttpRequestVerb,
  INewInjectable,
  IProgressStep,
  IZsrRequest,
  RetryPolicy,
  ZsrRequestService,
} from '../Types';
import { FormAddMultipleSection } from './common/FormAddMultipleSection';
import { DialogCoordinatorContext } from './DialogCoordinator';
import { InjectableCreateForm } from './InjectableCreateForm';
import { ZsrApiForm } from './ZsrApiForm';

interface IProps {
  navigate: (route: string) => void;
}

export const ServiceCreateForm: React.FunctionComponent<IProps> = props => {
  const [zsrRequests, setZsrRequests] = React.useState<IZsrRequest[]>([]);
  const dialogCoordinator = React.useContext(DialogCoordinatorContext);

  const handleZsrRequestsChange = (requests: IZsrRequest[]) => {
    setZsrRequests([...requests]);
  };

  const forceAddDependencies = () => {
    if (zsrRequests.length > 0) {
      return ['ServiceTypes.Logging', 'ServiceTypes.ZSR'];
    }
    return [];
  };

  const submit = async (
    newInjectable: INewInjectable,
    _: InjectableCategory,
    onSubmissionProgress: (progress: IProgressStep[]) => void,
  ) => {
    for (const request of zsrRequests) {
      try {
        if (request.requestJson) {
          JSON.parse(request.requestJson);
        }
        if (request.responseJson) {
          JSON.parse(request.responseJson);
        }
      } catch {
        dialogCoordinator.showError(
          `Invalid json request or response for  ${request.verb} ${request.service}/${request.method}`,
        );
        return;
      }
    }

    await generateService(
      {
        ...newInjectable,
        apiFilename:
          zsrRequests.length !== 0
            ? `${newInjectable.name.substr(0, newInjectable.name.lastIndexOf('Service'))}Api`
            : undefined,
        zsrRequests,
      },
      onSubmissionProgress,
    );
  };
  return (
    <InjectableCreateForm
      navigate={props.navigate}
      dependencyCategories={['Service']}
      category="Service"
      submit={submit}
      forceAddDependencies={forceAddDependencies}
    >
      <FormAddMultipleSection
        title="Zynga Api Calls"
        elementName="Api Call"
        onChange={handleZsrRequestsChange}
        elementCreateForm={ZsrApiForm}
        defaultElement={{
          method: '',
          retryPolicy: RetryPolicy.Exponential,
          service: ZsrRequestService.Gwf,
          verb: HttpRequestVerb.Get,
        }}
      />
    </InjectableCreateForm>
  );
};
