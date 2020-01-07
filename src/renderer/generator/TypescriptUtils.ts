import { generateInterfaceName } from './Utils';

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

export function generateInternalInterface(
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
