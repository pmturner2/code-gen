/**
 * Used to represent stores, services, etc
 */
export interface IInjectable {
  name: string; // e.g. GameService
  interfaceName: string; // e.g. IGameService
  serviceIdentifier: string; // e.g. ServiceTypes.Game
  importPath: string; // e.g. 'services/game/GameService.ts' for existing
}

/**
 * Mapping of an import to it's file.
 */
export type ImportMap = Map<string, string>;

export interface INewInjectable extends IInjectable {
  dependencies: IInjectable[];
}

export interface INewService extends INewInjectable {
  zsrRequests?: IZsrRequest[];
  apiFilename?: string;
}

export enum HttpRequestVerb {
  Get = 'GET',
  Put = 'PUT',
  Post = 'POST',
  Delete = 'DELETE',
}

export enum ZsrRequestService {
  Gwf = 'gwf',
  NetworkAccount = 'networkaccount',
  Conversation = 'conversation',
  Leaderboards = 'leaderboards',
  Log = 'log',
  Optimize = 'optimize',
  Track = 'track',
}

export enum RetryPolicy {
  None = 'None',
  Once = 'Once',
  Exponential = 'Exponential',
}

export interface IZsrRequest {
  verb: HttpRequestVerb;
  service: ZsrRequestService;
  method: string; // e.g. 'game' for gwf/game
  retryPolicy: RetryPolicy;
  eventKey?: string;
  requestObjectInterfaceName?: string;
  responseObjectInterfaceName?: string;
  functionName?: string;
  requestJson?: string;
  responseJson?: string;
}

export enum ProgressStepStatus {
  Incomplete,
  Complete,
  InProgress,
  Error,
}

export interface IProgressStep {
  description: string;
  status?: ProgressStepStatus;
  execute?: () => Promise<void>;
}
