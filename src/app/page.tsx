export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
      <h1>Client Relationship Insights</h1>
      <p>✅ Production deployment successful. Backend routes are live.</p>
      
      <h2>Application Links</h2>
      <ul>
        <li><a href="/dashboard" style={{ color: '#0066cc' }}>📊 Dashboard (Main App)</a></li>
        <li><a href="/api/auth/signin" style={{ color: '#0066cc' }}>🔐 Sign in with Google</a></li>
        <li><a href="/api/health" style={{ color: '#0066cc' }}>🏥 Health Check</a></li>
      </ul>
      
      <h2>API Endpoints</h2>
      <ul>
        <li><code>/api/sync-emails</code> (POST)</li>
        <li><code>/api/generate-insights</code> (POST)</li>
        <li><code>/api/insights</code> (GET)</li>
        <li><code>/api/feedback</code> (POST)</li>
      </ul>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <strong>Status:</strong> Production-ready deployment with secure environment configuration.
      </div>
    </div>
  )
}