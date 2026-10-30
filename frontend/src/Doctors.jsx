import { useEffect, useState } from 'react';
import { api } from './api.js';
import { PageHead, Empty, Icon, Avatar, Pill, CredentialsNotice } from './ui.jsx';

const EMPTY = { firstName: '', lastName: '', specialty: '' };
const SPECIALTIES = ['General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Orthopedics', 'Gynecology', 'Neurology', 'ENT', 'Psychiatry'];

/** Admin only: add doctors, give them a generated password, reset it, or remove them. */
export default function Doctors() {
  const [list, setList] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [creds, setCreds] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api('/admin/doctors').then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function add(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await api('/admin/doctors', { method: 'POST', body: form });
      setCreds({ title: 'Doctor login created', who: 'doctor', username: r.username, password: r.temporaryPassword });
      setForm(EMPTY); setAdding(false);
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function reset(d) {
    if (!confirm(`Create a new temporary password for ${d.name}? The old one stops working immediately.`)) return;
    try {
      const r = await api(`/admin/doctors/${d.id}/reset-password`, { method: 'POST' });
      setCreds({ title: `New temporary password for ${d.name}`, who: 'doctor', username: r.username, password: r.temporaryPassword });
      setError(''); load();
    } catch (err) { setError(err.message); }
  }

  async function remove(d) {
    if (!confirm(`Remove Dr. ${d.name}?\n\nTheir login stops working straight away. Their waiting and approved appointments are cancelled so patients can book someone else.`)) return;
    try { await api(`/admin/doctors/${d.id}`, { method: 'DELETE' }); setError(''); load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <>
      <PageHead title="Doctors" sub="Patients search this list when they book. Adding a doctor creates their login with a temporary password.">
        <button className="primary" onClick={() => { setAdding(!adding); setError(''); }}>
          {adding ? 'Cancel' : <><Icon name="plus" size={16} /> Add doctor</>}
        </button>
      </PageHead>

      {creds && <CredentialsNotice creds={creds} onDismiss={() => setCreds(null)} />}

      {adding && (
        <form className="panel form-grid" onSubmit={add}>
          <h2 className="span-all">New doctor</h2>
          <label>First name<input value={form.firstName} onChange={set('firstName')} required autoFocus /></label>
          <label>Last name<input value={form.lastName} onChange={set('lastName')} required /></label>
          <label>Specialty
            <input list="specialties" value={form.specialty} onChange={set('specialty')} placeholder="For example: Cardiology" required />
            <datalist id="specialties">{SPECIALTIES.map((s) => <option key={s} value={s} />)}</datalist>
          </label>
          {error && <p className="error span-all" role="alert">{error}</p>}
          <div className="span-all"><button className="primary" disabled={busy}>Create doctor and login</button></div>
        </form>
      )}
      {!adding && error && <p className="error" role="alert">{error}</p>}

      {list === null ? <p className="muted">Loading doctors</p> : list.length === 0 ? (
        <Empty title="No doctors yet">Add a doctor so patients can book appointments.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Doctor</th><th>Specialty</th><th>Username</th><th>Account</th><th></th></tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td><div className="who-cell"><Avatar first={d.name.split(' ')[0]} last={d.name.split(' ').slice(-1)[0]} size={34} /><b>Dr. {d.name}</b></div></td>
                  <td>{d.specialty}</td>
                  <td><code>{d.username}</code></td>
                  <td><Pill status={d.mustChangePassword ? 'REQUESTED' : 'APPROVED'} label={d.mustChangePassword ? 'Temporary password' : 'Active'} /></td>
                  <td>
                    <div className="actions">
                      <button className="sm" onClick={() => reset(d)}><Icon name="key" size={15} /> Reset password</button>
                      <button className="sm danger" onClick={() => remove(d)}><Icon name="trash" size={15} /> Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
