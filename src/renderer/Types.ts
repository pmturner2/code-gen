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
  Delete = 'DELETE',
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
}

export enum ZsrRequestService {
  Conversation = 'conversation',
  Gwf = 'gwf',
  Leaderboards = 'leaderboards',
  Log = 'log',
  NetworkAccount = 'networkaccount',
  Optimize = 'optimize',
  Track = 'track',
}

export enum RetryPolicy {
  Exponential = 'Exponential',
  None = 'None',
  Once = 'Once',
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

export interface IOptimization {
  name: string; // e.g. `wwf3_practice_partners`
  key?: string; // e.g. `PracticePartners`
  variables: string; // should be valid json when submitted.
  fetchOnWarmLaunch?: boolean;
}

export interface IServerConfig {
  name: string;
  defaultValue: string; // should be json or a single value. e.g. 8 or "8" or { ... }
}
