function addNodeToInterface(node: any, key?: string, interfaceString?: string) {
  let result = '';
  const nodeType = typeof node;
  const isArray = Array.isArray(node);
  const isObject = !isArray && nodeType === 'object';
  if (key) {
    if (isArray) {
      const typeOfArray = typeof node[0];
      result += `readonly ${key}: ${
        typeOfArray === 'string' || typeOfArray === 'number' ? typeOfArray : 'any'
      }[]; `;
    } else if (isObject) {
      result += `readonly ${key}: { `;
    } else {
      result += `readonly ${key}: ${nodeType}; `;
    }
  }

  if (isObject) {
    for (let childKey in node) {
      if (node.hasOwnProperty(childKey)) {
        result += addNodeToInterface(node[childKey], childKey, interfaceString);
      }
    }
    if (key) {
      result += `}
       `;
    }
  }

  return result;
}

export function generateInterfaceFromJson(interfaceName: string, jsonString: string): string {
  const designData = JSON.parse(jsonString);
  let result = ` 
     export interface ${interfaceName} {      
     `;
  result += addNodeToInterface(designData, null);
  result += `}`;
  return result;
}
