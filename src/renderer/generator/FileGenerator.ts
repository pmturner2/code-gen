const { promisify } = require('util');
import fs from 'fs';
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export async function generate(inputPath: string, outputPath: string, tokens: Map<string, string>) {
  try {
    const data = await readFileAsync(inputPath, {
      encoding: 'utf8',
    });

    const result = data.replace('__NAME__', 'GORF');
    await writeFileAsync('aoutput.txt', result, {
      encoding: 'utf8',
      flag: 'w+',
    });
    console.log('Success');
  } catch (error) {
    console.log('Error', error);
  }

  // fs.readdir('..', (err: any, data: any) => {
  //   console.log('readdir', data);
  // });
}
