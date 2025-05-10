import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'MED1 - Be the TOP1';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}>
            <div
              style={{
                fontSize: 70,
                background: '#0070df',
                width: 120,
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 24,
                marginRight: 20,
                position: 'relative',
              }}
            >
              <div style={{ 
                width: '60%', 
                height: '10%', 
                background: 'white',
                position: 'absolute' 
              }}></div>
              <div style={{ 
                width: '10%', 
                height: '60%', 
                background: 'white',
                position: 'absolute' 
              }}></div>
            </div>
            <div style={{ fontWeight: 700, color: '#0070df' }}>MED1</div>
          </div>
          <div style={{ color: '#333', fontSize: 60 }}>Be the TOP1</div>
          <div style={{ color: '#666', fontSize: 32, marginTop: 30 }}>
            The platform that helps doctors reach the top of their profession
          </div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse width and height.
      ...size,
    }
  );
} 