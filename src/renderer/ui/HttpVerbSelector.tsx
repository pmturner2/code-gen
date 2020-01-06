import React from 'react';
import { HttpRequestVerb } from '../Types';
import { Selector } from './common/Selector';

interface IProps {
  id?: string;
  selectedItem: HttpRequestVerb;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const HttpVerbSelector: React.FunctionComponent<IProps> = props => {
  const { id = 'verb', selectedItem, onChange } = props;
  const enumKeys = Object.keys(HttpRequestVerb);
  const items: string[] = enumKeys.map((key: keyof typeof HttpRequestVerb) => HttpRequestVerb[key]);

  return (
    <Selector
      title={'Verb'}
      items={items}
      selectedItem={selectedItem}
      id={id}
      onChange={onChange}
    />
  );
};
