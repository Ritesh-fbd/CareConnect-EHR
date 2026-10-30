package com.ehr.web;

import com.ehr.model.Appointment;
import com.ehr.repo.PatientRepo;
import com.ehr.repo.UserRepo;
import org.springframework.stereotype.Component;

@Component
public class AppointmentMapper {
    private final PatientRepo patients;
    private final UserRepo users;

    public AppointmentMapper(PatientRepo patients, UserRepo users) { this.patients = patients; this.users = users; }

    public AppointmentView view(Appointment a) {
        String patient = patients.findById(a.patientId).map(p -> p.firstName + " " + p.lastName).orElse("Unknown patient");
        String doctor = a.doctorId == null ? "Any doctor"
                : users.findById(a.doctorId).map(DoctorController::displayName).orElse("Former doctor");
        return new AppointmentView(a.id, a.patientId, patient, a.doctorId, doctor, a.reason, a.appointmentAt,
                a.status, a.createdAt, a.decidedBy, a.decidedAt);
    }
}
