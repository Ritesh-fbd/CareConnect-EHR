package com.ehr.web;

import com.ehr.model.AppUser;
import com.ehr.model.Patient;
import com.ehr.repo.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
public class PatientController {
    private final PatientRepo patients;
    private final UserRepo users;
    private final NoteRepo notes;
    private final OrderRepo orders;
    private final RxRepo prescriptions;
    private final AppointmentRepo appointments;
    private final PasswordEncoder encoder;
    private final CredentialService credentials;

    public PatientController(PatientRepo patients, UserRepo users, NoteRepo notes, OrderRepo orders,
                             RxRepo prescriptions, AppointmentRepo appointments, PasswordEncoder encoder,
                             CredentialService credentials) {
        this.patients = patients; this.users = users; this.notes = notes; this.orders = orders;
        this.prescriptions = prescriptions; this.appointments = appointments; this.encoder = encoder;
        this.credentials = credentials;
    }

    @GetMapping
    public List<Patient> list(@RequestParam(required = false) String q) {
        if (q == null || q.isBlank()) return patients.findAll();
        return patients.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(q, q);
    }

    @GetMapping("/{id}")
    public Patient get(@PathVariable Long id) {
        return patients.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
    }

    /**
     * Staff (nurse, doctor or admin) registers a patient. A login is created automatically
     * and the generated password is returned ONCE so staff can hand it to the patient.
     * The patient must change it at first sign-in.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> create(@Valid @RequestBody Patient p) {
        p.id = null;
        Patient saved = patients.save(p);
        String username = credentials.uniqueUsername("", saved.firstName, saved.lastName);
        String password = credentials.password();
        AppUser user = new AppUser(username, encoder.encode(password), "PATIENT", saved.id);
        user.mustChangePassword = true;
        users.save(user);
        return Map.of("patient", saved, "username", username, "temporaryPassword", password);
    }

    /** Generates a new temporary password, for a patient who forgot theirs. */
    @PostMapping("/{id}/reset-password")
    @Transactional
    public Map<String, Object> resetPassword(@PathVariable Long id) {
        Patient patient = get(id);
        String password = credentials.password();
        AppUser user = users.findByPatientId(id).orElseGet(() ->
                new AppUser(credentials.uniqueUsername("", patient.firstName, patient.lastName), "", "PATIENT", id));
        user.passwordHash = encoder.encode(password);
        user.mustChangePassword = true;
        users.save(user);
        return Map.of("username", user.username, "temporaryPassword", password);
    }

    @PutMapping("/{id}")
    public Patient update(@PathVariable Long id, @Valid @RequestBody Patient p) {
        get(id);
        p.id = id;
        return patients.save(p);
    }

    /** Deletes the patient and everything attached to them, including their login. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        get(id);
        notes.deleteByPatientId(id);
        orders.deleteByPatientId(id);
        prescriptions.deleteByPatientId(id);
        appointments.deleteByPatientId(id);
        users.deleteByPatientId(id);
        patients.deleteById(id);
    }
}
