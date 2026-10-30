import { useState } from 'react';
import { api, setSession, getSession } from './api.js';
import { Logo } from './ui.jsx';

export function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ username: '', password: '', firstName: '', lastName: '', dateOfBirth: '', gender: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const body = registering ? { ...f, dateOfBirth: f.dateOfBirth || null } : { username: f.username, password: f.password };
      const session = await api(registering ? '/auth/register' : '/auth/login', { method: 'POST', body });
      setSession(session);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <main className="auth">
      <section className="auth-hero" aria-hidden="false">
        <Logo light />
        <div className="auth-copy">
          <h1>Care that keeps pace with you.</h1>
          <p>Book visits, see your results and keep your health record in one secure place. Clinicians get the whole picture at the point of care.</p>
        </div>
        <svg className="pulse-line" viewBox="0 0 900 120" preserveAspectRatio="none" aria-hidden="true">
          <path pathLength="1" d="M0 70h180l24-6 18 6h60l22-52 34 100 30-78 20 30h60l24-6 18 6h120l22-52 34 100 30-78 20 30h140" />
        </svg>
      </section>

      <section className="auth-panel">
        <form onSubmit={submit} className="auth-form">
          <div className="seg" role="tablist" aria-label="Account">
            <button type="button" role="tab" aria-selected={!registering} className={!registering ? 'on' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={registering} className={registering ? 'on' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
          </div>

          <h2>{registering ? 'Create your patient account' : 'Welcome back'}</h2>
          <p className="muted">
            {registering
              ? 'We create your health record and your login together.'
              : 'Patients and clinical staff sign in here.'}
          </p>

          {registering && (
            <div className="grid-2">
              <label>First name<input value={f.firstName} onChange={set('firstName')} autoComplete="given-name" required /></label>
              <label>Last name<input value={f.lastName} onChange={set('lastName')} autoComplete="family-name" required /></label>
              <label>Date of birth<input type="date" max={new Date().toISOString().slice(0, 10)} value={f.dateOfBirth} onChange={set('dateOfBirth')} /></label>
              <label>Gender
                <select value={f.gender} onChange={set('gender')}>
                  <option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option>
                </select>
              </label>
              <label className="span-2">Phone<input value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
            </div>
          )}

          <label>Username
            <input value={f.username} onChange={set('username')} autoComplete="username" required
                   pattern={registering ? '[A-Za-z0-9._\\-]{3,30}' : undefined}
                   title={registering ? '3 to 30 letters, numbers, dots, dashes or underscores' : undefined} />
          </label>
          <label>Password
            <input type="password" value={f.password} onChange={set('password')} required
                   autoComplete={registering ? 'new-password' : 'current-password'}
                   minLength={registering ? 8 : undefined} />
            {registering && <span className="hint">At least 8 characters.</span>}
          </label>

          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary block" disabled={busy}>{busy ? 'Please wait' : registering ? 'Create account' : 'Sign in'}</button>

          <p className="muted small note">
            {registering
              ? 'Already registered at the clinic? Choose Sign in and use the username and temporary password the front desk gave you.'
              : 'Registered at the clinic? Use the temporary password you were given. You will choose a new one after signing in.'}
          </p>
          {!registering && (
            <p className="demo small">
              Demo accounts: <code>doctor / doctor123</code>, <code>nurse / nurse123</code>, <code>admin / admin123</code>, <code>patient / patient123</code>
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

/** Used for the forced change after a temporary password, and from the account menu. */
export function ChangePasswordDialog({ forced, onDone, onCancel }) {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (newPassword !== confirm) { setError('The two new passwords do not match'); return; }
    setBusy(true); setError('');
    try {
      await api('/account/password', { method: 'POST', body: { currentPassword, newPassword } });
      const s = getSession();
      if (s) setSession({ ...s, mustChangePassword: false });
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="overlay">
      <form className="dialog" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pw-title">
        <h2 id="pw-title">{forced ? 'Choose your own password' : 'Change password'}</h2>
        <p className="muted">
          {forced
            ? 'You signed in with a temporary password. Pick a new one that only you know before you continue.'
            : 'Enter your current password, then choose a new one.'}
        </p>
        <label>{forced ? 'Temporary password' : 'Current password'}
          <input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" autoFocus required />
        </label>
        <label>New password
          <input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} minLength={8} autoComplete="new-password" required />
          <span className="hint">At least 8 characters.</span>
        </label>
        <label>Repeat new password
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="dialog-actions">
          {!forced && <button type="button" onClick={onCancel}>Cancel</button>}
          <button className="primary" disabled={busy}>Save password</button>
        </div>
      </form>
    </div>
  );
}
