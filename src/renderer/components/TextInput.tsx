import React from 'react';

interface IProps {
  name: string;
  placeholder: string;
  onChange: () => void;
}

export class TextInput extends React.Component<IProps> {
  render() {
    const { name, placeholder } = this.props;

    return (
      <div className="content">
        <input type="text" name={name} placeholder={placeholder} />
      </div>
    );
  }
}
