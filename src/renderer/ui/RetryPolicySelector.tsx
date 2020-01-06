import React from 'react';
import { RetryPolicy } from '../Types';
import { Selector } from './common/Selector';

interface IProps {
  id?: string;
  selectedItem: RetryPolicy;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const RetryPolicySelector: React.FunctionComponent<IProps> = props => {
  const { id = 'retry-policy', selectedItem, onChange } = props;
  const enumKeys = Object.keys(RetryPolicy);
  const items: string[] = enumKeys.map((key: keyof typeof RetryPolicy) => RetryPolicy[key]);

  return (
    <Selector
      title={'Retry Policy'}
      items={items}
      selectedItem={selectedItem}
      id={id}
      onChange={onChange}
    />
  );
};
