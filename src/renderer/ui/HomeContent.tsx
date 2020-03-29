import * as React from 'react';

interface IProps {
  navigate: (route: string) => void;
}

/**
 * Home screen content for the main panel when no options selected in side bar.
 */
export const HomeContent: React.FunctionComponent<IProps> = () => {
  return <div />;
};
