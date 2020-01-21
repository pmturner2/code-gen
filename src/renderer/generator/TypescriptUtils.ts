import * as diff from 'diff';
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
 * Restores the blank lines stripped by the typescript compiler.
 *
 * @param oldText original .ts source
 * @param newText updated .ts source
 */
function restoreWhitespace(oldText: string, newText: string): string {
  const patch = diff.parsePatch(diff.createPatch('file', oldText, newText, '', ''));
  const hunks = patch[0].hunks;
  for (let i = 0; i < hunks.length; ++i) {
    let lineOffset = 0;
    const hunk = hunks[i];
    hunk.lines = hunk.lines.map((line: string) => {
      if (line === '-') {
        lineOffset++;
        return ' ';
      }
      return line;
    });
    hunk.newLines += lineOffset;
    for (let j = i + 1; j < hunks.length; ++j) {
      hunks[j].newStart += lineOffset;
    }
  }
  return diff.applyPatch(oldText, patch);
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
  const program = ts.createProgram([filename], { allowJs: false, removeComments: false });
  const sourceFile = program.getSourceFile(filename);

  const originalText = sourceFile.text;

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
  const transformedNode = result.transformed[0];

  // TODO:
  // Figure out a way to preserve empty line whitespace in the input file. e.g. space between functions.
  const printer: ts.Printer = ts.createPrinter({
    removeComments: false,
  });

  const output = printer.printNode(ts.EmitHint.SourceFile, transformedNode, sourceFile);
  const outputWithWhitespace = restoreWhitespace(originalText, output);
  return writeAndPrettify(outputWithWhitespace, filename);
}

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
  sortEnum?: boolean;
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
      enumDeclaration.members.forEach(member => {
        if (getName(member.name) === params.newKey) {
          throw new Error(
            `Error adding enum ${params.newKey} to ${params.enumName}. Already exists`,
          );
        }
        enumMemberList.push(member);
      });
      if (params.sortEnum) {
        // Alphabetize the enum members
        enumMemberList.sort((a, b) => {
          return getName(a.name) < getName(b.name) ? -1 : 1;
        });
      }

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

/**
 * Adds a new member to an existing object using the typescript compiler API
 *
 * @param params Object
 */
export async function addObjectMember(params: {
  filename: string;
  objectName: string;
  newKey: string;
  newValue: number | boolean | string;
}): Promise<() => void> {
  return transformTypescript(
    params.filename,
    (node: ts.Node) => {
      if (ts.isVariableDeclaration(node)) {
        const variableDeclaration = node as ts.VariableDeclaration;
        return getName(variableDeclaration.name as ts.Identifier) === params.objectName;
      }
      return false;
    },
    (node: ts.Node): ts.Node => {
      const variableDeclaration = node as ts.VariableDeclaration;
      if (!ts.isObjectLiteralExpression(variableDeclaration.initializer)) {
        throw new Error('Unexpected object is not a literal ' + params.objectName);
      }
      const initializer = variableDeclaration.initializer as ts.ObjectLiteralExpression;

      const newEntry = ts.createPropertyAssignment(
        params.newKey,
        ts.createLiteral(params.newValue),
      );
      const newObjectMembers = [newEntry];

      initializer.properties.forEach((child: ts.Node) => {
        newObjectMembers.push(child as ts.PropertyAssignment);
      });

      // Alphabetize the members
      newObjectMembers.sort((a, b) => {
        return getName(a.name) < getName(b.name) ? -1 : 1;
      });
      const newInitializer = ts.createObjectLiteral(newObjectMembers, true);
      const newObject = ts.updateVariableDeclaration(
        variableDeclaration,
        variableDeclaration.name,
        variableDeclaration.type,
        newInitializer,
      );
      return newObject;
    },
  );
}

// TEST CODE
// async function f() {
//   const r = await addObjectMember({
//     filename: kConfigDefaultsPath,
//     objectName: 'ConfigDefaults',
//     newValue: 'Best',
//     newKey: 'best',
//   });
//   r();
// }

// f();
