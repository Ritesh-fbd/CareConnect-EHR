import { useEffect, useState } from 'react';
import { api, ageFrom, fmt } from './api.js';
import { Icon, Avatar, Pill, Empty, CredentialsNotice } from './ui.jsx';

const TABS = ['Clinical notes', 'Orders', 'Medications'];

export default function PatientDetail({ id, role, onBack }) {
  const [patient, setPatient] = useState(null);
  const [tab, setTab] = useState(TABS[0]);
  const [error, setError] = useState('');
  const [creds, setCreds] = useState(null);
  const canOrder = role === 'DOCTOR' || role === 'ADMIN';

  useEffect(() => { api(`/patients/${id}`).then(setPatient).catch((e) => setError(e.message)); }, [id]);

  async function remove() {
    if (!confirm('Delete this patient, their record and their login? This cannot be undone.')) return;
    try { await api(`/patients/${id}`, { method: 'DELETE' }); onBack(); } catch (e) { setError(e.message); }
  }

  async function resetPassword() {
    if (!confirm('Create a new temporary password? The old one stops working immediately.')) return;
    try {
      const r = await api(`/patients/${id}/reset-password`, { method: 'POST' });
      setCreds({ title: 'New temporary password', username: r.username, password: r.temporaryPassword });
      setError('');
    } catch (e) { setError(e.message); }
  }

  if (!patient) return <p className={error ? 'error' : 'muted'}>{error || 'Loading patient'}</p>;
  const age = ageFrom(patient.dateOfBirth);

  return (
    <>
      <button className="link back" onClick={onBack}><Icon name="back" size={16} /> Back</button>

      <section className="patient-head">
        <Avatar first={patient.firstName} last={patient.lastName} size={64} />
        <div className="grow">
          <h1>{patient.firstName} {patient.lastName}</h1>
          <p className="muted">{[age !== '' && `${age} years`, patient.gender, patient.phone].filter(Boolean).join(', ') || 'No details recorded'}</p>
        </div>
        <div className="actions">
          <button onClick={resetPassword}><Icon name="key" size={16} /> Reset login password</button>
          {role === 'ADMIN' && <button className="danger" onClick={remove}><Icon name="trash" size={16} /> Delete</button>}
        </div>
        <dl className="facts">
          <dt>Insurance</dt><dd>{[patient.insuranceProvider, patient.insuranceNumber].filter(Boolean).join(', ') || 'None on file'}</dd>
          <dt>History</dt><dd>{patient.medicalHistory || 'None recorded'}</dd>
        </dl>
      </section>

      {creds && <CredentialsNotice creds={creds} onDismiss={() => setCreds(null)} />}
      {error && <p className="error" role="alert">{error}</p>}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Clinical notes' && <Notes pid={id} />}
      {tab === 'Orders' && <Orders pid={id} canOrder={canOrder} />}
      {tab === 'Medications' && <Medications pid={id} canPrescribe={canOrder} />}
    </>
  );
}

function useList(path) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const reload = () => api(path).then(setItems).catch((e) => setError(e.message));
  useEffect(() => { reload(); }, [path]);
  return { items, error, setError, reload };
}

const NOTE_LABEL = { PROGRESS: 'Progress note', ASSESSMENT: 'Assessment', TREATMENT_PLAN: 'Treatment plan' };

