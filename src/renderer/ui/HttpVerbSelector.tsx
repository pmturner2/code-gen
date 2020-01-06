import React from 'react';
import { HttpRequestVerb } from '../Types';
import { Selector } from './common/Selector';

interface IProps {
  key: string;
  title: string;
  selectedItem: HttpRequestVerb;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const HttpVerbSelector: React.FunctionComponent<IProps> = props => {
  const { key, title, selectedItem, onChange } = props;
  const enumKeys = Object.keys(HttpRequestVerb);
  const items: string[] = enumKeys.map((key: keyof typeof HttpRequestVerb) => HttpRequestVerb[key]);

  return (
    <Selector
      title={title}
      items={items}
      selectedItem={selectedItem}
      key={key}
      onChange={onChange}
    />
  );
};
