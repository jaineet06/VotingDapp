import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import { useState } from 'react'
import { ellipseAddress } from '../utils/ellipseAddress'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  const handleConnect = async (wallet: Wallet) => {
    setConnecting(wallet.id)
    try {
      await wallet.connect()
      closeModal()
    } catch (_) {
      // ignore user cancellation
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async () => {
    if (wallets) {
      const activeWallet = wallets.find((w) => w.isActive)
      if (activeWallet) {
        await activeWallet.disconnect()
      } else {
        localStorage.removeItem('@txnlab/use-wallet:v3')
        window.location.reload()
      }
    }
  }

  if (!openModal) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'linear-gradient(145deg, rgba(18,18,36,0.98), rgba(12,12,24,0.98))',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)',
        overflow: 'hidden',
        animation: 'slideUp 0.22s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(168,85,247,0.8))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}>🔐</div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {activeAddress ? 'Connected Wallet' : 'Connect Wallet'}
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              {activeAddress ? 'Your wallet is connected to Algorand TestNet' : 'Choose a wallet to get started'}
            </p>
          </div>
          <button
            onClick={closeModal}
            style={{
              width: '32px', height: '32px', borderRadius: '10px', border: 'none',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontSize: '16px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 28px' }}>

          {/* Connected state */}
          {activeAddress ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)',
                borderRadius: '16px', padding: '16px 18px',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', flexShrink: 0,
                }}>👤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Connected</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#fff', fontFamily: 'monospace', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ellipseAddress(activeAddress)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Algorand TestNet</div>
                </div>
                <a
                  href={`https://lora.algokit.io/testnet/account/${activeAddress}/`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6366f1', textDecoration: 'none', fontSize: '14px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.1)' }}
                  title="View on Lora Explorer"
                >↗</a>
              </div>

              <button
                data-test-id="logout"
                onClick={handleDisconnect}
                style={{
                  width: '100%', padding: '13px', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.25)',
                  background: 'rgba(239,68,68,0.07)', color: '#ef4444',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)' }}
              >
                <span style={{ fontSize: '16px' }}>⏻</span> Disconnect Wallet
              </button>
            </div>
          ) : (
            /* Wallet list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {wallets?.map((wallet) => {
                const isHovered = hoveredWallet === wallet.id
                const isLoading = connecting === wallet.id
                return (
                  <button
                    data-test-id={`${wallet.id}-connect`}
                    key={`provider-${wallet.id}`}
                    onClick={() => handleConnect(wallet)}
                    onMouseEnter={() => setHoveredWallet(wallet.id)}
                    onMouseLeave={() => setHoveredWallet(null)}
                    disabled={!!connecting}
                    style={{
                      width: '100%', padding: '14px 18px', borderRadius: '14px',
                      border: isHovered ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(255,255,255,0.07)',
                      background: isHovered ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                      color: '#fff', cursor: connecting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      transition: 'all 0.18s', opacity: connecting && !isLoading ? 0.5 : 1,
                      transform: isHovered && !connecting ? 'translateY(-1px)' : 'none',
                      boxShadow: isHovered ? '0 8px 24px rgba(99,102,241,0.15)' : 'none',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                      background: isKmd(wallet) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {isKmd(wallet) ? (
                        <span style={{ fontSize: '20px' }}>🔑</span>
                      ) : (
                        <img
                          alt={wallet.metadata.name}
                          src={wallet.metadata.icon}
                          style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                        {isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
                        {isKmd(wallet) ? 'Development only' : 'Algorand Wallet'}
                      </div>
                    </div>

                    {/* Right side */}
                    {isLoading ? (
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: '2px solid rgba(99,102,241,0.3)',
                        borderTopColor: '#6366f1',
                        animation: 'spin 0.7s linear infinite', flexShrink: 0,
                      }} />
                    ) : (
                      <span style={{ fontSize: '18px', color: isHovered ? '#6366f1' : 'rgba(255,255,255,0.2)', transition: 'color 0.18s', flexShrink: 0 }}>→</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!activeAddress && (
          <div style={{
            padding: '14px 28px 22px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
              🔒 Non-custodial · Your keys stay in your wallet
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

export default ConnectWallet