function Notes({ pid }) {
  const { items, error, setError, reload } = useList(`/patients/${pid}/notes`);
  const [type, setType] = useState('PROGRESS');
  const [content, setContent] = useState('');

  async function add(e) {
    e.preventDefault();
    try {
      await api(`/patients/${pid}/notes`, { method: 'POST', body: { type, content } });
      setContent(''); setError(''); reload();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <form className="panel" onSubmit={add}>
        <div className="row">
          <label>Note type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(NOTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        <label>Note<textarea rows="4" value={content} onChange={(e) => setContent(e.target.value)} required /></label>
        <div><button className="primary">Save note</button></div>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {items && items.length === 0 && <Empty title="No notes yet">Add the first progress note above.</Empty>}
      <div className="timeline">
        {(items || []).map((n) => (
          <article key={n.id}>
            <header><strong>{NOTE_LABEL[n.type] || n.type}</strong><span className="muted small">{n.author}, {fmt(n.createdAt)}</span></header>
            <p>{n.content}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function Orders({ pid, canOrder }) {
  const { items, error, setError, reload } = useList(`/patients/${pid}/orders`);
  const [category, setCategory] = useState('LAB');
  const [name, setName] = useState('');

  async function add(e) {
    e.preventDefault();
    try {
      await api(`/patients/${pid}/orders`, { method: 'POST', body: { category, name } });
      setName(''); setError(''); reload();
    } catch (err) { setError(err.message); }
  }

  async function update(o, status) {
    let result;
    if (status === 'COMPLETED') {
      result = prompt('Enter the result (optional):', o.result || '');
      if (result === null) return;
    }
    try {
      await api(`/patients/${pid}/orders/${o.id}`, { method: 'PATCH', body: { status, ...(result !== undefined && { result }) } });
      reload();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      {canOrder ? (
        <form className="panel row" onSubmit={add}>
          <label>Type
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="LAB">Lab test</option><option value="IMAGING">Imaging study</option>
            </select>
          </label>
          <label className="grow">Test or study
            <input placeholder="For example: Complete blood count, Chest X-ray" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <button className="primary">Place order</button>
        </form>
      ) : <p className="muted">Only doctors and admins can place orders. You can still enter results below.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {items && items.length === 0 ? <Empty title="No orders yet" /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Status</th><th>Result</th><th>Ordered by</th><th></th></tr></thead>
            <tbody>
              {(items || []).map((o) => (
                <tr key={o.id}>
                  <td>{o.name}<div className="muted small">{o.category === 'LAB' ? 'Lab test' : 'Imaging'}, {fmt(o.createdAt)}</div></td>
                  <td><Pill status={o.status} /></td>
                  <td>{o.result}</td><td>{o.orderedBy}</td>
                  <td>
                    {o.status === 'ORDERED' && (
                      <div className="actions">
                        <button className="sm" onClick={() => update(o, 'COMPLETED')}>Enter result</button>
                        <button className="sm" onClick={() => update(o, 'CANCELLED')}>Cancel</button>
                      </div>
                    )}
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

function Medications({ pid, canPrescribe }) {
  const { items, error, setError, reload } = useList(`/patients/${pid}/medications`);
  const [f, setF] = useState({ drugName: '', dosage: '', frequency: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function add(e) {
    e.preventDefault();
    try {
      await api(`/patients/${pid}/medications`, { method: 'POST', body: f });
      setF({ drugName: '', dosage: '', frequency: '' }); setError(''); reload();
    } catch (err) { setError(err.message); }
  }

  async function toggle(rx) {
    try { await api(`/patients/${pid}/medications/${rx.id}`, { method: 'PATCH', body: { active: !rx.active } }); reload(); }
    catch (err) { setError(err.message); }
  }

  return (
    <>
      {canPrescribe ? (
        <form className="panel row" onSubmit={add}>
          <label className="grow">Medication<input value={f.drugName} onChange={set('drugName')} required /></label>
          <label>Dosage<input placeholder="For example: 500 mg" value={f.dosage} onChange={set('dosage')} required /></label>
          <label>Frequency<input placeholder="For example: twice daily" value={f.frequency} onChange={set('frequency')} required /></label>
          <button className="primary">Prescribe</button>
        </form>
      ) : <p className="muted">Only doctors and admins can prescribe. You can view the medication list below.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {items && items.length === 0 ? <Empty title="No medications on this record" /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Status</th><th>Prescribed by</th><th></th></tr></thead>
            <tbody>
              {(items || []).map((rx) => (
                <tr key={rx.id} className={rx.active ? '' : 'inactive'}>
                  <td>{rx.drugName}</td><td>{rx.dosage}</td><td>{rx.frequency}</td>
                  <td><Pill status={rx.active ? 'COMPLETED' : 'CANCELLED'} label={rx.active ? 'Active' : 'Discontinued'} /></td>
                  <td>{rx.prescribedBy}<div className="muted small">{fmt(rx.createdAt)}</div></td>
                  <td>{canPrescribe && <button className="sm" onClick={() => toggle(rx)}>{rx.active ? 'Discontinue' : 'Resume'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
