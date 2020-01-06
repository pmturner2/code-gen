import React from 'react';
import { ZsrRequestService } from '../Types';
import { Selector } from './common/Selector';

interface IProps {
  id?: string;
  selectedItem: ZsrRequestService;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const ZsrServiceSelector: React.FunctionComponent<IProps> = props => {
  const { id = 'service', selectedItem, onChange } = props;
  const enumKeys = Object.keys(ZsrRequestService);
  const items: string[] = enumKeys.map(
    (key: keyof typeof ZsrRequestService) => ZsrRequestService[key],
  );

  return (
    <Selector
      title={'Service'}
      items={items}
      selectedItem={selectedItem}
      id={id}
      onChange={onChange}
    />
  );
};
