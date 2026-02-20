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
  const toggleWalletModal = () => setOpenWalletModal(!openWalletModal);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleOptIn = async () => {
    if (!appExists) {
      showError('Contract Not Deployed', 'App ID 755801656 does not exist on Algorand TestNet.');
      return;
    }
    try {
      await optIn();
      showSuccess('Opted in successfully!', 'Your wallet is now connected to the voting application.');
    } catch (error: any) {
      if (error.message?.includes('already opted in')) {
        showSuccess('Already Opted In', 'Your wallet is already connected.');
        return;
      }
      let msg = 'Failed to opt-in.';
      if (error.message?.includes('logic eval error')) msg = 'Contract error. Please redeploy.';
      else if (error.message?.includes('network')) msg = 'Network error. Check connection.';
      else if (error.message?.includes('rejected') || error.message?.includes('cancelled')) msg = 'Transaction cancelled.';
      showError(msg, error.message || 'Unknown error');
    }
  };
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.option1.trim() || !formData.option2.trim() || !formData.option3.trim()) {
      showWarning('Incomplete Form', 'Please fill in all fields.');
      return;
    }
    if (polls.length > 0 && polls[0].active) {
      showWarning('Active Poll Exists', 'End the current poll before creating a new one.');
      return;
    }
    try {
      await createPoll(formData);
      setFormData({ question: '', option1: '', option2: '', option3: '', duration: '3600' });
      setShowCreateForm(false);
      showSuccess('Poll Created!', 'Your poll is now live.');
    } catch (error: any) {
      showError('Failed to Create Poll', error.message || 'Unknown error');
    }
  };
  const handleVote = async (pollId: number, option: number) => {
    try {
      await vote(pollId, option);
      showSuccess('Vote Recorded!', 'Your vote has been saved on the blockchain.');
    } catch (error: any) {
      showError('Failed to Vote', error.message || 'Unknown error');
    }
  };
  const handleEndPoll = async (pollId: number) => {
    try {
      await endPoll(pollId);
      showSuccess('Poll Ended', 'Results are now final.');
    } catch (error: any) {
      showError('Failed to End Poll', error.message || 'Unknown error');
    }
  };
  const getTotalVotes = (poll: any) =>
    Number(poll.votes1 || 0) + Number(poll.votes2 || 0) + Number(poll.votes3 || 0);
  const getVotePercentage = (votes: any, total: number) => {
    const v = Number(votes || 0);
    return total === 0 ? 0 : Math.round((v / total) * 100);
  };
  const formatTimeRemaining = (endTime: any) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(endTime) - now;
    if (remaining <= 0) return 'Ended';
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };
  const glass: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
  };
  const glassStrong: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '24px',
  };
  const inputStyle: React.CSSProperties = {
    padding: '14px 18px',
    fontSize: '15px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
  const renderHeader = () => (
    <header style={{
      background: 'rgba(8,8,18,0.85)',
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '18px 40px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(168,85,247,0.8))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
          }}>
            <span role="img" aria-label="vote">🗳️</span>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              Algorand Voting
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Decentralized · Transparent
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {activeAddress ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '100px', padding: '8px 16px',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                  {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                </span>
              </div>
              <button onClick={toggleWalletModal} style={{
                padding: '9px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={toggleWalletModal} style={{
              padding: '11px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '12px',
              border: '1px solid rgba(99,102,241,0.4)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))',
              color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(99,102,241,0.2)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(168,85,247,0.4))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))'; }}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
  if (!activeAddress) {
    return (
      <div style={{ minHeight: '100vh', background: '#08080f' }}>
        {renderHeader()}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto', padding: '100px 24px 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ fontSize: '64px', marginBottom: '28px' }}>
              <span role="img" aria-label="vote">🗳️</span>
            </div>
            <h1 style={{ fontSize: '40px', fontWeight: 700, color: '#fff', marginBottom: '16px', lineHeight: '1.2', letterSpacing: '-0.5px' }}>
              Vote on-chain.{' '}
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Transparently.
              </span>
            </h1>
            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', maxWidth: '480px', margin: '0 auto 40px' }}>
              Decentralized polling on Algorand. Every vote is immutable, verifiable, and instant.
            </p>
            <button onClick={toggleWalletModal} style={{
              padding: '16px 40px', fontSize: '16px', fontWeight: 600, borderRadius: '14px',
              border: '1px solid rgba(99,102,241,0.4)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
              color: '#fff', cursor: 'pointer', transition: 'all 0.3s',
              boxShadow: '0 8px 32px rgba(99,102,241,0.25)', backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(168,85,247,0.5))'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Connect Wallet to Get Started
            </button>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '16px' }}>
              Supports Pera · Defly · Exodus
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {[
              { icon: '\uD83D\uDD12', title: 'Immutable', desc: 'Votes are permanently recorded on-chain' },
              { icon: '\uD83D\uDC41\uFE0F', title: 'Transparent', desc: 'Anyone can verify every transaction' },
              { icon: '\u26A1', title: 'Instant', desc: 'Real-time results with Algorand finality' },
              { icon: '\uD83D\uDC8E', title: 'Fair', desc: 'One wallet, one vote - zero manipulation' },
            ].map((f, i) => (
              <div key={i} style={{ ...glass, padding: '22px' }}>
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>{f.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{f.title}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      </div>
    );
  }
  if (!hasOptedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#08080f' }}>
        {renderHeader()}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', left: '20%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: '80px auto', padding: '0 24px' }}>
          {!appExists && (
            <div style={{ ...glass, padding: '20px 24px', marginBottom: '20px', borderColor: 'rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: 600, color: '#fbbf24', marginBottom: '6px' }}>Contract Not Deployed</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>App ID 755801656 not found on TestNet</div>
            </div>
          )}
          <div style={{ ...glassStrong, padding: '48px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '24px' }}>
              <span role="img" aria-label="lock">🔐</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '12px', letterSpacing: '-0.3px' }}>
              One-Time Setup
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', marginBottom: '36px', lineHeight: '1.6' }}>
              Enable your wallet to interact with the voting contract.
            </p>
            <div style={{ ...glass, padding: '20px', marginBottom: '32px', textAlign: 'left', borderColor: 'rgba(99,102,241,0.2)' }}>
              {[
                'One-time permission to use the voting app',
                'Required by Algorand for local state storage',
                'Small network fee (~0.001 ALGO)',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < 2 ? '12px' : 0 }}>
                  <span style={{ color: '#818cf8', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={handleOptIn} disabled={isLoading || !appExists} style={{
              width: '100%', padding: '16px', fontSize: '16px', fontWeight: 600, borderRadius: '14px',
              border: '1px solid rgba(99,102,241,0.35)',
              background: (!appExists || isLoading) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(168,85,247,0.4))',
              color: (!appExists || isLoading) ? 'rgba(255,255,255,0.3)' : '#fff',
              cursor: (!appExists || isLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: (!appExists || isLoading) ? 'none' : '0 8px 28px rgba(99,102,241,0.25)',
            }}>
              {isLoading ? 'Processing...' : !appExists ? 'Contract Not Available' : 'Enable Voting'}
            </button>
            {appExists && !isLoading && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '16px' }}>
                Transaction fee: ~0.001 ALGO
              </p>
            )}
          </div>
        </div>
        <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', background: '#08080f' }}>
      {renderHeader()}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '6px', letterSpacing: '-0.4px' }}>
              Voting Dashboard
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
              {polls.length === 0
                ? 'No polls yet - create the first one!'
                : `${polls.length} poll${polls.length !== 1 ? 's' : ''}${polls.filter(p => p.active).length > 0 ? ' - ' + polls.filter(p => p.active).length + ' active' : ''}`}
            </p>
          </div>
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={{
            padding: '12px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '12px',
            border: showCreateForm ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(99,102,241,0.35)',
            background: showCreateForm ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))',
            color: showCreateForm ? '#f87171' : '#fff',
            cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(12px)',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
            {showCreateForm ? 'X  Cancel' : '+ New Poll'}
          </button>
        </div>
        {showCreateForm && (
          <div style={{ ...glassStrong, padding: '36px', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '28px', letterSpacing: '-0.2px' }}>
              Create Poll
            </h3>
            <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="text" name="question" placeholder="Poll question" value={formData.question}
                onChange={handleInputChange} required maxLength={100} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {(['option1', 'option2', 'option3'] as (keyof CreatePollForm)[]).map((name, i) => (
                  <input key={name} type="text" name={name}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    value={formData[name]} onChange={handleInputChange} required maxLength={50} style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, whiteSpace: 'nowrap' }}>Duration</label>
                <select name="duration" value={formData.duration}
                  onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="3600">1 Hour</option>
                  <option value="21600">6 Hours</option>
                  <option value="86400">1 Day</option>
                  <option value="259200">3 Days</option>
                  <option value="604800">1 Week</option>
                </select>
              </div>
              <button type="submit" disabled={isLoading} style={{
                padding: '15px', fontSize: '15px', fontWeight: 600, borderRadius: '12px',
                border: '1px solid rgba(99,102,241,0.35)',
                background: isLoading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(99,102,241,0.45), rgba(168,85,247,0.45))',
                color: isLoading ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '4px',
                boxShadow: isLoading ? 'none' : '0 6px 24px rgba(99,102,241,0.2)',
              }}>
                {isLoading ? 'Creating...' : 'Create Poll'}
              </button>
            </form>
          </div>
        )}
        {isLoading && polls.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>
              <span role="img" aria-label="loading">⏳</span>
            </div>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.3)' }}>Loading polls...</p>
          </div>
        )}
        {!isLoading && polls.length === 0 && (
          <div style={{ ...glass, padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '52px', marginBottom: '20px', opacity: 0.4 }}>
              <span role="img" aria-label="empty">📭</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>No polls yet</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginBottom: '28px' }}>
              Be the first to create a poll and start voting.
            </p>
            <button onClick={() => setShowCreateForm(true)} style={{
              padding: '12px 28px', fontSize: '14px', fontWeight: 600, borderRadius: '12px',
              border: '1px solid rgba(99,102,241,0.35)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))',
              color: '#fff', cursor: 'pointer',
            }}>
              Create First Poll
            </button>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {polls.map((poll) => {
            const total = getTotalVotes(poll);
            const expired = poll.endTime && Math.floor(Date.now() / 1000) >= Number(poll.endTime);
            const active = poll.active && !expired;
            return (
              <div key={poll.id} style={{
                ...glassStrong, padding: '28px',
                borderColor: active ? 'rgba(129,140,248,0.2)' : 'rgba(255,255,255,0.06)',
                transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
              }}>
                {active && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.6), transparent)',
                  }} />
                )}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  background: active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  color: active ? '#4ade80' : 'rgba(255,255,255,0.3)', marginBottom: '16px',
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? '#22c55e' : 'rgba(255,255,255,0.2)', boxShadow: active ? '0 0 6px #22c55e' : 'none' }} />
                  {active ? 'Live' : 'Ended'}
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 700, color: active ? '#fff' : 'rgba(255,255,255,0.4)', marginBottom: '14px', lineHeight: '1.4', letterSpacing: '-0.2px' }}>
                  {poll.question}
                </h3>
                <div style={{ display: 'flex', gap: '18px', marginBottom: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.35)', flexWrap: 'wrap' }}>
                  <span>{total} vote{total !== 1 ? 's' : ''}</span>
                  {poll.endTime && <span>{formatTimeRemaining(poll.endTime)}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: poll.option1, votes: poll.votes1, option: 1 },
                    { label: poll.option2, votes: poll.votes2, option: 2 },
                    { label: poll.option3, votes: poll.votes3, option: 3 },
                  ].map(({ label, votes, option }) => {
                    const pct = getVotePercentage(votes, total);
                    const isChoice = poll.userChoice === option;
                    return (
                      <div key={option} style={{
                        borderRadius: '12px', padding: '14px 16px',
                        border: isChoice ? '1px solid rgba(129,140,248,0.4)' : '1px solid rgba(255,255,255,0.07)',
                        background: isChoice ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.02)',
                        position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
                      }}>
                        <div style={{
                          position: 'absolute', inset: 0, width: `${pct}%`,
                          background: active ? 'rgba(129,140,248,0.07)' : 'rgba(255,255,255,0.03)',
                          transition: 'width 0.6s ease', borderRadius: '12px',
                        }} />
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isChoice && <span style={{ fontSize: '12px', color: '#818cf8' }}>✓</span>}
                            <span style={{ fontSize: '14px', fontWeight: 500, color: active ? '#fff' : 'rgba(255,255,255,0.4)' }}>{label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{pct}%</span>
                            {active && !poll.hasVoted && (
                              <button onClick={() => handleVote(poll.id, option)} disabled={isLoading} style={{
                                padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px',
                                border: '1px solid rgba(129,140,248,0.35)', background: 'rgba(129,140,248,0.15)',
                                color: '#a5b4fc', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = 'rgba(129,140,248,0.28)'; e.currentTarget.style.color = '#fff'; } }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.15)'; e.currentTarget.style.color = '#a5b4fc'; }}>
                                Vote
                              </button>
                            )}
                          </div>
                        </div>
                        <div style={{ position: 'relative', zIndex: 1, marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
                          {Number(votes || 0)} {Number(votes || 0) === 1 ? 'vote' : 'votes'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {poll.hasVoted && (
                  <div style={{
                    marginTop: '16px', padding: '11px', borderRadius: '10px',
                    background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)',
                    textAlign: 'center', fontSize: '13px', color: '#4ade80', fontWeight: 500,
                  }}>
                    ✓ You voted in this poll
                  </div>
                )}
                {active && poll.creator === activeAddress && (
                  <button onClick={() => handleEndPoll(poll.id)} disabled={isLoading} style={{
                    width: '100%', marginTop: '14px', padding: '11px', fontSize: '13px', fontWeight: 600, borderRadius: '10px',
                    border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)',
                    color: '#f87171', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}>
                    End Poll
                  </button>
                )}
              </div>
            );
          })}
        </div>
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