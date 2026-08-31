import { ImageResponse } from 'next/og'

export const alt = 'Ethogram — Behavioral Testing for TypeScript AI Agents'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0E1110',
          color: '#F5F2EC',
          padding: '68px 76px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg height="64" viewBox="0 0 64 64" width="64">
            <path
              d="M32 10L49.3 22L39.8 36.5L32 51L18.1 40L13.8 21.5Z"
              fill="none"
              stroke="#F5F2EC"
              strokeWidth="3"
            />
          </svg>
          <span style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.04em' }}>ethogram</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 950 }}>
          <span
            style={{
              marginBottom: 26,
              color: '#6EDB91',
              fontFamily: 'monospace',
              fontSize: 17,
              letterSpacing: '0.13em',
            }}
          >
            BEHAVIORAL TESTING FOR TYPESCRIPT AI AGENTS
          </span>
          <span style={{ fontSize: 72, fontWeight: 600, letterSpacing: '-0.055em', lineHeight: 0.98 }}>
            Change the agent. Keep the behavior that matters.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(245,242,236,.24)',
            paddingTop: 24,
            color: 'rgba(245,242,236,.58)',
            fontFamily: 'monospace',
            fontSize: 15,
          }}
        >
          <span>EXPECTED → OBSERVED → RESULT</span>
          <span>ethogram.dev</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
