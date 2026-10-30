package com.ehr;

import com.ehr.model.*;
import com.ehr.repo.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Creates demo accounts and one sample patient on first start. Remove before any real deployment. */
@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepo users;
    private final PatientRepo patients;
    private final NoteRepo notes;
    private final AppointmentRepo appointments;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepo users, PatientRepo patients, NoteRepo notes,
                      AppointmentRepo appointments, PasswordEncoder encoder) {
        this.users = users; this.patients = patients; this.notes = notes;
        this.appointments = appointments; this.encoder = encoder;
    }

    private AppUser account(String username, String password, String role, String fullName, String specialty) {
        return users.findByUsername(username).orElseGet(() -> {
            AppUser u = new AppUser(username, encoder.encode(password), role);
            u.fullName = fullName;
            u.specialty = specialty;
            return users.save(u);
        });
    }

    @Override
    public void run(String... args) {
        AppUser doctor = account("doctor", "doctor123", "DOCTOR", "Meera Rao", "General Medicine");
        account("dr.arjun", "doctor123", "DOCTOR", "Arjun Mehta", "Cardiology");
        account("dr.sana", "doctor123", "DOCTOR", "Sana Khan", "Pediatrics");
        account("nurse", "nurse123", "NURSE", null, null);
        account("admin", "admin123", "ADMIN", null, null);

        if (users.findByUsername("patient").isPresent()) return;

        Patient p = new Patient();
        p.firstName = "Asha"; p.lastName = "Verma";
        p.dateOfBirth = LocalDate.of(1988, 4, 12); p.gender = "Female"; p.phone = "9810000000";
        p.insuranceProvider = "CarePlus"; p.insuranceNumber = "CP-100234";
        p.medicalHistory = "Type 2 diabetes (2019). Seasonal allergies.";
        p = patients.save(p);
        users.save(new AppUser("patient", encoder.encode("patient123"), "PATIENT", p.id));

        ClinicalNote n = new ClinicalNote();
        n.patientId = p.id; n.type = "PROGRESS"; n.author = "doctor"; n.createdAt = LocalDateTime.now();
        n.content = "Routine follow-up. Blood sugar stable. Continue current diet plan.";
        notes.save(n);

        // One pending request so the approval screen has something to show.
        Appointment a = new Appointment();
        a.patientId = p.id;
        a.doctorId = doctor.id;
        a.reason = "Diabetes follow-up";
        a.appointmentAt = LocalDate.now().plusDays(2).atTime(10, 0);
        appointments.save(a);
    }
}
