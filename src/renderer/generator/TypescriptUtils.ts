import * as ts from 'typescript';
import {
  generateInterfaceName,
  prettierFormat,
  restoreWhitespace,
  writeAndPrettify,
  writeTempData,
} from './Utils';

// TODO: use typescript compiler api?
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

// TODO: use typescript compiler api?
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

// TODO: use typescript compiler api?
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
  const printer: ts.Printer = ts.createPrinter({
    removeComments: false,
  });

  const output = printer.printNode(ts.EmitHint.SourceFile, transformedNode, sourceFile);
  const prettierOutput = prettierFormat(output);
  const outputWithWhitespace = restoreWhitespace(originalText, prettierOutput);
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

function getTypeNode(node: ts.Node, typeChecker: ts.TypeChecker): ts.TypeNode {
  if (ts.isVariableStatement(node)) {
    const variableStatement = node as ts.VariableStatement;
    const declaration = variableStatement.declarationList.declarations[0];
    return getTypeNode(declaration.initializer, typeChecker);
  } else if (ts.isArrayLiteralExpression(node)) {
    const arrayLiteralExpression = node as ts.ArrayLiteralExpression;
    const t = getTypeNode(arrayLiteralExpression.elements[0], typeChecker);
    return ts.createArrayTypeNode(t);
  } else if (ts.isObjectLiteralExpression(node)) {
    const members: ts.TypeElement[] = [];
    node.forEachChild(child => {
      if (ts.isPropertyAssignment(child)) {
        const childPropertyAssignment = child as ts.PropertyAssignment;
        const childType = getTypeNode(childPropertyAssignment.initializer, typeChecker);
        const name = getName(childPropertyAssignment.name) as string;
        const childPropertySignature = ts.createPropertySignature(
          childPropertyAssignment.modifiers,
          name,
          childPropertyAssignment.questionToken,
          childType,
          undefined,
        );
        members.push(childPropertySignature);
      }
    });
    return ts.createTypeLiteralNode(members);
  } else if (ts.isLiteralExpression(node)) {
    // Primitive:
    const t = typeChecker.getTypeAtLocation(node);
    const baseType = typeChecker.getBaseTypeOfLiteralType(t);
    return typeChecker.typeToTypeNode(baseType);
  } else {
    throw new Error('Unable to determine type of node');
  }
}

/**
 * Leverage typescript program to determine the type of the value.
 * Inefficient because it writes out the string to disk and reads / parses it in typescript.
 *
 * @param data element to get the type of
 */
function getType(data: any): ts.TypeNode {
  // Write out some temp data to a file so we can read it and parse it as a sourceFile.
  const tempData = `const typeTest = ${JSON.stringify(data)}`;
  const tempFilename = 'typeTest.ts';
  const pathToTempFile = writeTempData(tempData, tempFilename);

  // Read in the temp file to get the .ts node tree.
  const program = ts.createProgram([pathToTempFile], { allowJs: true, removeComments: false });
  const typeChecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(pathToTempFile);
  let typeNode: ts.TypeNode;

  sourceFile.forEachChild((node: ts.Node) => {
    if (ts.isVariableStatement(node)) {
      const type = getTypeNode(node, typeChecker);
      if (type) {
        typeNode = type;
      }
    }
  });
  return typeNode;
}

function createLiteral(data: any): ts.Expression {
  if (Array.isArray(data)) {
    const elements = (data as any[]).map(el => createLiteral(el));
    return ts.createArrayLiteral(elements);
  } else if (typeof data === 'object') {
    const keys = Object.keys(data);
    const elements = keys.map(key => {
      const keyLiteral = ts.createLiteral(key);
      const valueLiteral = createLiteral(data[key]);
      return ts.createPropertyAssignment(keyLiteral, valueLiteral);
    });
    return ts.createObjectLiteral(elements);
  }
  // base case is non object or array.
  return ts.createLiteral(data);
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

      const newEntry = ts.createPropertyAssignment(params.newKey, createLiteral(params.newValue));
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

/**
 * Adds a new member to an existing class using the typescript compiler API
 */
export async function addClassMember(params: {
  filename: string;
  className: string;
  newKey: string;
  newValue: any; // number | boolean | string;
  decorators?: string[];
}): Promise<() => void> {
  return transformTypescript(
    params.filename,
    (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) {
        const classDeclaration = node as ts.ClassDeclaration;
        return getName(classDeclaration.name as ts.Identifier) === params.className;
      }
      return false;
    },
    (node: ts.Node): ts.Node => {
      const classDeclaration = node as ts.ClassDeclaration;

      classDeclaration.members.forEach(member => {
        if (getName(member.name) === params.newKey) {
          throw new Error(
            `Error adding class property ${params.newKey} to ${params.className}. Already exists.`,
          );
        }
      });
      const typeNode = getType(params.newValue);
      const decorators = params.decorators?.map(decoString => {
        const decoIdentifier = ts.createIdentifier(decoString);
        if (decoString === 'serializable') {
          // TODO: make this handle more cases. 'object' and 'raw'?
          if (ts.isArrayTypeNode(typeNode)) {
            const primitiveCall = ts.createCall(ts.createIdentifier('primitive'), undefined, []);
            const listCall = ts.createCall(ts.createIdentifier('list'), undefined, [primitiveCall]);
            const call = ts.createCall(decoIdentifier, undefined, [listCall]);
            return ts.createDecorator(call);
          }
        }
        return ts.createDecorator(decoIdentifier);
      });

      const newEntry = ts.createProperty(
        decorators,
        [],
        params.newKey,
        undefined,
        typeNode,
        undefined,
      );

      const newClassMembers = [newEntry, ...classDeclaration.members];
      const newObject = ts.updateClassDeclaration(
        classDeclaration,
        classDeclaration.decorators,
        classDeclaration.modifiers,
        classDeclaration.name,
        classDeclaration.typeParameters,
        classDeclaration.heritageClauses,
        newClassMembers,
      );

      return newObject;
    },
  );
}
