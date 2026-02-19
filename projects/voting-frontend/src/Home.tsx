// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import CreatePoll from './components/CreatePoll'
import VotingInterface from './components/VotingInterface'
import ResultsDashboard from './components/ResultsDashboard'
import VoteAudit from './components/VoteAudit'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openCreatePollModal, setOpenCreatePollModal] = useState<boolean>(false)
  const [currentAppId, setCurrentAppId] = useState<bigint | null>(null)
  const [appIdInput, setAppIdInput] = useState<string>('')
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'vote' | 'results' | 'audit'>('vote')
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const handlePollCreated = (appId: bigint) => {
    setCurrentAppId(appId)
    setAppIdInput(appId.toString())
  }

  const handleVoteCast = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleLoadPoll = () => {
    if (appIdInput.trim()) {
      setCurrentAppId(BigInt(appIdInput))
    }
  }

  return (
    <div className="voting-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Campus Vote</h1>
          <p className="app-subtitle">Decentralized Voting on Algorand</p>
        </div>
        <div className="header-actions">
          {activeAddress ? (
            <div className="wallet-info">
              <span className="wallet-badge">Connected</span>
              <span className="wallet-address">
                {activeAddress.substring(0, 6)}...{activeAddress.substring(activeAddress.length - 4)}
              </span>
              <button className="btn btn-small" onClick={toggleWalletModal}>
                Wallet
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={toggleWalletModal}>
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {!activeAddress ? (
          <div className="connect-prompt">
            <div className="prompt-card">
              <h2>Welcome to Campus Vote</h2>
              <p>
                A transparent, tamper-proof voting platform for campus elections,
                club decisions, and opinion polls powered by Algorand blockchain.
              </p>
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">🔐</span>
                  <span>One vote per wallet</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📊</span>
                  <span>Real-time results</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔍</span>
                  <span>Transparent audit trail</span>
                </div>
              </div>
              <button className="btn btn-primary btn-large" onClick={toggleWalletModal}>
                Connect Wallet to Start
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            {/* Actions Bar */}
            <div className="actions-bar">
              <button
                className="btn btn-primary"
                onClick={() => setOpenCreatePollModal(true)}
              >
                + Create New Poll
              </button>
              <div className="poll-loader">
                <input
                  type="text"
                  placeholder="Enter Poll App ID"
                  value={appIdInput}
                  onChange={(e) => setAppIdInput(e.target.value)}
                  className="input"
                />
                <button className="btn" onClick={handleLoadPoll}>
                  Load Poll
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'vote' ? 'active' : ''}`}
                onClick={() => setActiveTab('vote')}
              >
                Vote
              </button>
              <button
                className={`tab ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                Results
              </button>
              <button
                className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                Audit Trail
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'vote' && (
                <VotingInterface
                  appId={currentAppId}
                  onVoteCast={handleVoteCast}
                />
              )}
              {activeTab === 'results' && (
                <ResultsDashboard
                  appId={currentAppId}
                  refreshTrigger={refreshTrigger}
                />
              )}
              {activeTab === 'audit' && (
                <VoteAudit
                  appId={currentAppId}
                  refreshTrigger={refreshTrigger}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Powered by Algorand Blockchain | Hackathon Project 2026</p>
      </footer>

      {/* Modals */}
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <CreatePoll
        openModal={openCreatePollModal}
        setModalState={setOpenCreatePollModal}
        onPollCreated={handlePollCreated}
      />
    </div>
  )
}

export default Home
