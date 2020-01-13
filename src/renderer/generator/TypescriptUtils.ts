import * as ts from 'typescript';
import { generateInterfaceName, writeAndPrettify } from './Utils';

function addNodeToInterface(node: any, key: string, interfaceMap: Map<string, string>) {
  let result = '';
  const nodeType = typeof node;
  const isArray = Array.isArray(node);
  const isObject = !isArray && nodeType === 'object';
  if (key) {
    if (isArray) {
      const typeOfArray = typeof node[0];
      if (typeOfArray === 'string' || typeOfArray === 'number') {
        result += `readonly ${key}: ${typeOfArray}[]; `;
      } else {
        const subTypeName = generateInterfaceName(key);
        interfaceMap.set(
          subTypeName,
          generateInternalInterface(subTypeName, node[0], interfaceMap),
        );
        result += `readonly ${key}: ${subTypeName}[]; `;
      }
    } else if (isObject) {
      result += `readonly ${key}: { `;
    } else {
      result += `readonly ${key}: ${nodeType}; `;
    }
  }

  if (isObject) {
    for (let childKey in node) {
      if (node.hasOwnProperty(childKey)) {
        result += addNodeToInterface(node[childKey], childKey, interfaceMap);
      }
    }
    if (key) {
      result += `}
       `;
    }
  }

  return result;
}

function generateInternalInterface(
  interfaceName: string,
  jsonObject: object,
  interfaceMap: Map<string, string> = new Map(),
): string {
  let result = `
    
     interface ${interfaceName} {      
     `;
  result += addNodeToInterface(jsonObject, null, interfaceMap);
  result += `}`;
  return result;
}

export function generateInterfaceFromJson(
  interfaceName: string,
  jsonString: string,
  interfaceMap: Map<string, string> = new Map(),
): string {
  const jsonObject = JSON.parse(jsonString);
  let result = ` 
     export interface ${interfaceName} {      
     `;
  result += addNodeToInterface(jsonObject, null, interfaceMap);
  result += `}`;
  interfaceMap.forEach(interfaceDefinition => {
    result += interfaceDefinition;
  });
  return result;
}

/**
 * Helper to process a typescript file and transform its contents.
 *
 * @param filename name of typescript file to transform
 * @param shouldTransform function that should return true if we should run `transform` on it
 * @param transform function to convert a typescript node into another
 */
async function transformTypescript(
  filename: string,
  shouldTransform: (node: ts.Node) => boolean,
  transform: (node: ts.Node) => ts.Node,
): Promise<() => void> {
  const program = ts.createProgram([filename], { allowJs: false });
  const sourceFile = program.getSourceFile(filename);

  const transformer = <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => {
    function visit(node: ts.Node): ts.Node {
      if (shouldTransform(node)) {
        return transform(node);
      } else {
        return ts.visitEachChild(node, visit, context);
      }
    }
    return ts.visitNode(rootNode, visit);
  };

  const result = ts.transform(sourceFile, [transformer]);
  const transformedNodes = result.transformed[0];

  // TODO:
  // Figure out a way to preserve empty line whitespace in the input file. e.g. space between functions.
  const printer: ts.Printer = ts.createPrinter({
    removeComments: false,
  });
  const output = printer.printNode(ts.EmitHint.SourceFile, transformedNodes, sourceFile);
  return writeAndPrettify(output, filename);
}

/**
 * Adds a new member to an existing enum using the typescript compiler API
 *
 * @param params Object
 */
export async function addEnumMember(params: {
  filename: string;
  enumName: string;
  newKey: string;
  newValue: string;
}): Promise<() => void> {
  return transformTypescript(
    params.filename,
    (node: ts.Node) => {
      return ts.isEnumDeclaration(node) && node.name.text === params.enumName;
    },
    (node: ts.Node): ts.Node => {
      const enumDeclaration = node as ts.EnumDeclaration;
      const newEntry = ts.createEnumMember(params.newKey, ts.createStringLiteral(params.newValue));
      const enumMemberList = [newEntry];
      enumDeclaration.members.forEach(member => enumMemberList.push(member));

      // Helper to get the name of enum members
      function getName(a: ts.PropertyName) {
        if (ts.isIdentifier(a)) {
          const identifier = a as ts.Identifier;
          return identifier.escapedText;
        } else if (ts.isStringLiteral(a)) {
          const stringLiteral = a as ts.StringLiteral;
          return stringLiteral.text;
        }
        return undefined;
      }

      // Alphabetize the enum members
      enumMemberList.sort((a, b) => {
        return getName(a.name) < getName(b.name) ? -1 : 1;
      });

      const newEnumDeclaration = ts.updateEnumDeclaration(
        enumDeclaration,
        enumDeclaration.decorators,
        enumDeclaration.modifiers,
        enumDeclaration.name,
        enumMemberList,
      );
      return newEnumDeclaration;
    },
  );
}
