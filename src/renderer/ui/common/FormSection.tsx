import { Card, Typography } from '@material-ui/core';
import React from 'react';

interface IProps {
  title?: string;
  className?: string;
  startIcon?: React.ReactElement<any>;
}

export const FormSection: React.FunctionComponent<IProps> = props => {
  const { title, className, children, startIcon } = props;
  return (
    <Card className={`section ${className}`} elevation={0}>
      {title ? (
        <div className={'header'}>
          <Typography variant="subtitle2" color="primary">
            {startIcon && React.cloneElement(startIcon)}
            {title.toUpperCase()}
          </Typography>
        </div>
      ) : null}
      <div className={'children'}>{children}</div>
    </Card>
  );
};
