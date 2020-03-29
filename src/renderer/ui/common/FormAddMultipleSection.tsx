import { Button, Divider } from '@material-ui/core';
import AddCircle from '@material-ui/icons/AddCircle';
import RemoveCircle from '@material-ui/icons/RemoveCircle';
import React, { useEffect } from 'react';
import { cloneMap } from '../../generator/Utils';
import { FormSection } from './FormSection';

interface IProps<T> {
  title: string;
  elementName: string;
  className?: string;
  startIcon?: React.ReactElement<any>;
  onChange: (elements: T[]) => void;
  defaultElement: T;
  elementCreateForm: React.ComponentType<any>;
}

export function FormAddMultipleSection<T>(props: IProps<T>) {
  const { title, startIcon, elementName, defaultElement, onChange, elementCreateForm } = props;
  const [elements, setElements] = React.useState(new Map<string, T>());
  let nextKey = React.useRef(0);

  useEffect(() => {
    onChange(Array.from(elements.values()));
  }, [elements, onChange]);

  const handleAddElement = () => {
    const key = nextKey.current.toString();
    elements.set(key, {
      ...defaultElement,
    });
    setElements(cloneMap(elements));
    nextKey.current = nextKey.current + 1;
  };

  function createRemoveElementHandler(key: string) {
    return () => {
      elements.delete(key);
      setElements(cloneMap(elements));
    };
  }

  function createElementChangeHandler(key: string) {
    return (element: T) => {
      elements.set(key, element);
      setElements(cloneMap(elements));
    };
  }

  return (
    <FormSection title={title} startIcon={startIcon}>
      <Button
        size={'large'}
        style={{ alignSelf: 'flex-start' }}
        fullWidth={false}
        onClick={handleAddElement}
        startIcon={<AddCircle color="primary" />}
      >
        Add {elementName}
      </Button>
      {Array.from(elements.keys()).map(key => {
        return (
          <React.Fragment key={key}>
            <Divider />
            <Button
              size={'large'}
              style={{
                alignSelf: 'flex-start',
                marginTop: '10px',
              }}
              fullWidth={false}
              onClick={createRemoveElementHandler(key)}
              startIcon={<RemoveCircle color="error" />}
            >
              Remove {elementName}
            </Button>
            {React.createElement(elementCreateForm, {
              onChange: createElementChangeHandler(key),
            })}
          </React.Fragment>
        );
      })}
    </FormSection>
  );
}
