import React from 'react';

interface IProps {
  title: string;
  className?: string;
  collapsible?: boolean;
}

interface IState {
  isOpen: boolean;
}

export class FormSection extends React.Component<IProps, IState> {
  state = {
    isOpen: !this.props.collapsible,
  };

  render() {
    const { title, children, className, collapsible = false } = this.props;

    const childClassName = this.state.isOpen ? 'children' : 'children';
    const headerClassName = collapsible ? 'collapsible header' : 'header';
    return (
      <div className={`section ${className}`}>
        <div className={headerClassName} onClick={collapsible ? this.handleClick : null}>
          {collapsible ? <span className="header-icon">{this.renderCollapsibleIcon()}</span> : null}
          <span className="header-text">{title}</span>
        </div>
        <div className={childClassName}>{this.state.isOpen ? children : null}</div>
      </div>
    );
  }

  handleClick = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  renderCollapsibleIcon() {
    return this.state.isOpen ? ' - ' : ' + ';
  }
}
