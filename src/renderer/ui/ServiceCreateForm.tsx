import { Button, Divider, IconButton } from '@material-ui/core';
import AddCircle from '@material-ui/icons/AddCircle';
import RemoveCircle from '@material-ui/icons/RemoveCircle';
import React from 'react';
import { cloneMap } from '../generator/Utils';
import { FormSection } from './common/FormSection';
import { InjectableCreateForm } from './InjectableCreateForm';
import { ZsrApiForm } from './ZsrApiForm';

interface IProps {
  navigate: (route: string) => void;
}

export const ServiceCreateForm: React.FunctionComponent<IProps> = props => {
  const [zsrApis, setZsrApis] = React.useState(new Map());
  const [nextKey, setNextKey] = React.useState(0);

  const handleAddZsrApi = () => {
    const key = nextKey.toString();
    console.log('Add Zsr Api ' + key);
    zsrApis.set(key, {});
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
    return () => {
      zsrApis.set(key, {});
    };
  }

  console.log(Array.from(zsrApis.keys()));

  return (
    <InjectableCreateForm
      navigate={props.navigate}
      dependencyCategories={['Service']}
      category="Service"
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
            <div>
              <Divider />
              <FormSection
                key={key}
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
