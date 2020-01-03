import React from 'react';

/**
 * Style wrapper around main panel content.
 */
export const MainPanel: React.FunctionComponent = props => {
  return <div className="main">{props.children}</div>;
};
