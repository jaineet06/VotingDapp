import { Contract, GlobalState, LocalState, uint64, bytes, Uint64, assert, Txn, Global } from '@algorandfoundation/algorand-typescript'

/**
 * Voting Contract - Decentralized voting on Algorand
 * Features: One active poll at a time, one-vote-per-wallet, transparent results, time-bounded polls
 */
export class VotingContract extends Contract {
  // Poll configuration
  pollQuestion = GlobalState<bytes>({ key: 'question' })
  option1 = GlobalState<bytes>({ key: 'opt1' })
  option2 = GlobalState<bytes>({ key: 'opt2' })
  option3 = GlobalState<bytes>({ key: 'opt3' })
  
  // Vote counts
  votes1 = GlobalState<uint64>({ key: 'v1' })
  votes2 = GlobalState<uint64>({ key: 'v2' })
  votes3 = GlobalState<uint64>({ key: 'v3' })
  
  // Metadata
  pollEndTime = GlobalState<uint64>({ key: 'endTime' })
  pollCreator = GlobalState<bytes>({ key: 'creator' })
  totalVotes = GlobalState<uint64>({ key: 'total' })
  isPollActive = GlobalState<uint64>({ key: 'active' })
  
  // Local state
  hasVoted = LocalState<uint64>({ key: 'voted' })
  votedOption = LocalState<uint64>({ key: 'choice' })

  /**
   * Allow users to opt-in to the application
   * This is required before users can interact with the contract
   */
  optInToApplication(): void {
    // No additional logic needed - just allow opt-in
    // Local state will be initialized when user opts in
  }

  /**
   * Create a new poll
   */
  createPoll(
    question: bytes,
    opt1: bytes,
    opt2: bytes,
    opt3: bytes,
    durationSeconds: uint64
  ): void {
    // Check if poll is active (handle case where state doesn't exist yet)
    if (this.isPollActive.hasValue) {
      assert(this.isPollActive.value === Uint64(0), 'Poll already active')
    }
    
    this.pollQuestion.value = question
    this.option1.value = opt1
    this.option2.value = opt2
    this.option3.value = opt3
    
    this.votes1.value = Uint64(0)
    this.votes2.value = Uint64(0)
    this.votes3.value = Uint64(0)
    this.totalVotes.value = Uint64(0)
    
    this.pollEndTime.value = Global.latestTimestamp + durationSeconds
    this.pollCreator.value = Txn.sender.bytes
    this.isPollActive.value = Uint64(1)
  }

  /**
   * Vote on the active poll
   */
  vote(optionIndex: uint64): void {
    assert(this.isPollActive.value === Uint64(1), 'Poll is not active')
    assert(Global.latestTimestamp < this.pollEndTime.value, 'Poll has ended')
    assert(optionIndex >= Uint64(1) && optionIndex <= Uint64(3), 'Invalid option')
    
    // Check if user already voted (handle case where local state doesn't exist)
    if (this.hasVoted(Txn.sender).hasValue) {
      assert(this.hasVoted(Txn.sender).value === Uint64(0), 'Already voted')
    }
    
    if (optionIndex === Uint64(1)) {
      this.votes1.value = this.votes1.value + Uint64(1)
    } else if (optionIndex === Uint64(2)) {
      this.votes2.value = this.votes2.value + Uint64(1)
    } else if (optionIndex === Uint64(3)) {
      this.votes3.value = this.votes3.value + Uint64(1)
    }
    
    this.totalVotes.value = this.totalVotes.value + Uint64(1)
    this.hasVoted(Txn.sender).value = Uint64(1)
    this.votedOption(Txn.sender).value = optionIndex
  }

  /**
   * Get voting results
   */
  getResults(): uint64[] {
    return [
      this.votes1.value,
      this.votes2.value,
      this.votes3.value,
      this.totalVotes.value
    ]
  }

  /**
   * Get poll question
   */
  getPollQuestion(): bytes {
    return this.pollQuestion.value
  }

  /**
   * Get option text by index
   */
  getOption(index: uint64): bytes {
    if (index === Uint64(1)) return this.option1.value
    if (index === Uint64(2)) return this.option2.value
    return this.option3.value
  }

  /**
   * Check if poll is currently active and not expired
   */
  checkPollActive(): uint64 {
    if (this.isPollActive.value === Uint64(1) && Global.latestTimestamp < this.pollEndTime.value) {
      return Uint64(1)
    }
    return Uint64(0)
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingTime(): uint64 {
    if (Global.latestTimestamp >= this.pollEndTime.value) return Uint64(0)
    return this.pollEndTime.value - Global.latestTimestamp
  }

  /**
   * End the poll (only creator can call)
   */
  endPoll(): void {
    assert(Txn.sender.bytes === this.pollCreator.value, 'Only creator can end poll')
    this.isPollActive.value = Uint64(0)
  }

  /**
   * Check if current user has voted
   */
  checkHasVoted(): uint64 {
    if (this.hasVoted(Txn.sender).hasValue) {
      return this.hasVoted(Txn.sender).value
    }
    return Uint64(0)
  }

  /**
   * Get the option the current user voted for
   */
  getMyVote(): uint64 {
    if (this.hasVoted(Txn.sender).hasValue && this.hasVoted(Txn.sender).value === Uint64(1)) {
      return this.votedOption(Txn.sender).value
    }
    return Uint64(0)
  }
}
