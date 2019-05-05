import React from 'react';

interface IProps {
  title: string;
  className?: string;
}

export class CardWithHeader extends React.Component<IProps> {
  render() {
    const { title, children, className } = this.props;

    return (
      <div className={`card ${className}`}>
        <span className="header">{title}</span>
        {children}
      </div>
    );
  }
}
