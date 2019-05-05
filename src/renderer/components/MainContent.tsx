import React from 'react';

export class MainContent extends React.Component {
  render() {
    return <div className="main">{this.props.children}</div>;
  }
}
