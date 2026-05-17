import { useEffect, useMemo, useState } from 'react';

export default function GoogleCallback() {
  const [status, setStatus] = useState('Completing sign in...');

  const code = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
  }, []);

  useEffect(() => {
    try {
      if (!code) {
        setStatus('Missing code. Please try again.');
        return;
      }

      // Send the code back to the opener window
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ code }, window.location.origin);
      }

      setStatus('Signed in! You can close this window.');

      // Close the popup after a short delay
      setTimeout(() => {
        try {
          window.close();
        } catch {
          // ignore
        }
      }, 300);
    } catch (e) {
      setStatus('Sign-in failed. Please close and try again.');
    }
  }, [code]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      padding: 16
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{status}</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          If this window doesn\'t close automatically, you may close it manually.
        </div>
      </div>
    </div>
  );
}

