import React, { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { usePolls } from './hooks/usePolls';
import { CreatePollForm } from './types/Poll';
import { Notification, useNotification } from './components/Notification';
import ConnectWallet from './components/ConnectWallet';
import './styles/App.css';

const Home: React.FC = () => {
  const { activeAddress } = useWallet();
  const { 
    polls, 
    pollCount, 
    isLoading, 
    hasOptedIn,
    appExists,
    optIn, 
    createPoll, 
    vote, 
    endPoll 
  } = usePolls();

  const { notification, showSuccess, showError, showWarning, clearNotification } = useNotification();
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false);

  const [formData, setFormData] = useState<CreatePollForm>({
    question: '',
    option1: '',
    option2: '',
    option3: '',
    duration: '3600'
  });

  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOptIn = async () => {
    if (!appExists) {
      showError(
        '⛔ Contract Not Deployed',
        `App ID 755801656 does not exist on the Algorand TestNet.\n\nPlease deploy the contract first.`
      );
      return;
    }
    
    try {
      await optIn();
      showSuccess(
        'Successfully opted in! You can now create and vote on polls.',
        'Your wallet is now connected to the voting application.'
      );
    } catch (error: any) {
      console.error('Opt-in error:', error);
      
      if (error.message?.includes('already opted in')) {
        showSuccess(
          'Already Opted In! ✅',
          'Your wallet is already connected to this application. You can create and vote on polls.'
        );
        return;
      }
      
      let errorMessage = 'Failed to opt-in to the application.';
      let errorDetails = error.message || 'Unknown error';
      
      if (error.message?.includes('logic eval error') || error.message?.includes('assert failed')) {
        errorMessage = '⛔ Contract Error: App Not Deployed or Outdated';
        errorDetails = `Transaction failed. The contract may need to be redeployed.`;
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network Error: Connection failed';
        errorDetails = `Could not connect to Algorand network. Check your internet connection.`;
      } else if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Transaction Rejected';
        errorDetails = 'You cancelled the transaction in your wallet. No changes were made.';
      }
      
      showError(errorMessage, errorDetails);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.option1.trim() || 
        !formData.option2.trim() || !formData.option3.trim()) {
      showWarning(
        'Incomplete Form',
        'Please fill in all fields before creating a poll.'
      );
      return;
    }
    
    if (polls.length > 0 && polls[0].active) {
      showWarning(
        'Active Poll Exists',
        'Only one poll can be active at a time. Please end the current poll first.'
      );
      return;
    }
    
    try {
      await createPoll(formData);
      setFormData({
        question: '',
        option1: '',
        option2: '',
        option3: '',
        duration: '3600'
      });
      setShowCreateForm(false);
      showSuccess(
        'Poll Created Successfully! 🎉',
        'Your poll is now live and accepting votes.'
      );
    } catch (error: any) {
      console.error('Error creating poll:', error);
      showError(
        'Failed to Create Poll',
        error.message || 'An error occurred while creating the poll.'
      );
    }
  };

  const handleVote = async (pollId: number, option: number) => {
    try {
      await vote(pollId, option);
      showSuccess(
        'Vote Recorded! ✅',
        `Your vote for option ${option} has been recorded on the blockchain.`
      );
    } catch (error: any) {
      console.error('Error voting:', error);
      showError(
        'Failed to Vote',
        error.message || 'An error occurred while recording your vote.'
      );
    }
  };

  const handleEndPoll = async (pollId: number) => {
    try {
      await endPoll(pollId);
      showSuccess(
        'Poll Ended',
        'The poll has been successfully ended. Results are now final.'
      );
    } catch (error: any) {
      console.error('Error ending poll:', error);
      showError(
        'Failed to End Poll',
        error.message || 'An error occurred while ending the poll.'
      );
    }
  };

  const getTotalVotes = (poll: any) => {
    return (poll.votes1 || 0) + (poll.votes2 || 0) + (poll.votes3 || 0);
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total === 0 ? 0 : Math.round((votes / total) * 100);
  };

  const formatTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  // Modern Header Component
  const renderHeader = () => (
    <header style={{
      background: 'linear-gradient(180deg, rgba(0, 245, 255, 0.08) 0%, rgba(10, 10, 26, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0, 245, 255, 0.2)',
      padding: '20px 32px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 30px rgba(0, 245, 255, 0.1)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Logo/Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontSize: '36px',
            background: 'linear-gradient(135deg, #00f5ff, #ff00ff)',
            borderRadius: '16px',
            padding: '8px 12px',
            boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)'
          }}>
            🗳️
          </div>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #00f5ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '1px',
              margin: 0
            }}>
              ALGORAND VOTING
            </h1>
            <p style={{
              fontSize: '12px',
              color: '#888',
              margin: 0,
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              Decentralized • Transparent • Secure
            </p>
          </div>
        </div>

        {/* Wallet Info/Connect Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {activeAddress ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(0, 245, 255, 0.1)',
                padding: '12px 20px',
                borderRadius: '100px',
                border: '1px solid rgba(0, 245, 255, 0.3)',
                boxShadow: '0 0 20px rgba(0, 245, 255, 0.2)'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #00ff88, #00f5ff)',
                  color: '#0a0a1a',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  Connected
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: '#00f5ff',
                  letterSpacing: '0.5px'
                }}>
                  {activeAddress.substring(0, 6)}...{activeAddress.substring(activeAddress.length - 4)}
                </span>
              </div>
              <button
                onClick={toggleWalletModal}
                style={{
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 51, 102, 0.5)',
                  background: 'rgba(255, 51, 102, 0.1)',
                  color: '#ff3366',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Orbitron, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 51, 102, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 51, 102, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={toggleWalletModal}
              style={{
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: 700,
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #00f5ff, #7b2cff)',
                color: '#0a0a1a',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 30px rgba(0, 245, 255, 0.4)',
                fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 245, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 245, 255, 0.4)';
              }}
            >
              🔗 Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );

  // Welcome Screen (No Wallet)
  if (!activeAddress) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--darker)' }}>
        {renderHeader()}
        <div className="home-container container">
          <div style={{ maxWidth: '700px', margin: '100px auto', textAlign: 'center' }}>
            <div style={{ marginBottom: '48px' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px', animation: 'float 3s ease-in-out infinite' }}>
                🌐
              </div>
              <h2 style={{
                fontSize: '42px',
                fontWeight: 800,
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #00f5ff, #ff00ff, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                Welcome to the Future of Voting
              </h2>
              <p style={{ fontSize: '18px', color: '#aaa', lineHeight: '1.8', marginBottom: '40px' }}>
                Experience truly decentralized governance powered by Algorand blockchain technology
              </p>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.08), rgba(123, 44, 255, 0.08))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 245, 255, 0.3)',
              borderRadius: '24px',
              padding: '40px',
              marginBottom: '40px'
            }}>
              <h3 style={{
                fontSize: '24px',
                marginBottom: '24px',
                color: '#00f5ff',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                Why Blockchain Voting?
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                textAlign: 'left'
              }}>
                {[
                  { icon: '🔒', title: 'Immutable', desc: 'Votes recorded on blockchain cannot be altered' },
                  { icon: '👁️', title: 'Transparent', desc: 'All transactions are publicly verifiable' },
                  { icon: '⚡', title: 'Instant', desc: 'Real-time results with instant finality' },
                  { icon: '💎', title: 'Fair', desc: 'One wallet = one vote, no manipulation' }
                ].map((feature, idx) => (
                  <div key={idx} style={{
                    padding: '20px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 245, 255, 0.2)'
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>{feature.icon}</div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#00f5ff' }}>
                      {feature.title}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={toggleWalletModal}
              style={{
                padding: '20px 48px',
                fontSize: '20px',
                fontWeight: 700,
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #00f5ff, #7b2cff)',
                color: '#0a0a1a',
                cursor: 'pointer',
                boxShadow: '0 0 40px rgba(0, 245, 255, 0.5)',
                fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 60px rgba(0, 245, 255, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 245, 255, 0.5)';
              }}
            >
              🚀 Get Started Now
            </button>
            
            <p style={{ fontSize: '13px', color: '#666', marginTop: '24px' }}>
              Supported wallets: Pera, Defly, Exodus
            </p>
          </div>
        </div>
        <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      </div>
    );
  }

  // Opt-in Screen
  if (!hasOptedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--darker)' }}>
        {renderHeader()}
        <div className="home-container container">
          <div style={{ maxWidth: '600px', margin: '100px auto' }}>
            {!appExists && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,170,0,0.2), rgba(255,100,0,0.2))',
                border: '2px solid #ffaa00',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#ffaa00', margin: '0 0 12px 0', fontSize: '20px' }}>
                  ⚠️ Contract Not Deployed
                </h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '15px' }}>
                  App ID <strong>755801656</strong> not found on TestNet
                </p>
                <p style={{ margin: '0', fontSize: '13px', color: '#aaa' }}>
                  Please deploy the contract first
                </p>
              </div>
            )}
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.08), rgba(123, 44, 255, 0.08))',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(0, 245, 255, 0.3)',
              borderRadius: '24px',
              padding: '48px',
              textAlign: 'center',
              boxShadow: '0 8px 40px rgba(0, 245, 255, 0.2)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔐</div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 800,
                marginBottom: '16px',
                color: '#00f5ff',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                One-Time Setup
              </h2>
              <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '32px', lineHeight: '1.6' }}>
                Enable your wallet to interact with the voting smart contract
              </p>
              
              <div style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px',
                textAlign: 'left'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#00ff88' }}>
                  ✨ What is Opt-In?
                </h4>
                <ul style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                  <li>One-time permission to use the voting app</li>
                  <li>Required by Algorand for local state storage</li>
                  <li>Small network fee (~0.001 ALGO)</li>
                  <li>You only need to do this once</li>
                </ul>
              </div>
              
              <button 
                onClick={handleOptIn} 
                disabled={isLoading || !appExists} 
                style={{
                  width: '100%',
                  padding: '20px',
                  fontSize: '18px',
                  fontWeight: 700,
                  borderRadius: '14px',
                  border: 'none',
                  background: (!appExists || isLoading) 
                    ? 'rgba(136, 136, 136, 0.3)' 
                    : 'linear-gradient(135deg, #00ff88, #00f5ff)',
                  color: (!appExists || isLoading) ? '#666' : '#0a0a1a',
                  cursor: (!appExists || isLoading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Orbitron, sans-serif',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  boxShadow: (!appExists || isLoading) 
                    ? 'none' 
                    : '0 0 30px rgba(0, 255, 136, 0.4)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && appExists) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 255, 136, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (!isLoading && appExists) {
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.4)';
                  }
                }}
              >
                {isLoading ? (
                  <>⏳ Processing...</>
                ) : !appExists ? (
                  <>⛔ Contract Not Available</>
                ) : (
                  <>🚀 Enable Voting</>
                )}
              </button>
              
              {appExists && !isLoading && (
                <p style={{ fontSize: '13px', color: '#666', marginTop: '20px' }}>
                  Transaction fee: ~0.001 ALGO
                </p>
              )}
            </div>
          </div>
        </div>
        <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      </div>
    );
  }

  // Main Dashboard (continued in next part due to length)
  const currentPoll = polls.length > 0 ? polls[0] : null;
  const totalVotes = currentPoll ? getTotalVotes(currentPoll) : 0;
  const isExpired = currentPoll && currentPoll.endTime && Math.floor(Date.now() / 1000) >= currentPoll.endTime;
  const isActive = currentPoll && currentPoll.active && !isExpired;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--darker)' }}>
      {renderHeader()}
      <div className="home-container container" style={{ paddingTop: '40px' }}>
        {/* Info Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(123, 44, 255, 0.15), rgba(0, 245, 255, 0.10))',
          border: '1px solid rgba(123, 44, 255, 0.3)',
          borderRadius: '16px',
          padding: '20px 28px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '32px' }}>ℹ️</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: '#7b2cff' }}>
              Single Poll System
            </h4>
            <p style={{ fontSize: '14px', color: '#aaa', margin: 0, lineHeight: '1.5' }}>
              This contract supports <strong>one active poll at a time</strong>. To create a new poll, you must end the current one first.
            </p>
          </div>
        </div>

        {/* Dashboard Content continues... */}
        {/* (Rest of the dashboard implementation) */}
      </div>
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          details={notification.details}
          onClose={clearNotification}
        />
      )}
    </div>
  );
};

export default Home;
