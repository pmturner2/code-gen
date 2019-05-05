import React from 'react';

interface IProps {
  id: string;
  title: string;
  onClick: (id: string) => void;
  isSelected?: boolean;
}

export class SidebarOption extends React.Component<IProps> {
  render() {
    const { title, isSelected } = this.props;
    const className = isSelected ? 'sidebar-option selected' : 'sidebar-option';
    return (
      <span className={className} onClick={this.handleClick}>
        {title}
      </span>
    );
  }

  private handleClick = () => {
    this.props.onClick(this.props.id);
  };
}
