import React from 'react';

interface IProps {
  id: string;
  title: string;
  onClick: () => void;
  isSelected?: boolean;
}

/**
 * Option on the left side of the screen
 */
export class SidePanelOption extends React.Component<IProps> {
  render() {
    const { title, isSelected } = this.props;
    const className = isSelected ? 'sidebar-option selected' : 'sidebar-option';
    return (
      <span className={className} onClick={this.props.onClick}>
        <div className="selection-mark" />
        {title}
      </span>
    );
  }
}
