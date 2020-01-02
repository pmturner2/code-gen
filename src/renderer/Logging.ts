let errorFunction: (message: string) => void = alert;
let infoAlertFunction: (message: string) => void = alert;

export function setErrorFunction(f: (message: string) => void): void {
  errorFunction = f;
}

export function setInfoAlertFunction(f: (message: string) => void): void {
  infoAlertFunction = f;
}

export function showError(message: string) {
  errorFunction(message);
}

export function showInfoAlert(message: string) {
  infoAlertFunction(message);
}

export function logInfo(message: string) {
  console.log(message);
}
