import { useEffect, useState } from 'react';
import { api, ageFrom } from './api.js';
import { PageHead, Empty, Icon, Avatar, CredentialsNotice } from './ui.jsx';

const EMPTY = { firstName: '', lastName: '', dateOfBirth: '', gender: '', phone: '',
                insuranceProvider: '', insuranceNumber: '', medicalHistory: '' };

export default function Patients({ onOpen, startAdding }) {
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(!!startAdding);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [creds, setCreds] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api('/patients' + (q ? `?q=${encodeURIComponent(q)}` : '')).then(setList).catch((e) => setError(e.message));
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await api('/patients', { method: 'POST', body: { ...form, dateOfBirth: form.dateOfBirth || null } });
      setCreds({ username: result.username, password: result.temporaryPassword });
      setForm(EMPTY); setAdding(false);
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHead title="Patients" sub="Registering a patient also creates their login and a temporary password.">
        <button className="primary" onClick={() => { setAdding(!adding); setError(''); }}>
          {adding ? 'Cancel' : <><Icon name="plus" size={16} /> Register patient</>}
        </button>
      </PageHead>

      {creds && <CredentialsNotice creds={creds} onDismiss={() => setCreds(null)} />}

      {adding && (
        <form className="panel form-grid" onSubmit={save}>
          <h2 className="span-all">New patient</h2>
          <label>First name<input value={form.firstName} onChange={set('firstName')} required autoFocus /></label>
          <label>Last name<input value={form.lastName} onChange={set('lastName')} required /></label>
          <label>Date of birth<input type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={set('dateOfBirth')} /></label>
          <label>Gender
            <select value={form.gender} onChange={set('gender')}>
              <option value="">Not specified</option><option>Female</option><option>Male</option><option>Other</option>
            </select>
          </label>
          <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
          <label>Insurance provider<input value={form.insuranceProvider} onChange={set('insuranceProvider')} /></label>
          <label>Insurance number<input value={form.insuranceNumber} onChange={set('insuranceNumber')} /></label>
          <label className="span-all">Medical history
            <textarea rows="3" value={form.medicalHistory} onChange={set('medicalHistory')} />
          </label>
          {error && <p className="error span-all" role="alert">{error}</p>}
          <div className="span-all"><button className="primary" disabled={busy}>Save patient and create login</button></div>
        </form>
      )}

      <div className="searchbox">
        <Icon name="search" size={17} />
        <input placeholder="Search by first or last name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" />
      </div>
      {!adding && error && <p className="error" role="alert">{error}</p>}

      {list === null ? <p className="muted">Loading patients</p> : list.length === 0 ? (
        <Empty title={q ? 'No patient matches that name' : 'No patients yet'}>
          {q ? 'Check the spelling or search by the other name.' : 'Register a patient to get started.'}
        </Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Patient</th><th>Age</th><th>Gender</th><th>Phone</th><th>Insurance</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="who-cell">
                      <Avatar first={p.firstName} last={p.lastName} size={34} />
                      <button className="link" onClick={() => onOpen(p.id)}>{p.lastName}, {p.firstName}</button>
                    </div>
                  </td>
                  <td>{ageFrom(p.dateOfBirth)}</td><td>{p.gender}</td><td>{p.phone}</td><td>{p.insuranceProvider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
