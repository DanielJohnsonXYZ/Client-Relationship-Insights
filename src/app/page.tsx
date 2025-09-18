export default function Home() {
  return (
    <main style={{ padding: 32, lineHeight: 1.6 }}>
      <h1>Client Relationship Insights</h1>
      <p>Welcome. Backend routes are deployed. Use the links below to test.</p>
      <ul>
        <li><a href="/dashboard">📊 Dashboard (Main App)</a></li>
        <li><a href="/api/auth/signin">🔐 Sign in with Google</a></li>
        <li><a href="/api/health">🏥 Health Check</a></li>
      </ul>
      <h2>API Endpoints (for testing)</h2>
      <ul>
        <li><code>/api/sync-emails</code> (POST from app)</li>
        <li><code>/api/generate-insights</code> (POST from app)</li>
        <li><code>/api/insights</code> (GET)</li>
        <li><code>/api/feedback</code> (POST)</li>
      </ul>
      <p>
        <strong>Note:</strong> This is a production-ready backend deployment. 
        The frontend dashboard is available at <code>/dashboard</code> after authentication.
      </p>
    </main>
  )
}