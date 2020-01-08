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
import { InjectableCreateForm } from './InjectableCreateForm';
import { ZsrApiForm } from './ZsrApiForm';

interface IProps {
  navigate: (route: string) => void;
}

export const ServiceCreateForm: React.FunctionComponent<IProps> = props => {
  const [zsrRequests, setZsrRequests] = React.useState<IZsrRequest[]>([]);

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
    request: INewInjectable,
    _: InjectableCategory,
    onSubmissionProgress: (progress: IProgressStep[]) => void,
  ) => {
    await generateService(
      {
        ...request,
        apiFilename:
          zsrRequests.length !== 0
            ? `${request.name.substr(0, request.name.lastIndexOf('Service'))}Api`
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
        elementName="ApiCall"
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
