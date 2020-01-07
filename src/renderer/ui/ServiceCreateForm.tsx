import { Button, Divider, IconButton } from '@material-ui/core';
import AddCircle from '@material-ui/icons/AddCircle';
import RemoveCircle from '@material-ui/icons/RemoveCircle';
import React from 'react';
import { InjectableCategory } from '../Constants';
import { generateService } from '../generator/ServiceGenerator';
import { cloneMap } from '../generator/Utils';
import {
  HttpRequestVerb,
  INewInjectable,
  IProgressStep,
  IZsrRequest,
  RetryPolicy,
  ZsrRequestService,
} from '../Types';
import { FormSection } from './common/FormSection';
import { InjectableCreateForm } from './InjectableCreateForm';
import { ZsrApiForm } from './ZsrApiForm';

interface IProps {
  navigate: (route: string) => void;
}

export const ServiceCreateForm: React.FunctionComponent<IProps> = props => {
  const [zsrApis, setZsrApis] = React.useState(new Map<string, IZsrRequest>());
  const [nextKey, setNextKey] = React.useState(0);

  const handleAddZsrApi = () => {
    const key = nextKey.toString();
    zsrApis.set(key, {
      method: '',
      retryPolicy: RetryPolicy.Exponential,
      service: ZsrRequestService.Gwf,
      verb: HttpRequestVerb.Get,
    });
    setZsrApis(cloneMap(zsrApis));
    setNextKey(nextKey + 1);
  };

  function createZsrApiRemoveHandler(key: string) {
    return () => {
      zsrApis.delete(key);
      setZsrApis(cloneMap(zsrApis));
    };
  }

  function createZsrApiFormChangeHandler(key: string) {
    return (requestData: IZsrRequest) => {
      zsrApis.set(key, requestData);
      setZsrApis(cloneMap(zsrApis));
    };
  }

  const forceAddDependencies = () => {
    if (zsrApis.size > 0) {
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
          zsrApis.size !== 0
            ? `${request.name.substr(0, request.name.lastIndexOf('Service'))}Api`
            : undefined,
        zsrRequests: Array.from(zsrApis.keys()).map(key => zsrApis.get(key)),
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
      <FormSection title="Zynga Api Calls">
        <Button
          size={'large'}
          style={{ alignSelf: 'flex-start' }}
          fullWidth={false}
          onClick={handleAddZsrApi}
          startIcon={<AddCircle color="primary" />}
        >
          Add Api Call
        </Button>
        {Array.from(zsrApis.keys()).map(key => {
          return (
            <div key={key}>
              <Divider />
              <FormSection
                startIcon={
                  <IconButton onClick={createZsrApiRemoveHandler(key)}>
                    <RemoveCircle color="error" />
                  </IconButton>
                }
                title="Api Call"
              >
                <ZsrApiForm
                  onChange={createZsrApiFormChangeHandler(key)}
                  onClickRemove={createZsrApiRemoveHandler(key)}
                />
              </FormSection>
            </div>
          );
        })}
      </FormSection>
    </InjectableCreateForm>
  );
};
