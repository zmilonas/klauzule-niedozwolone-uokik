import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { csvColumns } from '../src/config.ts';

const delimiter = ";";

const args = process.argv.slice(2);

export const keys: Map<string, string> = new Map(Object.entries(csvColumns));

function generateJsonFileFromCsv(
  fileInputName: any,
  fileOutputName: any
): void {
  const fileContents = fs.readFileSync(fileInputName).toString();
  const json = parse(fileContents, {
    delimiter,
    columns: header => header.map(
      (column: string) => 
        keys.get(column) || column.toLocaleLowerCase().replace(/\s/, '')
      )
  })
  const jsonStringified = JSON.stringify(json, undefined, 1);
  JSON.parse(jsonStringified);
  fs.writeFileSync(fileOutputName, jsonStringified);
}

const outputFilename = args[1] || args[0].replace('.csv', '.json');

generateJsonFileFromCsv(args[0], outputFilename);

// console.log(process.argv, path.join(path.dirname(fileURLToPath(import.meta.url)), process.argv[2]), args)
