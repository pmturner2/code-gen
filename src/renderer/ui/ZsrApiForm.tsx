import { Typography } from '@material-ui/core';
import * as React from 'react';
import { useEffect } from 'react';
import { uppercaseFirstLetter } from '../generator/Utils';
import { HttpRequestVerb, IZsrRequest, RetryPolicy, ZsrRequestService } from '../Types';
import { FormSection } from './common/FormSection';
import { JsonTextInput } from './common/JsonTextInput';
import { TextInput } from './common/TextInput';
import { HttpVerbSelector } from './HttpVerbSelector';
import { RetryPolicySelector } from './RetryPolicySelector';
import { ZsrServiceSelector } from './ZsrServiceSelector';

interface IProps {
  onChange: (request: IZsrRequest) => void;
}

/**
 * Form for generating Service, DomainStore, or ScreenStore classes
 */
export const ZsrApiForm: React.FunctionComponent<IProps> = props => {
  const [verb, setVerb] = React.useState<HttpRequestVerb>(HttpRequestVerb.Get);
  const [service, setService] = React.useState<ZsrRequestService>(ZsrRequestService.Gwf);
  const [method, setMethod] = React.useState('');
  const [retryPolicy, setRetryPolicy] = React.useState<RetryPolicy>(RetryPolicy.Exponential);
  const [functionName, setFunctionName] = React.useState('');
  const [hasEditedFunctionName, setHasEditedFunctionName] = React.useState(false);
  const [requestObjectName, setRequestObjectName] = React.useState('');
  const [hasEditedRequestObjectName, setHasEditedRequestObjectName] = React.useState(false);
  const [responseObjectName, setResponseObjectName] = React.useState('');
  const [hasEditedResponseObjectName, setHasEditedResponseObjectName] = React.useState(false);
  const [requestJson, setRequestJson] = React.useState('{}');
  const [responseJson, setResponseJson] = React.useState('{}');

  function getPrefix(verb: HttpRequestVerb): string {
    return verb === HttpRequestVerb.Get ? 'fetch' : verb.toLowerCase();
  }

  function buildDefaultFunctionName() {
    return `${getPrefix(verb)}${uppercaseFirstLetter(service)}${uppercaseFirstLetter(method)}`;
  }

  function buildRequestObjectName() {
    return `I${uppercaseFirstLetter(getPrefix(verb))}${uppercaseFirstLetter(
      service,
    )}${uppercaseFirstLetter(method)}Request`;
  }

  function buildResponseObjectName() {
    return `I${uppercaseFirstLetter(getPrefix(verb))}${uppercaseFirstLetter(
      service,
    )}${uppercaseFirstLetter(method)}Response`;
  }

  useEffect(() => {
    if (!hasEditedFunctionName) {
      const newFunctionName = buildDefaultFunctionName();
      if (newFunctionName !== functionName) {
        setFunctionName(newFunctionName);
      }
    }
    if (!hasEditedRequestObjectName) {
      const newRequestObjectName = buildRequestObjectName();
      if (newRequestObjectName !== requestObjectName) {
        setRequestObjectName(newRequestObjectName);
      }
    }
    if (!hasEditedResponseObjectName) {
      const newResponseObjectName = buildResponseObjectName();
      if (newResponseObjectName !== responseObjectName) {
        setResponseObjectName(newResponseObjectName);
      }
    }

    props.onChange({
      verb,
      service,
      method,
      retryPolicy,
      requestObjectInterfaceName: requestObjectName,
      responseObjectInterfaceName: responseObjectName,
      functionName,
      requestJson,
      responseJson,
    });
  }, [
    method,
    service,
    verb,
    retryPolicy,
    functionName,
    requestObjectName,
    responseObjectName,
    requestJson,
    responseJson,
  ]);

  const handleHttpVerbChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setVerb(event.target.value as HttpRequestVerb);
  };

  const handleZsrServiceChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setService(event.target.value as ZsrRequestService);
  };

  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMethod(event.target.value);
  };

  const handleRetryPolicyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setRetryPolicy(event.target.value as RetryPolicy);
  };

  const handleFunctionNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFunctionName(event.target.value);
    setHasEditedFunctionName(true);
  };

  const handleRequestObjectNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRequestObjectName(event.target.value);
    setHasEditedRequestObjectName(true);
  };

  const handleResponseObjectNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setResponseObjectName(event.target.value);
    setHasEditedResponseObjectName(true);
  };

  const handleRequestJsonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRequestJson(event.target.value);
  };

  const handleResponseJsonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setResponseJson(event.target.value);
  };

  return (
    <React.Fragment>
      <HttpVerbSelector selectedItem={verb} onChange={handleHttpVerbChange} />
      <ZsrServiceSelector selectedItem={service} onChange={handleZsrServiceChange} />
      <TextInput
        label="Method"
        name="method"
        placeholder="e.g. `games` for gwf/games"
        onChange={handleMethodChange}
        value={method}
        required={true}
      />
      <RetryPolicySelector selectedItem={retryPolicy} onChange={handleRetryPolicyChange} />
      <TextInput
        label="Function Name"
        name="functionName"
        placeholder="e.g. `fetchGames`"
        onChange={handleFunctionNameChange}
        value={functionName}
        required={true}
      />
      <FormSection title={'Request Object'}>
        <TextInput
          label="Name"
          name="requestObjectName"
          placeholder="e.g. `IGameFetchRequest`"
          onChange={handleRequestObjectNameChange}
          value={requestObjectName}
        />
        <JsonTextInput
          label="Json"
          name="requestObjectJson"
          placeholder="e.g. `{}`"
          onChange={handleRequestJsonChange}
          value={requestJson}
        />
      </FormSection>
      <FormSection title={'Response Object'}>
        <TextInput
          label="Name"
          name="responseObjectName"
          placeholder="e.g. `IGameFetchResponse`"
          onChange={handleResponseObjectNameChange}
          value={responseObjectName}
        />
        <JsonTextInput
          label="Json"
          name="responseObjectJson"
          placeholder="e.g. `{}`"
          onChange={handleResponseJsonChange}
          value={responseJson}
        />
        <Typography
          variant="subtitle2"
          className="element"
        >{`${verb} ${service}/${method}`}</Typography>
      </FormSection>
    </React.Fragment>
  );
};
