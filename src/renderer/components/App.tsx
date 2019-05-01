import * as React from 'react';
import { generate } from '../generator/FileGenerator';

export class App extends React.Component {
  render() {
    return (
      <div>
        <h4>WWF Code Gen</h4>
        <button onClick={() => generate('templates/test.txt', null, null)}>Test</button>
      </div>
    );
  }
}
