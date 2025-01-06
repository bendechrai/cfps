import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Ben\'s CFP Tracker - Track Conference Speaking Opportunities';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            right: '-100px',
            top: '-100px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        
        {/* Decorative crosses pattern */}
        <div
          style={{
            position: 'absolute',
            left: '40px',
            top: '40px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            width: '300px',
            opacity: 0.2,
          }}
        >
          {Array(18).fill('×').map((_, i) => (
            <div
              key={i}
              style={{
                color: 'white',
                fontSize: '24px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
            }}
          >
            Ben&apos;s CFP Tracker
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                color: '#93c5fd',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              Track and manage your
            </div>
            <div
              style={{
                fontSize: '36px',
                color: '#93c5fd',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              conference speaking opportunities
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              color: '#bfdbfe',
              marginTop: '20px',
            }}
          >
            cfp.bendechr.ai
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
