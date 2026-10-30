import { useEffect, useState } from 'react';
import { api, greeting, fmtDay, fmtTime, dr } from './api.js';
import { PageHead, Empty, Icon, Avatar } from './ui.jsx';
import { DecisionButtons } from './Appointments.jsx';

export default function Dashboard({ session, canApprove, appts, onOpenPatient, onRegister, onGo }) {
  const [patients, setPatients] = useState(null);
  useEffect(() => { api('/patients').then(setPatients).catch(() => setPatients([])); }, []);

  const items = appts.items || [];
  const waiting = items.filter((a) => a.status === 'REQUESTED');
  const upcoming = items.filter((a) => a.status === 'APPROVED' && new Date(a.appointmentAt) > new Date());
  const recent = (patients || []).slice().sort((x, y) => y.id - x.id).slice(0, 5);

  return (
    <>
      <PageHead title={`${greeting()}, ${session.username}`} sub="Here is what needs attention today.">
        <button className="primary" onClick={onRegister}><Icon name="plus" size={16} /> Register patient</button>
      </PageHead>

      <section className="stats">
        <div><b>{patients ? patients.length : '-'}</b><span>Patients on record</span></div>
        {canApprove && <div className={waiting.length ? 'alert' : ''}><b>{waiting.length}</b><span>Requests waiting for approval</span></div>}
        {canApprove && <div><b>{upcoming.length}</b><span>Approved visits ahead</span></div>}
      </section>

      {canApprove && (
        <section className="block-section">
          <div className="section-head">
            <h2>Waiting for your approval</h2>
            <button className="link" onClick={() => onGo('appointments')}>See all appointments</button>
          </div>
          {appts.error && <p className="error">{appts.error}</p>}
          {waiting.length === 0 ? (
            <Empty title="You are all caught up">Requests from patients appear here as soon as they are sent.</Empty>
          ) : (
            <ul className="rows">
              {waiting.slice(0, 6).map((a) => (
                <li key={a.id}>
                  <div className="when"><b>{fmtDay(a.appointmentAt)}</b><span>{fmtTime(a.appointmentAt)}</span></div>
                  <div className="grow">
                    <button className="link" onClick={() => onOpenPatient(a.patientId)}>{a.patientName}</button>
                    <div className="muted small">{a.reason || 'No reason given'}{session.role === 'ADMIN' && `, with ${dr(a.doctorName)}`}</div>
                  </div>
                  <DecisionButtons a={a} busyId={appts.busyId} decide={appts.decide} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {canApprove && upcoming.length > 0 && (
        <section className="block-section">
          <div className="section-head"><h2>Coming up</h2></div>
          <ul className="rows">
            {upcoming.slice(0, 5).map((a) => (
              <li key={a.id}>
                <div className="when"><b>{fmtDay(a.appointmentAt)}</b><span>{fmtTime(a.appointmentAt)}</span></div>
                <div className="grow">
                  <button className="link" onClick={() => onOpenPatient(a.patientId)}>{a.patientName}</button>
                  <div className="muted small">{a.reason || 'No reason given'}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="block-section">
        <div className="section-head">
          <h2>Recently registered</h2>
          <button className="link" onClick={() => onGo('patients')}>All patients</button>
        </div>
        {recent.length === 0 ? <Empty title="No patients yet">Register the first patient to get started.</Empty> : (
          <ul className="rows">
            {recent.map((p) => (
              <li key={p.id}>
                <Avatar first={p.firstName} last={p.lastName} />
                <div className="grow">
                  <button className="link" onClick={() => onOpenPatient(p.id)}>{p.firstName} {p.lastName}</button>
                  <div className="muted small">{[p.gender, p.phone].filter(Boolean).join(', ') || 'No contact details'}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
