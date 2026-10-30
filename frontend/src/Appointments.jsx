import { useCallback, useEffect, useState } from 'react';
import { api, fmtDay, fmtTime, fmt, dr } from './api.js';
import { Pill, PageHead, Empty, Icon } from './ui.jsx';

/** Loads every appointment request and lets a doctor or admin approve or decline one. */
export function useAppointments(enabled) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => api('/appointments').then((d) => { setItems(d); setError(''); }).catch((e) => setError(e.message)), []);
  useEffect(() => { if (enabled) load(); }, [enabled, load]);

  async function decide(id, status) {
    setBusyId(id); setError('');
    try { await api(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }); }
    catch (e) { setError(e.message); }
    finally { await load(); setBusyId(null); }
  }
  return { items, error, busyId, decide, reload: load };
}

export function DecisionButtons({ a, busyId, decide }) {
  if (a.status !== 'REQUESTED') {
    return <span className="muted small">{a.decidedBy ? `By ${a.decidedBy}, ${fmt(a.decidedAt)}` : ''}</span>;
  }
  return (
    <div className="actions">
      <button className="primary sm" disabled={busyId === a.id} onClick={() => decide(a.id, 'APPROVED')}><Icon name="check" size={15} /> Approve</button>
      <button className="sm" disabled={busyId === a.id} onClick={() => decide(a.id, 'REJECTED')}><Icon name="x" size={15} /> Decline</button>
    </div>
  );
}

const TABS = [
  ['REQUESTED', 'Waiting'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Declined'],
  ['ALL', 'All'],
];

export default function Appointments({ appts, onOpenPatient, showDoctor }) {
  const [tab, setTab] = useState('REQUESTED');
  const { items, error, busyId, decide, reload } = appts;
  const count = (k) => (items || []).filter((a) => k === 'ALL' || a.status === k).length;
  const shown = (items || []).filter((a) => tab === 'ALL' || a.status === tab);

  return (
    <>
      <PageHead title="Appointments" sub={showDoctor ? 'All requests. Each one is approved by the doctor the patient chose, or by an admin.' : 'Requests booked with you. Approve or decline them and the patient sees the answer straight away.'}>
        <button onClick={reload}>Refresh</button>
      </PageHead>

      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label} <span className="count">{count(k)}</span>
          </button>
        ))}
      </div>
      {error && <p className="error" role="alert">{error}</p>}

      {items === null && !error ? <p className="muted">Loading appointments</p> : shown.length === 0 ? (
        <Empty title={tab === 'REQUESTED' ? 'Nothing is waiting for approval' : 'No appointments here'}>
          {tab === 'REQUESTED' ? 'New requests from patients appear here as soon as they are sent.' : 'Try another tab.'}
        </Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Patient</th>{showDoctor && <th>Doctor</th>}<th>When</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id}>
                  <td><button className="link" onClick={() => onOpenPatient(a.patientId)}>{a.patientName}</button></td>
                  {showDoctor && <td>{dr(a.doctorName)}</td>}
                  <td>{fmtDay(a.appointmentAt)}<div className="muted small">{fmtTime(a.appointmentAt)}</div></td>
                  <td>{a.reason || <span className="muted">Not given</span>}</td>
                  <td><Pill status={a.status} /></td>
                  <td><DecisionButtons a={a} busyId={busyId} decide={decide} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
