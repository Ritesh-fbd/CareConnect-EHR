import { useEffect, useState } from 'react';
import { api, fmt, fmtDay, fmtTime, greeting, ageFrom, dr, dateValue } from './api.js';
import { Pill, PageHead, Empty, Icon, DateChip, Avatar } from './ui.jsx';

const TABS = [
  ['overview', 'Overview', 'home'],
  ['book', 'Book a visit', 'plus'],
  ['appointments', 'My appointments', 'calendar'],
  ['record', 'My record', 'record'],
];

const STATUS_TEXT = (a) => ({
  REQUESTED: `Waiting for ${dr(a.doctorName)} to approve this time.`,
  APPROVED: `Approved. ${dr(a.doctorName)} will see you then.`,
  REJECTED: 'This time was not approved. Please book another slot.',
  CANCELLED: 'This appointment was cancelled.',
}[a.status] || '');

export default function PatientPortal() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');

  const load = () => api('/portal/me').then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  if (!data) return <p className={error ? 'error' : 'muted'}>{error || 'Loading your record'}</p>;

  return (
    <>
      <nav className="portal-tabs" aria-label="Sections">
        {TABS.map(([k, label, icon]) => (
          <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
            <Icon name={icon} size={17} /> {label}
          </button>
        ))}
      </nav>
      {error && <p className="error" role="alert">{error}</p>}
      {tab === 'overview' && <Overview data={data} go={setTab} />}
      {tab === 'book' && <Booking onBooked={load} go={setTab} />}
      {tab === 'appointments' && <MyAppointments data={data} reload={load} go={setTab} />}
      {tab === 'record' && <Record data={data} />}
    </>
  );
}

/* ---------------------------------------------------------------- Overview */

