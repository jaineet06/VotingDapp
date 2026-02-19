import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { VotingContractFactory } from '../contracts/VotingContract'
import { OnSchemaBreak, OnUpdate } from '@algorandfoundation/algokit-utils/types/app'

interface CreatePollProps {
  openModal: boolean
  setModalState: (value: boolean) => void
  onPollCreated: (appId: bigint) => void
}

const CreatePoll = ({ openModal, setModalState, onPollCreated }: CreatePollProps) => {
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [option1, setOption1] = useState('')
  const [option2, setOption2] = useState('')
  const [option3, setOption3] = useState('')
  const [option4, setOption4] = useState('')
  const [durationHours, setDurationHours] = useState('24')
  
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
  algorand.setDefaultSigner(transactionSigner)

  const resetForm = () => {
    setQuestion('')
    setOption1('')
    setOption2('')
    setOption3('')
    setOption4('')
    setDurationHours('24')
  }

  const handleCreatePoll = async () => {
    if (!question.trim() || !option1.trim() || !option2.trim()) {
      enqueueSnackbar('Please provide a question and at least 2 options', { variant: 'error' })
      return
    }

    setLoading(true)

    try {
      // Deploy new voting contract instance
      const factory = new VotingContractFactory({
        defaultSender: activeAddress ?? undefined,
        algorand,
      })

      const deployResult = await factory.deploy({
        onSchemaBreak: OnSchemaBreak.AppendApp,
        onUpdate: OnUpdate.AppendApp,
      })

      if (!deployResult) {
        throw new Error('Failed to deploy contract')
      }

      const { appClient } = deployResult
      
      // Convert duration to seconds
      const durationSeconds = BigInt(parseInt(durationHours) * 3600)
      
      // Create the poll
      await appClient.send.createPoll({
        args: {
          question: new TextEncoder().encode(question),
          opt1: new TextEncoder().encode(option1),
          opt2: new TextEncoder().encode(option2),
          opt3: new TextEncoder().encode(option3 || ''),
          opt4: new TextEncoder().encode(option4 || ''),
          durationSeconds: durationSeconds,
          tokenId: BigInt(0), // No token gating for MVP
        },
      })

      enqueueSnackbar('Poll created successfully!', { variant: 'success' })
      onPollCreated(BigInt(appClient.appClient.appId))
      resetForm()
      setModalState(false)
    } catch (e: any) {
      console.error('Error creating poll:', e)
      enqueueSnackbar(`Error creating poll: ${e.message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="create_poll_modal" className={`modal ${openModal ? 'modal-open' : ''}`} style={{ display: openModal ? 'block' : 'none' }}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl">Create New Poll</h3>
        
        <div className="form-group">
          <label className="form-label">Poll Question *</label>
          <input
            type="text"
            placeholder="What would you like to ask?"
            className="input input-bordered w-full"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Option 1 *</label>
          <input
            type="text"
            placeholder="First option"
            className="input input-bordered w-full"
            value={option1}
            onChange={(e) => setOption1(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Option 2 *</label>
          <input
            type="text"
            placeholder="Second option"
            className="input input-bordered w-full"
            value={option2}
            onChange={(e) => setOption2(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Option 3 (optional)</label>
          <input
            type="text"
            placeholder="Third option"
            className="input input-bordered w-full"
            value={option3}
            onChange={(e) => setOption3(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Option 4 (optional)</label>
          <input
            type="text"
            placeholder="Fourth option"
            className="input input-bordered w-full"
            value={option4}
            onChange={(e) => setOption4(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Duration (hours)</label>
          <input
            type="number"
            placeholder="24"
            className="input input-bordered w-full"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            min="1"
            max="720"
          />
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-secondary" onClick={() => setModalState(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCreatePoll} disabled={loading}>
            {loading ? <span className="loading-spinner">Creating...</span> : 'Create Poll'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default CreatePoll
