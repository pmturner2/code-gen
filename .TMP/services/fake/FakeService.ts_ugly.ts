import { DomainStoreTypes, ScreenStoreTypes, ServiceTypes } from 'app/Types';
import { InjectableBase } from 'common/InjectableBase';
import { IBadgeService } from 'services/gameswithfriends/badge/BadgeService';
import { IBuzzService } from 'services/zynga/buzz/BuzzService';
import { IConversationService } from 'services/zynga/conversations/ConversationService';
import { inject, injectable } from 'inversify';
import { action } from 'mobx';

export interface IFakeService {
  readonly initialized: boolean;
}

@injectable()
export class FakeService extends InjectableBase implements IFakeService {
    private badgeService: IBadgeService
  private buzzService: IBuzzService
  private conversationService: IConversationService;

  constructor( @inject(ServiceTypes.Badge) badgeService: IBadgeService,
 @inject(ServiceTypes.Buzz) buzzService: IBuzzService,
 @inject(ServiceTypes.Conversation) conversationService: IConversationService,) {
    super(ServiceTypes.Fake);
      this.badgeService = badgeService;
  this.buzzService = buzzService;
  this.conversationService = conversationService;
    this.awaitDependenciesAndInit(ServiceTypes.Fake);
  }

  @action
  protected initDefaultValues(): void {
    // TODO: Sync initialization goes here.
    // Setup default values, event listeners, etc.
  }

  @action
  protected async init(): Promise<void> {
    // TODO: Async initialization goes here.
    // When this is called, all of the injected dependencies will have been initialized
  }
}
