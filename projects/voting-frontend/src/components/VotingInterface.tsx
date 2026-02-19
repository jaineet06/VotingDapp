import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { VotingContractClient } from '../contracts/VotingContract'

interface VotingInterfaceProps {
  appId: bigint | null
  onVoteCast: () => void
}

interface PollData {
  question: string
  options: string[]
  hasVoted: boolean
  myVote: number
  isActive: boolean
  remainingTime: number
}

const VotingInterface = ({ appId, onVoteCast }: VotingInterfaceProps) => {
  const [loading, setLoading] = useState(false)
  const [pollData, setPollData] = useState<PollData | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()

  const fetchPollData = async () => {
    if (!appId) return
    
    setFetchError(null)

    try {
      const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
      
      // Read global state directly from algod (no wallet needed)
      const appInfo = await algorand.client.algod.getApplicationByID(Number(appId)).do()
      const globalState = appInfo.params.globalState
      
      if (!globalState || globalState.length === 0) {
        setFetchError('No poll created yet')
        setPollData(null)
        return
      }

      // Parse global state
      const stateMap: Record<string, any> = {}
      for (const item of globalState) {
        const keyBytes = item.key as unknown as Uint8Array
        const key = Buffer.from(keyBytes).toString()
        const val = item.value as { bytes?: Uint8Array, uint?: number | bigint }
        if (val.bytes) {
          stateMap[key] = Buffer.from(val.bytes).toString()
        } else {
          stateMap[key] = Number(val.uint || 0)
        }
      }

      const question = stateMap['question'] || ''
      const options: string[] = []
      if (stateMap['opt1']) options.push(stateMap['opt1'])
      if (stateMap['opt2']) options.push(stateMap['opt2'])
      if (stateMap['opt3']) options.push(stateMap['opt3'])
      if (stateMap['opt4']) options.push(stateMap['opt4'])

      const isActive = stateMap['active'] === 1
      const endTime = stateMap['endTime'] || 0
      const now = Math.floor(Date.now() / 1000)
      const remainingTime = Math.max(0, endTime - now)

      // Only check local state if user is connected
      let hasVoted = false
      let myVote = 0
      
      if (activeAddress) {
        try {
          const accountInfo = await algorand.client.algod.accountApplicationInformation(activeAddress, Number(appId)).do()
          const localState = accountInfo.appLocalState?.keyValue
          
          if (localState) {
            for (const item of localState) {
              const keyBytes = item.key as unknown as Uint8Array
              const key = Buffer.from(keyBytes).toString()
              const val = item.value as { uint?: number | bigint }
              if (key === 'voted') hasVoted = Number(val.uint || 0) === 1
              if (key === 'choice') myVote = Number(val.uint || 0)
            }
          }
        } catch {
          // User not opted in yet - that's fine
        }
      }

      if (!question) {
        setFetchError('No poll created yet')
        setPollData(null)
        return
      }

      setPollData({
        question,
        options,
        hasVoted,
        myVote,
        isActive: isActive && remainingTime > 0,
        remainingTime,
      })
    } catch (e: any) {
      console.error('Error fetching poll data:', e)
      setFetchError('Could not load poll data')
      setPollData(null)
    }
  }

  useEffect(() => {
    fetchPollData()
    // Refresh every 30 seconds (only if we have an appId)
    const interval = appId ? setInterval(fetchPollData, 30000) : null
    return () => { if (interval) clearInterval(interval) }
  }, [appId, activeAddress])

  const handleVote = async () => {
    if (!appId || !activeAddress || selectedOption === null) {
      enqueueSnackbar('Please select an option to vote', { variant: 'warning' })
      return
    }

    setLoading(true)

    try {
      const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
      algorand.setDefaultSigner(transactionSigner)
      
      const client = new VotingContractClient({
        appId,
        defaultSender: activeAddress,
        algorand,
      })

      // Opt-in to the app first (required for local state)
      try {
        await algorand.send.appCallMethodCall({
          appId,
          method: client.appClient.getABIMethod('vote'),
          args: [BigInt(selectedOption)],
          onComplete: 1, // OptIn
          sender: activeAddress,
        })
        enqueueSnackbar('Vote cast successfully!', { variant: 'success' })
        onVoteCast()
        fetchPollData()
        return
      } catch (optInError: any) {
        // If opt-in fails, try regular call (user may already be opted in)
        console.log('Trying without opt-in...', optInError)
      }

      // Cast the vote
      await client.send.vote({
        args: { optionIndex: BigInt(selectedOption) },
      })

      enqueueSnackbar('Vote cast successfully!', { variant: 'success' })
      onVoteCast()
      fetchPollData()
    } catch (e: any) {
      console.error('Error voting:', e)
      enqueueSnackbar(`Error casting vote: ${e.message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    }
    return `${minutes}m remaining`
  }

  if (!appId) {
    return (
      <div className="voting-interface">
        <div className="no-poll">
          <h3>No Active Poll</h3>
          <p>Create a new poll or enter an App ID to view an existing poll.</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="voting-interface">
        <div className="no-poll">
          <h3>{fetchError}</h3>
          <p>Create a new poll to get started.</p>
        </div>
      </div>
    )
  }

  if (!pollData) {
    return (
      <div className="voting-interface">
        <div className="loading">Loading poll data...</div>
      </div>
    )
  }

  return (
    <div className="voting-interface">
      <div className="poll-card">
        <div className="poll-header">
          <h3 className="poll-question">{pollData.question}</h3>
          <div className={`poll-status ${pollData.isActive ? 'active' : 'ended'}`}>
            {pollData.isActive ? formatTime(pollData.remainingTime) : 'Poll Ended'}
          </div>
        </div>

        {pollData.hasVoted ? (
          <div className="voted-message">
            <p>You have already voted for: <strong>{pollData.options[pollData.myVote - 1]}</strong></p>
          </div>
        ) : pollData.isActive ? (
          <div className="voting-options">
            {pollData.options.map((option, index) => (
              <div
                key={index}
                className={`vote-option ${selectedOption === index + 1 ? 'selected' : ''}`}
                onClick={() => setSelectedOption(index + 1)}
              >
                <span className="option-number">{index + 1}</span>
                <span className="option-text">{option}</span>
              </div>
            ))}
            
            <button
              className="btn btn-primary btn-vote"
              onClick={handleVote}
              disabled={loading || selectedOption === null}
            >
              {loading ? 'Submitting Vote...' : 'Cast Vote'}
            </button>
          </div>
        ) : (
          <div className="poll-ended-message">
            <p>This poll has ended. View the results below.</p>
          </div>
        )}

        <div className="poll-info">
          <small>App ID: {appId.toString()}</small>
        </div>
      </div>
    </div>
  )
}

export default VotingInterface
