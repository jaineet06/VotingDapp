import { Contract, GlobalState, LocalState, uint64, bytes, Uint64, assert, Txn, Global } from '@algorandfoundation/algorand-typescript'

/**
 * Campus Voting Contract - Decentralized voting on Algorand
 * Features: One-vote-per-wallet, transparent results, time-bounded polls
 */
export class VotingContract extends Contract {
  // Poll configuration
  pollQuestion = GlobalState<bytes>({ key: 'question' })
  option1 = GlobalState<bytes>({ key: 'opt1' })
  option2 = GlobalState<bytes>({ key: 'opt2' })
  option3 = GlobalState<bytes>({ key: 'opt3' })
  option4 = GlobalState<bytes>({ key: 'opt4' })
  
  // Vote counts
  votes1 = GlobalState<uint64>({ key: 'v1' })
  votes2 = GlobalState<uint64>({ key: 'v2' })
  votes3 = GlobalState<uint64>({ key: 'v3' })
  votes4 = GlobalState<uint64>({ key: 'v4' })
  
  // Metadata
  pollEndTime = GlobalState<uint64>({ key: 'endTime' })
  pollCreator = GlobalState<bytes>({ key: 'creator' })
  totalVotes = GlobalState<uint64>({ key: 'total' })
  optionCount = GlobalState<uint64>({ key: 'optCount' })
  isPollActive = GlobalState<uint64>({ key: 'active' })
  campusTokenId = GlobalState<uint64>({ key: 'tokenId' })
  
  // Local state
  hasVoted = LocalState<uint64>({ key: 'voted' })
  votedOption = LocalState<uint64>({ key: 'choice' })

  createPoll(
    question: bytes,
    opt1: bytes,
    opt2: bytes,
    opt3: bytes,
    opt4: bytes,
    durationSeconds: uint64,
    tokenId: uint64
  ): void {
    // Check if poll is active (handle case where state doesn't exist yet)
    if (this.isPollActive.hasValue) {
      assert(this.isPollActive.value === Uint64(0), 'Poll already active')
    }
    
    this.pollQuestion.value = question
    this.option1.value = opt1
    this.option2.value = opt2
    this.option3.value = opt3
    this.option4.value = opt4
    
    this.votes1.value = Uint64(0)
    this.votes2.value = Uint64(0)
    this.votes3.value = Uint64(0)
    this.votes4.value = Uint64(0)
    this.totalVotes.value = Uint64(0)
    
    let count = Uint64(2)
    if (opt3.length > 0) count = Uint64(3)
    if (opt4.length > 0) count = Uint64(4)
    this.optionCount.value = count
    
    this.pollEndTime.value = Global.latestTimestamp + durationSeconds
    this.pollCreator.value = Txn.sender.bytes
    this.isPollActive.value = Uint64(1)
    this.campusTokenId.value = tokenId
  }

  vote(optionIndex: uint64): void {
    assert(this.isPollActive.value === Uint64(1), 'Poll is not active')
    assert(Global.latestTimestamp < this.pollEndTime.value, 'Poll has ended')
    assert(optionIndex >= Uint64(1) && optionIndex <= this.optionCount.value, 'Invalid option')
    
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
    } else if (optionIndex === Uint64(4)) {
      this.votes4.value = this.votes4.value + Uint64(1)
    }
    
    this.totalVotes.value = this.totalVotes.value + Uint64(1)
    this.hasVoted(Txn.sender).value = Uint64(1)
    this.votedOption(Txn.sender).value = optionIndex
  }

  getResults(): uint64[] {
    return [
      this.votes1.value,
      this.votes2.value,
      this.votes3.value,
      this.votes4.value,
      this.totalVotes.value,
      this.optionCount.value
    ]
  }

  getPollQuestion(): bytes {
    return this.pollQuestion.value
  }

  getOption(index: uint64): bytes {
    if (index === Uint64(1)) return this.option1.value
    if (index === Uint64(2)) return this.option2.value
    if (index === Uint64(3)) return this.option3.value
    return this.option4.value
  }

  checkPollActive(): uint64 {
    if (this.isPollActive.value === Uint64(1) && Global.latestTimestamp < this.pollEndTime.value) {
      return Uint64(1)
    }
    return Uint64(0)
  }

  getRemainingTime(): uint64 {
    if (Global.latestTimestamp >= this.pollEndTime.value) return Uint64(0)
    return this.pollEndTime.value - Global.latestTimestamp
  }

  endPoll(): void {
    assert(Txn.sender.bytes === this.pollCreator.value, 'Only creator can end poll')
    this.isPollActive.value = Uint64(0)
  }

  checkHasVoted(): uint64 {
    if (this.hasVoted(Txn.sender).hasValue) {
      return this.hasVoted(Txn.sender).value
    }
    return Uint64(0)
  }

  getMyVote(): uint64 {
    if (this.hasVoted(Txn.sender).hasValue && this.hasVoted(Txn.sender).value === Uint64(1)) {
      return this.votedOption(Txn.sender).value
    }
    return Uint64(0)
  }
}