function Overview({ data, go }) {
  const p = data.patient;
  const now = new Date();
  const future = data.appointments.filter((a) => new Date(a.appointmentAt) > now);
  const upcoming = future.filter((a) => a.status === 'APPROVED');
  const waiting = future.filter((a) => a.status === 'REQUESTED');
  const next = upcoming[0];
  const activeMeds = data.medications.filter((m) => m.active);
  const results = data.orders.filter((o) => o.status === 'COMPLETED');
  const latest = data.notes[0];
  const age = ageFrom(p.dateOfBirth);

  return (
    <>
      <section className="p-hero">
        <div className="p-hello">
          <h1>{greeting()}, {p.firstName}</h1>
          <p>
            {waiting.length > 0
              ? `${waiting.length} request${waiting.length > 1 ? 's are' : ' is'} waiting for a doctor to approve.`
              : next ? 'You have a visit coming up. Here are the details.' : 'Find a doctor and pick a time that suits you.'}
          </p>
          <div className="actions">
            <button className="primary light" onClick={() => go('book')}><Icon name="plus" size={16} /> Book a visit</button>
            <button className="ghost" onClick={() => go('record')}>View my record</button>
          </div>
        </div>

        <div className="p-next">
          {next ? (
            <>
              <DateChip iso={next.appointmentAt} />
              <div className="grow">
                <span className="tag">Next visit</span>
                <h2>{dr(next.doctorName)}</h2>
                <p>{fmtTime(next.appointmentAt)}{next.reason ? `, ${next.reason}` : ''}</p>
                <Pill status="APPROVED" />
              </div>
            </>
          ) : (
            <div className="grow">
              <span className="tag">Next visit</span>
              <h2>Nothing booked yet</h2>
              <p>Search for a doctor and choose a 30-minute slot.</p>
            </div>
          )}
        </div>
      </section>

      <section className="p-metrics">
        <div><span className="ic"><Icon name="calendar" /></span><b>{upcoming.length}</b><small>Approved visits</small></div>
        <div><span className="ic warn"><Icon name="clock" /></span><b>{waiting.length}</b><small>Waiting for approval</small></div>
        <div><span className="ic"><Icon name="pill" /></span><b>{activeMeds.length}</b><small>Active medicines</small></div>
        <div><span className="ic"><Icon name="flask" /></span><b>{results.length}</b><small>Results ready</small></div>
      </section>

      <div className="p-grid">
        <div>
          <div className="section-head"><h2>Your appointments</h2><button className="link" onClick={() => go('appointments')}>See all</button></div>
          {future.length === 0 ? (
            <Empty title="No upcoming appointments">Book a visit and it will appear here.</Empty>
          ) : (
            <ul className="rows">
              {future.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <DateChip iso={a.appointmentAt} />
                  <div className="grow">
                    <b>{dr(a.doctorName)}</b>
                    <div className="muted small">{fmtTime(a.appointmentAt)}{a.reason ? `, ${a.reason}` : ''}</div>
                  </div>
                  <Pill status={a.status} />
                </li>
              ))}
            </ul>
          )}

          <div className="section-head gap-top"><h2>Recent results</h2></div>
          {results.length === 0 ? <p className="muted">No results yet. They appear here when your doctor enters them.</p> : (
            <ul className="rows">
              {results.slice(0, 3).map((o) => (
                <li key={o.id}>
                  <span className="ic"><Icon name="flask" /></span>
                  <div className="grow"><b>{o.name}</b><div className="muted small">{o.result || 'Completed'}</div></div>
                  <span className="muted small">{fmt(o.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside>
          <section className="panel">
            <h2>Medicines</h2>
            {activeMeds.length === 0 ? <p className="muted">No active medicines.</p> : (
              <ul className="plain meds">
                {activeMeds.map((m) => (
                  <li key={m.id}><Icon name="pill" size={16} /><span><b>{m.drugName}</b><br /><span className="muted small">{m.dosage}, {m.frequency}</span></span></li>
                ))}
              </ul>
            )}
          </section>
          <section className="panel">
            <h2>Your details</h2>
            <dl className="facts compact">
              <dt>Age</dt><dd>{age !== '' ? `${age} years` : 'Not given'}</dd>
              <dt>Phone</dt><dd>{p.phone || 'Not given'}</dd>
              <dt>Insurance</dt><dd>{[p.insuranceProvider, p.insuranceNumber].filter(Boolean).join(', ') || 'None on file'}</dd>
            </dl>
          </section>
          {latest && (
            <section className="panel">
              <h2>Latest note</h2>
              <p>{latest.content}</p>
              <p className="muted small">{latest.author}, {fmt(latest.createdAt)}</p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Booking */

function Booking({ onBooked, go }) {
  const [q, setQ] = useState('');
  const [doctors, setDoctors] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  // Step 1: doctor search (by name or specialty)
  useEffect(() => {
    const t = setTimeout(() => {
      api('/doctors' + (q ? `?q=${encodeURIComponent(q)}` : '')).then(setDoctors).catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  // Step 3: slots for the chosen doctor and day
  const loadSlots = () => {
    if (!doctor || !date) { setSlots(null); return Promise.resolve(); }
    return api(`/portal/doctors/${doctor.id}/slots?date=${date}`).then((s) => { setSlots(s); setError(''); }).catch((e) => { setSlots(null); setError(e.message); });
  };
  useEffect(() => { setTime(''); loadSlots(); }, [doctor, date]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setDone(null);
    try {
      const a = await api('/portal/appointments', { method: 'POST', body: { doctorId: doctor.id, date, time, reason } });
      setDone(a); setTime(''); setReason('');
      onBooked();
      await loadSlots();
    } catch (err) { setError(err.message); await loadSlots(); setTime(''); } finally { setBusy(false); }
  }

  const morning = (slots || []).filter((s) => s.time < '12:00');
  const afternoon = (slots || []).filter((s) => s.time >= '12:00');
  const freeCount = (slots || []).filter((s) => s.available).length;
  const chosen = slots && time ? slots.find((s) => s.time === time) : null;

  const SlotGroup = ({ title, items }) => items.length === 0 ? null : (
    <div className="slot-group">
      <h3>{title}</h3>
      <div className="slot-grid">
        {items.map((s) => (
          <button type="button" key={s.time} className={'slot' + (time === s.time ? ' on' : '')}
                  disabled={!s.available} aria-pressed={time === s.time}
                  title={s.available ? undefined : 'Already booked or in the past'}
                  onClick={() => setTime(s.time)}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <PageHead title="Book a visit" sub="Find your doctor, choose a day, then pick a 30-minute slot. The doctor confirms your request." />

      <form className="steps" onSubmit={submit}>
        <section className="step">
          <h2><span>1</span> Find a doctor</h2>
          <div className="searchbox">
            <Icon name="search" size={17} />
            <input placeholder="Search by doctor name or specialty" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search doctors" />
          </div>
          {doctors === null ? <p className="muted">Loading doctors</p> : doctors.length === 0 ? (
            <Empty title="No doctor matches that search">Try a different name or a specialty such as Cardiology.</Empty>
          ) : (
            <div className="doc-list">
              {doctors.map((d) => (
                <button type="button" key={d.id} className={'doc-card' + (doctor?.id === d.id ? ' on' : '')} aria-pressed={doctor?.id === d.id} onClick={() => setDoctor(d)}>
                  <Avatar first={d.name.split(' ')[0]} last={d.name.split(' ').slice(-1)[0]} size={44} />
                  <span><b>{dr(d.name)}</b><br /><span className="muted small">{d.specialty || 'Doctor'}</span></span>
                  {doctor?.id === d.id && <Icon name="check" />}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={'step' + (doctor ? '' : ' locked')}>
          <h2><span>2</span> Choose a day</h2>
          <label className="date-field">Date
            <input type="date" min={dateValue(0)} max={dateValue(60)} value={date} disabled={!doctor} onChange={(e) => setDate(e.target.value)} />
          </label>
          {!doctor && <p className="muted small">Choose a doctor first.</p>}
        </section>

        <section className={'step' + (doctor && date ? '' : ' locked')}>
          <h2><span>3</span> Pick a time</h2>
          {!doctor || !date ? <p className="muted small">Choose a doctor and a day to see the free slots.</p> : slots === null ? <p className="muted">Loading slots</p> : (
            <>
              <p className="muted small">{freeCount === 0 ? 'No free slots on this day. Try another date.' : `${freeCount} of ${slots.length} slots are free. Greyed slots are taken.`}</p>
              <SlotGroup title="Morning" items={morning} />
              <SlotGroup title="Afternoon" items={afternoon} />
            </>
          )}
        </section>

        <section className={'step' + (time ? '' : ' locked')}>
          <h2><span>4</span> Confirm</h2>
          <label>Reason for the visit
            <input value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="Optional" disabled={!time} />
          </label>
          {chosen && <p className="summary"><Icon name="clock" size={16} /> {dr(doctor.name)}, {fmtDay(`${date}T00:00:00`)}, {chosen.label}</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={!time || busy}>{busy ? 'Sending request' : 'Request this slot'}</button>
        </section>
      </form>

      {done && (
        <p className="ok success" role="status">
          Request sent for {fmtDay(done.appointmentAt)} at {fmtTime(done.appointmentAt)} with {dr(done.doctorName)}.
          It is confirmed once they approve it.{' '}
          <button type="button" className="link" onClick={() => go('appointments')}>See my appointments</button>
        </p>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Appointments list */

function MyAppointments({ data, reload, go }) {
  const [error, setError] = useState('');

  async function cancel(a) {
    if (!confirm('Cancel this appointment? The slot becomes free for others.')) return;
    try { await api(`/portal/appointments/${a.id}/cancel`, { method: 'PATCH' }); reload(); }
    catch (err) { setError(err.message); }
  }

  const now = new Date();
  const sorted = data.appointments.slice().sort((x, y) => new Date(x.appointmentAt) - new Date(y.appointmentAt));
  const upcoming = sorted.filter((a) => new Date(a.appointmentAt) > now && !['REJECTED', 'CANCELLED'].includes(a.status));
  const earlier = sorted.filter((a) => !upcoming.includes(a)).reverse();

  const Row = ({ a }) => (
    <li>
      <DateChip iso={a.appointmentAt} />
      <div className="grow">
        <b>{dr(a.doctorName)}</b>, {fmtTime(a.appointmentAt)}
        <div className="muted small">{a.reason || 'General visit'}</div>
        <div className="muted small">{STATUS_TEXT(a)}</div>
      </div>
      <Pill status={a.status} />
      {(a.status === 'REQUESTED' || a.status === 'APPROVED') && new Date(a.appointmentAt) > now &&
        <button className="sm" onClick={() => cancel(a)}>Cancel</button>}
    </li>
  );

  return (
    <>
      <PageHead title="My appointments" sub="Each request shows who it is with and whether it has been approved.">
        <button className="primary" onClick={() => go('book')}><Icon name="plus" size={16} /> Book a visit</button>
      </PageHead>
      {error && <p className="error" role="alert">{error}</p>}
      {sorted.length === 0 ? <Empty title="No appointments yet">Book a visit and its status will show here.</Empty> : (
        <>
          <div className="section-head"><h2>Upcoming</h2></div>
          {upcoming.length === 0 ? <p className="muted">Nothing upcoming.</p> : <ul className="rows">{upcoming.map((a) => <Row key={a.id} a={a} />)}</ul>}
          {earlier.length > 0 && (
            <>
              <div className="section-head gap-top"><h2>Earlier and closed</h2></div>
              <ul className="rows faded">{earlier.map((a) => <Row key={a.id} a={a} />)}</ul>
            </>
          )}
        </>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Record */

function Record({ data }) {
  const p = data.patient;
  return (
    <>
      <PageHead title="My record" sub={`${p.firstName} ${p.lastName}`} />
      <section className="panel"><h2>Medical history</h2><p>{p.medicalHistory || 'Nothing recorded yet.'}</p></section>

      <section className="panel">
        <h2>Medicines</h2>
        {data.medications.length === 0 ? <p className="muted">No medicines on your record.</p> : (
          <div className="table-wrap flat"><table>
            <thead><tr><th>Medicine</th><th>Dose</th><th>How often</th><th>Status</th></tr></thead>
            <tbody>{data.medications.map((m) => (
              <tr key={m.id}><td>{m.drugName}</td><td>{m.dosage}</td><td>{m.frequency}</td>
                <td><Pill status={m.active ? 'COMPLETED' : 'CANCELLED'} label={m.active ? 'Active' : 'Stopped'} /></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="panel">
        <h2>Tests and scans</h2>
        {data.orders.length === 0 ? <p className="muted">No tests ordered.</p> : (
          <div className="table-wrap flat"><table>
            <thead><tr><th>Test</th><th>Status</th><th>Result</th></tr></thead>
            <tbody>{data.orders.map((o) => (
              <tr key={o.id}><td>{o.name}<div className="muted small">{fmt(o.createdAt)}</div></td><td><Pill status={o.status} /></td><td>{o.result || <span className="muted">Not ready</span>}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="panel">
        <h2>Notes from your care team</h2>
        {data.notes.length === 0 ? <p className="muted">No notes yet.</p> : (
          <div className="timeline">{data.notes.map((n) => (
            <article key={n.id}><header><strong>{n.type.replace('_', ' ').toLowerCase()}</strong><span className="muted small">{n.author}, {fmt(n.createdAt)}</span></header><p>{n.content}</p></article>
          ))}</div>
        )}
      </section>
    </>
  );
}
