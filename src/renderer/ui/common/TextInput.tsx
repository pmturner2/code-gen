import React from 'react';

interface IProps {
  label: string;
  name: string;
  placeholder: string;
  onChange: (name: string, value: string) => void;
}

export class TextInput extends React.Component<IProps> {
  render() {
    const { label, name, placeholder } = this.props;

    return (
      <div className="text-input-row">
        <label className="text-input-label">{label}</label>
        <input
          className="text-input"
          type="text"
          name={name}
          placeholder={placeholder}
          onChange={this.handleChange}
        />
      </div>
    );
  }

  private handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    if (this.props.onChange) {
      this.props.onChange(this.props.name, target.value);
    }
  };
}
