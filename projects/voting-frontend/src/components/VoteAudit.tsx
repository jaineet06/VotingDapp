import { useState, useEffect } from 'react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { useWallet } from '@txnlab/use-wallet-react'

interface VoteAuditProps {
  appId: bigint | null
  refreshTrigger: number
}

interface AuditEntry {
  txId: string
  timestamp: string
  anonymizedVoter: string
  optionVoted: number
}

const VoteAudit = ({ appId, refreshTrigger }: VoteAuditProps) => {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
  algorand.setDefaultSigner(transactionSigner)

  const anonymizeAddress = (address: string): string => {
    if (!address || address.length < 10) return 'Unknown'
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`
  }

  const fetchAuditLog = async () => {
    if (!appId) return

    setLoading(true)
    try {
      // Get application transactions from indexer
      const indexer = algorand.client.indexer
      const response = await indexer.searchForTransactions()
        .applicationID(Number(appId))
        .do()

      const entries: AuditEntry[] = []
      
      for (const txn of response.transactions || []) {
        // Filter for application calls that are votes
        if (txn.txType === 'appl' && txn.applicationTransaction) {
          const appTxn = txn.applicationTransaction
          
          // Check if this is a vote transaction (has args with 'vote' method)
          if (appTxn.applicationArgs && appTxn.applicationArgs.length > 0) {
            // Decode the method selector
            const methodArg = appTxn.applicationArgs[0]
            const decoded = atob(methodArg as unknown as string)
            
            // Simple check if it might be a vote transaction
            if (decoded.includes('vote') || appTxn.applicationArgs.length === 2) {
              // Get the option voted (second arg)
              let optionVoted = 0
              if (appTxn.applicationArgs.length >= 2) {
                try {
                  const optionArg = appTxn.applicationArgs[1] as unknown as string
                  const optionBytes = Uint8Array.from(atob(optionArg), c => c.charCodeAt(0))
                  if (optionBytes.length >= 1) {
                    optionVoted = optionBytes[optionBytes.length - 1]
                  }
                } catch {
                  optionVoted = 0
                }
              }

              entries.push({
                txId: txn.id || '',
                timestamp: new Date((txn.roundTime || 0) * 1000).toLocaleString(),
                anonymizedVoter: anonymizeAddress(txn.sender || ''),
                optionVoted,
              })
            }
          }
        }
      }

      setAuditLog(entries.reverse()) // Most recent first
    } catch (e: any) {
      console.error('Error fetching audit log:', e)
      // Fallback: create demo entries for MVP
      setAuditLog([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLog()
  }, [appId, refreshTrigger])

  if (!appId) {
    return (
      <div className="vote-audit">
        <h3>Vote Audit Trail</h3>
        <p className="no-data">No poll selected</p>
      </div>
    )
  }

  return (
    <div className="vote-audit">
      <h3>Vote Audit Trail</h3>
      <p className="audit-description">
        All votes are recorded on the Algorand blockchain, ensuring transparency and immutability.
        Voter identities are partially anonymized for privacy.
      </p>

      {loading ? (
        <p className="loading">Loading audit trail...</p>
      ) : auditLog.length === 0 ? (
        <p className="no-data">No votes recorded yet</p>
      ) : (
        <div className="audit-table">
          <div className="audit-header">
            <span className="col-time">Time</span>
            <span className="col-voter">Voter</span>
            <span className="col-option">Option</span>
            <span className="col-txid">Transaction</span>
          </div>
          {auditLog.map((entry, index) => (
            <div key={index} className="audit-row">
              <span className="col-time">{entry.timestamp}</span>
              <span className="col-voter">{entry.anonymizedVoter}</span>
              <span className="col-option">Option {entry.optionVoted}</span>
              <span className="col-txid">
                <a
                  href={`https://testnet.explorer.perawallet.app/tx/${entry.txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  {entry.txId.substring(0, 8)}...
                </a>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="blockchain-info">
        <small>
          App ID: {appId.toString()} | 
          <a
            href={`https://testnet.explorer.perawallet.app/application/${appId.toString()}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </small>
      </div>
    </div>
  )
}

export default VoteAudit
