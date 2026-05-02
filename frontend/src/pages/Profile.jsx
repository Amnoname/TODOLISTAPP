import { useStore } from '../store';

export default function Profile() {
  const user = useStore((state) => state.user);

  return (
    <div className="container">
      <div className="card">
        <h1>Profile</h1>
        <p className="eyebrow">Your account details</p>

        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem', maxWidth: '480px' }}>
          <div>
            <strong>Username</strong>
            <p>{user?.username || '—'}</p>
          </div>
          <div>
            <strong>Email</strong>
            <p>{user?.email || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
