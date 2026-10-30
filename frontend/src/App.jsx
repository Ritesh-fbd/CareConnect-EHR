import { useState } from 'react';
import { getSession, setSession } from './api.js';
import { Auth, ChangePasswordDialog } from './Auth.jsx';
import { Icon, Logo } from './ui.jsx';
import Dashboard from './Dashboard.jsx';
import Patients from './Patients.jsx';
import PatientDetail from './PatientDetail.jsx';
import Appointments, { useAppointments } from './Appointments.jsx';
import PatientPortal from './PatientPortal.jsx';
import Doctors from './Doctors.jsx';

export default function App() {
  const [session, setSess] = useState(getSession());
  const [view, setView] = useState('dashboard'); // dashboard | patients | appointments
  const [patientId, setPatientId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [pwDialog, setPwDialog] = useState(false);

  const role = (session?.role || '').toUpperCase();
  const isStaff = ['DOCTOR', 'NURSE', 'ADMIN'].includes(role);
  const canApprove = role === 'DOCTOR' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';
  const appts = useAppointments(!!session && canApprove);

  if (!session) return <Auth onLogin={setSess} />;

  const logout = () => { setSession(null); setSess(null); setPatientId(null); setView('dashboard'); };
  const go = (v) => { setView(v); setPatientId(null); setAdding(false); };
  const openPatient = (id) => { setPatientId(id); setAdding(false); };
  const forced = !!session.mustChangePassword;
  const pending = (appts.items || []).filter((a) => a.status === 'REQUESTED').length;

  const passwordDialog = (forced || pwDialog) && (
    <ChangePasswordDialog
      forced={forced}
      onDone={() => { setSess(getSession()); setPwDialog(false); }}
      onCancel={() => setPwDialog(false)}
    />
  );

  if (role === 'PATIENT') {
    return (
      <div className="patient-shell">
        <header className="topbar">
          <Logo />
          <span className="grow" />
          <span className="who">{session.username}</span>
          <button onClick={() => setPwDialog(true)}><Icon name="key" size={16} /> Password</button>
          <button onClick={logout}><Icon name="logout" size={16} /> Sign out</button>
        </header>
        <main className="content narrow"><PatientPortal /></main>
        {passwordDialog}
      </div>
    );
  }

  if (!isStaff) return <main className="content"><p className="error">Your account does not have a supported role.</p></main>;

  const nav = [
    ['dashboard', 'Dashboard', 'dashboard'],
    ['patients', 'Patients', 'users'],
    ...(canApprove ? [['appointments', 'Appointments', 'calendar']] : []),
    ...(isAdmin ? [['doctors', 'Doctors', 'doctor']] : []),
  ];

  let page;
  if (patientId) page = <PatientDetail id={patientId} role={role} onBack={() => setPatientId(null)} />;
  else if (view === 'patients') page = <Patients onOpen={openPatient} startAdding={adding} />;
  else if (view === 'appointments' && canApprove) page = <Appointments appts={appts} onOpenPatient={openPatient} showDoctor={isAdmin} />;
  else if (view === 'doctors' && isAdmin) page = <Doctors />;
  else page = (
    <Dashboard session={session} canApprove={canApprove} appts={appts}
               onOpenPatient={openPatient} onGo={go}
               onRegister={() => { setView('patients'); setAdding(true); setPatientId(null); }} />
  );

  return (
    <div className="staff-shell">
      <aside className="sidebar">
        <Logo light />
        <nav aria-label="Main">
          {nav.map(([k, label, icon]) => (
            <button key={k} className={view === k && !patientId ? 'on' : (patientId && k === 'patients' ? 'on' : '')} onClick={() => go(k)}>
              <Icon name={icon} /> {label}
              {k === 'appointments' && pending > 0 && <span className="badge" aria-label={`${pending} waiting`}>{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="me"><b>{session.username}</b><span>{role.toLowerCase()}</span></div>
          <button onClick={() => setPwDialog(true)}><Icon name="key" size={16} /> Change password</button>
          <button onClick={logout}><Icon name="logout" size={16} /> Sign out</button>
        </div>
      </aside>
      <main className="content" key={`${view}-${patientId}-${adding}`}>{page}</main>
      {passwordDialog}
    </div>
  );
}
