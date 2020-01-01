import { Card, Typography } from '@material-ui/core';
import React from 'react';

interface IProps {
  title?: string;
  className?: string;
}

export class FormSection extends React.Component<IProps> {
  render() {
    const { title, className, children } = this.props;
    return (
      <Card className={`section ${className}`}>
        <div className={'header'}>
          {title ? <Typography variant="subtitle1">{title}</Typography> : null}
        </div>
        <div className={'children'}>{children}</div>
      </Card>
    );
  }
}
