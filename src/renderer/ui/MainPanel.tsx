import React from 'react';

/**
 * Style wrapper around main panel content.
 */
export class MainPanel extends React.Component {
  render() {
    return <div className="main">{this.props.children}</div>;
  }
}
