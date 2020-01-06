import * as React from 'react';
import { useEffect } from 'react';
import { uppercaseFirstLetter } from '../generator/Utils';
import { HttpRequestVerb, IZsrRequest, RetryPolicy, ZsrRequestService } from '../Types';
import { FormSection } from './common/FormSection';
import { MultiLineTextInput } from './common/MultiLineTextInput';
import { TextInput } from './common/TextInput';
import { HttpVerbSelector } from './HttpVerbSelector';
import { RetryPolicySelector } from './RetryPolicySelector';
import { ZsrServiceSelector } from './ZsrServiceSelector';

interface IProps {
  onChange: (request: IZsrRequest) => void;
  onClickRemove: () => void;
}

/**
 * Form for generating Service, DomainStore, or ScreenStore classes
 */
export const ZsrApiForm: React.FunctionComponent<IProps> = props => {
  const [verb, setVerb] = React.useState<HttpRequestVerb>(HttpRequestVerb.Get);
  const [service, setService] = React.useState<ZsrRequestService>(ZsrRequestService.Gwf);
  const [method, setMethod] = React.useState('');
  const [retryPolicy, setRetryPolicy] = React.useState<RetryPolicy>(RetryPolicy.Exponential);
  const [eventKey, setEventKey] = React.useState('');
  const [hasEditedEventKey, setHasEditedEventKey] = React.useState(false);
  const [functionName, setFunctionName] = React.useState('');
  const [hasEditedFunctionName, setHasEditedFunctionName] = React.useState(false);
  const [requestObjectName, setRequestObjectName] = React.useState('');
  const [hasEditedRequestObjectName, setHasEditedRequestObjectName] = React.useState(false);
  const [responseObjectName, setResponseObjectName] = React.useState('');
  const [hasEditedResponseObjectName, setHasEditedResponseObjectName] = React.useState(false);
  const [requestJson, setRequestJson] = React.useState('{}');
  const [responseJson, setResponseJson] = React.useState('{}');

  function buildDefaultEventKey() {
    return `${verb} ${service}/${method}`;
  }

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
    if (!hasEditedEventKey) {
      const newKey = buildDefaultEventKey();
      if (newKey !== eventKey) {
        setEventKey(newKey);
      }
    }
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
    });
  }, [
    method,
    service,
    verb,
    retryPolicy,
    eventKey,
    functionName,
    requestObjectName,
    responseObjectName,
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

  const handleEventKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEventKey(event.target.value);
    setHasEditedEventKey(true);
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
      />
      <RetryPolicySelector selectedItem={retryPolicy} onChange={handleRetryPolicyChange} />
      <TextInput
        label="Event Key"
        name="eventKey"
        placeholder="e.g. `GET gwf/games`"
        onChange={handleEventKeyChange}
        value={eventKey}
      />
      <TextInput
        label="Function Name"
        name="functionName"
        placeholder="e.g. `fetchGames`"
        onChange={handleFunctionNameChange}
        value={functionName}
      />
      <FormSection title={'Request Object'}>
        <TextInput
          label="Name"
          name="requestObjectName"
          placeholder="e.g. `IGameFetchRequest`"
          onChange={handleRequestObjectNameChange}
          value={requestObjectName}
        />
        <MultiLineTextInput
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
        <MultiLineTextInput
          label="Json"
          name="responseObjectJson"
          placeholder="e.g. `{}`"
          onChange={handleResponseJsonChange}
          value={responseJson}
        />
      </FormSection>
    </React.Fragment>
  );
};
