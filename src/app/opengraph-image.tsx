import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CFP Tracker - Track Conference Speaking Opportunities';
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
          background: 'linear-gradient(to bottom right, #1a202c, #2d3748)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          gap: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '20px',
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
              color: '#a0aec0',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            Track and manage your
          </div>
          <div
            style={{
              fontSize: '36px',
              color: '#a0aec0',
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
            color: '#718096',
            marginTop: '40px',
          }}
        >
          cfp.bendechr.ai
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
