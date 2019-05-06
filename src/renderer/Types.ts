// Used to represent stores, services, etc
export interface IInjectable {
  name: string; // e.g. GameService
  interfaceName: string; // e.g. IGameService
  serviceIdentifier: string; // e.g. ServiceTypes.Game
  importPath: string; // e.g. 'services/game/GameService.ts'
}

export type ImportMap = Map<string, string>;

export interface INewInjectable extends IInjectable {
  dependencies: IInjectable[];
}
