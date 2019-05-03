import * as React from 'react';
import { getServices } from '../generator/ServiceHelper';
// import console = require('console');

export class App extends React.Component {
  render() {
    return (
      <div>
        <h4>WWF Code Gen</h4>
        <button onClick={this.printServices}>Test</button>
      </div>
    );
  }

  printServices = async () => {
    const services = await getServices();
    console.log(JSON.stringify(services));
  };
}
