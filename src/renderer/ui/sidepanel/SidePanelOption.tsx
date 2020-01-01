import { ListItem, ListItemText } from '@material-ui/core';
import React from 'react';

interface IProps {
  id: string;
  title: string;
  onClick: () => void;
}

/**
 * Option on the left side of the screen
 */
export class SidePanelOption extends React.Component<IProps> {
  render() {
    const { title } = this.props;
    return (
      <ListItem button key={title} onClick={this.props.onClick}>
        <ListItemText primary={title} />
      </ListItem>
    );
  }
}
