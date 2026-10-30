import { useState } from 'react';

const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  record: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M20 6L9 17l-5-5" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  key: <><circle cx="8" cy="15" r="4" /><path d="M10.85 12.15L19 4M18 5l3 3M15 8l3 3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />,
  pill: <><path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l10-10a4.95 4.95 0 0 1 7 7z" /><path d="M8.5 8.5l7 7" /></>,
  flask: <><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3" /><path d="M7.5 15h9" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>,
  doctor: <><path d="M6 3v6a4 4 0 0 0 8 0V3" /><path d="M4 3h4M12 3h4" /><path d="M10 13v2a5 5 0 0 0 10 0v-1" /><circle cx="20" cy="12" r="2" /></>,
};

export function Icon({ name, size = 18 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** The heartbeat line is the identity of the product. */
export function Logo({ light }) {
  return (
    <span className={'logo' + (light ? ' light' : '')}>
      <svg viewBox="0 0 40 20" width="34" height="17" aria-hidden="true">
        <path d="M1 11h8l3-8 5 15 4-10 2 3h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>CareConnect</span>
    </span>
  );
}

export const STATUS_LABEL = {
  REQUESTED: 'Waiting for approval', APPROVED: 'Approved', REJECTED: 'Declined', CANCELLED: 'Cancelled',
  ORDERED: 'Ordered', COMPLETED: 'Completed',
};

export function Pill({ status, label }) {
  return <span className={'pill s-' + String(status).toLowerCase()}>{label || STATUS_LABEL[status] || status}</span>;
}

export function PageHead({ title, sub, children }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Calendar-leaf date block: weekday, big day number, month. */
export function DateChip({ iso, dark }) {
  const d = new Date(iso);
  return (
    <span className={'datechip' + (dark ? ' dark' : '')} aria-hidden="true">
      <i>{d.toLocaleDateString([], { weekday: 'short' })}</i>
      <b>{d.getDate()}</b>
      <em>{d.toLocaleDateString([], { month: 'short' })}</em>
    </span>
  );
}

export function Avatar({ first, last, size = 40 }) {
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>{(first?.[0] || '') + (last?.[0] || '')}</span>;
}

/** Shows a generated login once. Used after staff register a patient and after a password reset. */
export function CredentialsNotice({ creds, onDismiss }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const text = `Username: ${creds.username}\nTemporary password: ${creds.password}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  }
  return (
    <section className="credentials" role="status">
      <div>
        <h2>{creds.title || 'Patient login created'}</h2>
        <p>Give these to the {creds.who || 'patient'} now. The password is shown only once, and they must choose a new one the first time they sign in.</p>
        <dl>
          <dt>Username</dt><dd>{creds.username}</dd>
          <dt>Temporary password</dt><dd>{creds.password}</dd>
        </dl>
      </div>
      <div className="credentials-actions">
        <button onClick={copy}><Icon name="copy" size={16} /> {copied ? 'Copied' : 'Copy login'}</button>
        <button onClick={onDismiss}>Done</button>
      </div>
    </section>
  );
}
