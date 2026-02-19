import { useState, useEffect } from 'react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface ResultsDashboardProps {
  appId: bigint | null
  refreshTrigger: number
}

interface VoteResults {
  options: string[]
  votes: number[]
  totalVotes: number
}

const ResultsDashboard = ({ appId, refreshTrigger }: ResultsDashboardProps) => {
  const [results, setResults] = useState<VoteResults | null>(null)
  const [loading, setLoading] = useState(false)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()

  const fetchResults = async () => {
    if (!appId) return

    setLoading(true)
    try {
      const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
      
      // Read global state directly from algod (no wallet needed)
      const appInfo = await algorand.client.algod.getApplicationByID(Number(appId)).do()
      const globalState = appInfo.params.globalState
      
      if (!globalState || globalState.length === 0) {
        setResults(null)
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

      const options: string[] = []
      if (stateMap['opt1']) options.push(stateMap['opt1'])
      if (stateMap['opt2']) options.push(stateMap['opt2'])
      if (stateMap['opt3']) options.push(stateMap['opt3'])
      if (stateMap['opt4']) options.push(stateMap['opt4'])

      const optionCount = stateMap['optCount'] || options.length
      const votes = [
        stateMap['v1'] || 0,
        stateMap['v2'] || 0,
        stateMap['v3'] || 0,
        stateMap['v4'] || 0,
      ].slice(0, optionCount)

      setResults({
        options: options.slice(0, optionCount),
        votes,
        totalVotes: stateMap['total'] || 0,
      })
    } catch (e: any) {
      console.error('Error fetching results:', e)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
    // Auto-refresh every 15 seconds (only if we have an appId)
    const interval = appId ? setInterval(fetchResults, 15000) : null
    return () => { if (interval) clearInterval(interval) }
  }, [appId, refreshTrigger])

  const getPercentage = (votes: number, total: number): number => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  const getBarColor = (index: number): string => {
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6']
    return colors[index % colors.length]
  }

  if (!appId) {
    return (
      <div className="results-dashboard">
        <h3>Results Dashboard</h3>
        <p className="no-data">No poll selected</p>
      </div>
    )
  }

  if (loading && !results) {
    return (
      <div className="results-dashboard">
        <h3>Results Dashboard</h3>
        <p className="loading">Loading results...</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="results-dashboard">
        <h3>Results Dashboard</h3>
        <p className="no-data">Unable to load results</p>
      </div>
    )
  }

  return (
    <div className="results-dashboard">
      <h3>Live Results</h3>
      <div className="total-votes">
        Total Votes: <strong>{results.totalVotes}</strong>
      </div>

      <div className="results-bars">
        {results.options.map((option, index) => {
          const percentage = getPercentage(results.votes[index], results.totalVotes)
          return (
            <div key={index} className="result-item">
              <div className="result-label">
                <span className="option-name">{option}</span>
                <span className="vote-count">{results.votes[index]} votes ({percentage}%)</span>
              </div>
              <div className="result-bar-container">
                <div
                  className="result-bar"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: getBarColor(index),
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {results.totalVotes > 0 && (
        <div className="winner-section">
          <h4>Leading:</h4>
          <p className="leader">
            {results.options[results.votes.indexOf(Math.max(...results.votes))]}
          </p>
        </div>
      )}
    </div>
  )
}

export default ResultsDashboard
