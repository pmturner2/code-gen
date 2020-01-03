import { Card, Typography } from '@material-ui/core';
import React from 'react';

interface IProps {
  title?: string;
  className?: string;
}

export const FormSection: React.FunctionComponent<IProps> = props => {
  const { title, className, children } = props;
  return (
    <Card className={`section ${className}`}>
      <div className={'header'}>
        {title ? <Typography variant="subtitle1">{title}</Typography> : null}
      </div>
      <div className={'children'}>{children}</div>
    </Card>
  );
};
