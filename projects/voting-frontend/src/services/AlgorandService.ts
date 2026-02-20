import algosdk from 'algosdk';
import { Poll } from '../types/Poll';

export class AlgorandService {
  private algodClient: algosdk.Algodv2;
  private appId: number;

  constructor(appId: number) {
    this.algodClient = new algosdk.Algodv2(
      '',
      'https://testnet-api.algonode.cloud',
      ''
    );
    this.appId = appId;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await requestFn();
      } catch (error: any) {
        const isLastRetry = i === retries - 1;
        const isNetworkError = error.message?.includes('ERR_CONNECTION_CLOSED') || 
                               error.message?.includes('Failed to fetch') ||
                               error.message?.includes('network');
        
        if (isNetworkError && !isLastRetry) {
          console.log(`Network error, retrying (${i + 1}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries reached');
  }

  async getApplicationInfo(): Promise<any> {
    try {
      const appInfo = await this.retryRequest(() => 
        this.algodClient.getApplicationByID(this.appId).do()
      );
      return appInfo;
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      
      // Don't log as error if it's just "not found" - that's expected
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        console.log(`App ID ${this.appId} not found on network (this is expected if not deployed yet)`);
      } else {
        console.error(`Error fetching app info for App ID ${this.appId}:`, errorMsg);
      }
      
      // Return null if app doesn't exist or network error
      return null;
    }
  }

  async getSuggestedParams(): Promise<algosdk.SuggestedParams> {
    return await this.retryRequest(() => 
      this.algodClient.getTransactionParams().do()
    );
  }

  private getGlobalState(appInfo: any): any[] | null {
    // algosdk v3 returns camelCase; v2 returns kebab-case
    const gs = appInfo?.params?.globalState ?? appInfo?.params?.['global-state'];
    return Array.isArray(gs) ? gs : null;
  }

  async getPollCount(): Promise<number> {
    try {
      const appInfo = await this.getApplicationInfo();
      if (!appInfo) return 0;

      const globalState = this.getGlobalState(appInfo);
      if (!globalState) return 0;

      const pollCountState = globalState.find((item: any) =>
        Buffer.from(item.key, 'base64').toString() === 'poll_count'
      );

      return pollCountState ? Number(pollCountState.value.uint) : 0;
    } catch (error) {
      console.error('Error fetching poll count:', error);
      return 0;
    }
  }

  async getAllPolls(userAddress?: string): Promise<Poll[]> {
    try {
      console.log('🔍 getAllPolls called for app:', this.appId);
      const appInfo = await this.getApplicationInfo();
      
      // Return empty array if app doesn't exist
      if (!appInfo) {
        console.log(`❌ App ${this.appId} does not exist or is not deployed yet`);
        return [];
      }

      console.log('✅ App info retrieved');

      // Use helper — handles both algosdk v2 (kebab) and v3 (camelCase)
      const globalState = this.getGlobalState(appInfo);

      console.log('🔍 Global state found:', !!globalState);

      // Return empty array if no global state exists yet
      if (!globalState) {
        console.log('⚠️ No global state found - app may not be initialized yet');
        return [];
      }

      console.log('✅ Global state found with', globalState.length, 'items!');

      // This contract only supports ONE active poll at a time
      const poll = this.parseSinglePollFromGlobalState(globalState);

      console.log('📝 Parsed poll question:', poll.question);

      // Check if poll has a question (means it's been created)
      if (!poll.question || poll.question.trim() === '') {
        console.log('⚠️ No active poll found (no question).');
        return [];
      }

      // Check if user has voted (requires local state check)
      if (userAddress) {
        poll.hasVoted = await this.checkIfUserVoted(userAddress, 0);
        poll.userChoice = await this.getUserVote(userAddress);
        console.log(`👤 User ${userAddress.substring(0, 8)}... hasVoted:`, poll.hasVoted, 'choice:', poll.userChoice);
      }

      console.log('✅ Returning poll:', poll);
      return [poll]; // Return array with single poll
    } catch (error) {
      console.error('❌ Error fetching polls:', error);
      return [];
    }
  }

  private parseSinglePollFromGlobalState(globalState: any[]): Poll {
    const poll: any = { 
      id: 0, // Single poll, always ID 0
      hasVoted: false,
      votes1: 0,
      votes2: 0,
      votes3: 0,
      active: false,
      endTime: 0
    };
    
    globalState.forEach((item: any) => {
      const key = Buffer.from(item.key, 'base64').toString();
      
      console.log('🔑 Global state key:', key, '| value:', item.value);
      
      // Match YOUR actual contract keys (from the screenshot)
      if (key === 'pollQuestion') {
        poll.question = Buffer.from(item.value.bytes, 'base64').toString();
      } else if (key === 'option1') {
        poll.option1 = Buffer.from(item.value.bytes, 'base64').toString();
      } else if (key === 'option2') {
        poll.option2 = Buffer.from(item.value.bytes, 'base64').toString();
      } else if (key === 'option3') {
        poll.option3 = Buffer.from(item.value.bytes, 'base64').toString();
      } else if (key === 'votes1') {
        poll.votes1 = Number(item.value.uint);
      } else if (key === 'votes2') {
        poll.votes2 = Number(item.value.uint);
      } else if (key === 'votes3') {
        poll.votes3 = Number(item.value.uint);
      } else if (key === 'isPollActive') {
        poll.active = Number(item.value.uint) === 1;
      } else if (key === 'pollEndTime') {
        poll.endTime = Number(item.value.uint);
      } else if (key === 'pollCreator') {
        poll.creator = algosdk.encodeAddress(Buffer.from(item.value.bytes, 'base64'));
      } else if (key === 'totalVotes') {
        poll.totalVotes = Number(item.value.uint);
      }
      
      // Also support old key names for backwards compatibility
      else if (key === 'question') {
        poll.question = Buffer.from(item.value.bytes, 'base64').toString();
      } else if (key === 'opt1') {
        poll.option1 = Buffer.from(item.value.bytes, 'base64').toString();
      } else if (key === 'opt2') {
        poll.option2 = Buffer.from(item.value.bytes, 'base64').toString();
      } else if (key === 'opt3') {
        poll.option3 = Buffer.from(item.value.bytes, 'base64').toString();
      } else if (key === 'v1') {
        poll.votes1 = Number(item.value.uint);
      } else if (key === 'v2') {
        poll.votes2 = Number(item.value.uint);
      } else if (key === 'v3') {
        poll.votes3 = Number(item.value.uint);
      } else if (key === 'active') {
        poll.active = Number(item.value.uint) === 1;
      } else if (key === 'endTime') {
        poll.endTime = Number(item.value.uint);
      } else if (key === 'creator') {
        poll.creator = algosdk.encodeAddress(Buffer.from(item.value.bytes, 'base64'));
      } else if (key === 'total') {
        poll.totalVotes = Number(item.value.uint);
      }
    });
    
    console.log('✅ Parsed poll object:', poll);
    
    return poll as Poll;
  }

  // algosdk v3 returns BigInt for app IDs — compare safely
  private matchesAppId(id: any): boolean {
    return BigInt(id) === BigInt(this.appId);
  }

  private getLocalStateForApp(accountInfo: any): any | null {
    // algosdk v3: camelCase appsLocalState
    const appsLocalState = accountInfo.appsLocalState ?? [];
    return appsLocalState.find((app: any) => this.matchesAppId(app.id)) ?? null;
  }

  private parseLocalKeyValue(localState: any, targetKey: string): any | null {
    // algosdk v3: keyValue (camelCase), algosdk v2: key-value (kebab)
    const kvList: any[] = localState?.keyValue ?? (localState as any)?.['key-value'] ?? [];
    return kvList.find((kv: any) => {
      try { return Buffer.from(kv.key, 'base64').toString() === targetKey; } catch { return false; }
    }) ?? null;
  }

  async checkIfUserVoted(userAddress: string, _pollId: number): Promise<boolean> {
    try {
      const accountInfo = await this.retryRequest(() =>
        this.algodClient.accountInformation(userAddress).do()
      );
      const localState = this.getLocalStateForApp(accountInfo);
      if (!localState) return false;

      const votedKV = this.parseLocalKeyValue(localState, 'voted');
      return votedKV ? Number(votedKV.value.uint) === 1 : false;
    } catch (error) {
      console.error('Error checking if user voted:', error);
      return false;
    }
  }

  async getUserVote(userAddress: string): Promise<number | undefined> {
    try {
      const accountInfo = await this.retryRequest(() =>
        this.algodClient.accountInformation(userAddress).do()
      );
      const localState = this.getLocalStateForApp(accountInfo);
      if (!localState) return undefined;

      const choiceKV = this.parseLocalKeyValue(localState, 'choice');
      return choiceKV ? Number(choiceKV.value.uint) : undefined;
    } catch (error) {
      console.error('Error getting user vote:', error);
      return undefined;
    }
  }

  async checkOptInStatus(userAddress: string): Promise<boolean> {
    try {
      const accountInfo = await this.retryRequest(() =>
        this.algodClient.accountInformation(userAddress).do()
      );

      const appsLocalState = accountInfo.appsLocalState ?? [];
      const isOptedIn = appsLocalState.some((state: any) => this.matchesAppId(state.id));

      if (isOptedIn) {
        console.log(`✅ Account ${userAddress.substring(0, 8)}... is opted in to app ${this.appId}`);
      } else {
        console.log(`ℹ️ Account ${userAddress.substring(0, 8)}... is NOT opted in to app ${this.appId}`);
      }

      return isOptedIn;
    } catch (error) {
      console.error('Error checking opt-in status:', error);
      return false;
    }
  }

  createOptInTransaction(userAddress: string, suggestedParams: algosdk.SuggestedParams): algosdk.Transaction {
    // Call the optInToApplication() ARC-4 method
    const method = new algosdk.ABIMethod({
      name: 'optInToApplication',
      args: [],
      returns: { type: 'void' }
    });
    
    const appArgs = [
      method.getSelector()
    ];

    return algosdk.makeApplicationOptInTxnFromObject({
      sender: userAddress,
      suggestedParams,
      appIndex: this.appId,
      appArgs
    });
  }

  createPollTransaction(
    userAddress: string,
    question: string,
    option1: string,
    option2: string,
    option3: string,
    duration: number,
    suggestedParams: algosdk.SuggestedParams
  ): algosdk.Transaction {
    // Use ARC-4 method: createPoll(byte[],byte[],byte[],byte[],uint64)void
    const method = new algosdk.ABIMethod({
      name: 'createPoll',
      args: [
        { type: 'byte[]', name: 'question' },
        { type: 'byte[]', name: 'opt1' },
        { type: 'byte[]', name: 'opt2' },
        { type: 'byte[]', name: 'opt3' },
        { type: 'uint64', name: 'durationSeconds' }
      ],
      returns: { type: 'void' }
    });

    const appArgs = [
      method.getSelector(),
      this.encodeString(question),
      this.encodeString(option1),
      this.encodeString(option2),
      this.encodeString(option3),
      algosdk.encodeUint64(duration)
    ];

    return algosdk.makeApplicationNoOpTxnFromObject({
      sender: userAddress,
      suggestedParams,
      appIndex: this.appId,
      appArgs
    });
  }

  private encodeString(str: string): Uint8Array {
    // ARC-4 encoding for dynamic byte array: 2 bytes length prefix + data
    const strBytes = new Uint8Array(Buffer.from(str, 'utf8'));
    const length = strBytes.length;
    const encoded = new Uint8Array(2 + length);
    encoded[0] = (length >> 8) & 0xff;
    encoded[1] = length & 0xff;
    encoded.set(strBytes, 2);
    return encoded;
  }

  createVoteTransaction(
    userAddress: string,
    pollId: number,
    option: number,
    suggestedParams: algosdk.SuggestedParams
  ): algosdk.Transaction {
    // Use ARC-4 method: vote(uint64)void
    const method = new algosdk.ABIMethod({
      name: 'vote',
      args: [
        { type: 'uint64', name: 'optionIndex' }
      ],
      returns: { type: 'void' }
    });

    const appArgs = [
      method.getSelector(),
      algosdk.encodeUint64(option)
    ];

    return algosdk.makeApplicationNoOpTxnFromObject({
      sender: userAddress,
      suggestedParams,
      appIndex: this.appId,
      appArgs
    });
  }

  createEndPollTransaction(
    userAddress: string,
    pollId: number,
    suggestedParams: algosdk.SuggestedParams
  ): algosdk.Transaction {
    // Use ARC-4 method: endPoll()void
    const method = new algosdk.ABIMethod({
      name: 'endPoll',
      args: [],
      returns: { type: 'void' }
    });

    const appArgs = [
      method.getSelector()
    ];

    return algosdk.makeApplicationNoOpTxnFromObject({
      sender: userAddress,
      suggestedParams,
      appIndex: this.appId,
      appArgs
    });
  }

  async sendTransaction(signedTxn: Uint8Array): Promise<string> {
    // Don't retry transaction submissions - they might succeed but we don't know
    // Only submit once to avoid duplicate transactions
    const response = await this.algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    // Wait for confirmation with retry logic (network might be slow)
    await this.retryRequest(
      () => algosdk.waitForConfirmation(this.algodClient, txId, 4),
      5, // More retries for confirmation
      2000 // Longer delay
    );
    
    return txId;
  }
}
