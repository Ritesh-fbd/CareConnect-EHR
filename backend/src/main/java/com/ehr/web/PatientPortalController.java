package com.ehr.web;

import com.ehr.model.Appointment;
import com.ehr.model.Patient;
import com.ehr.repo.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/** Everything a signed-in patient can see or do. Always scoped to the patient linked to the login. */
@RestController
@RequestMapping("/api/portal")
public class PatientPortalController {
    public record BookingRequest(
            @NotNull(message = "Choose a doctor") Long doctorId,
            @NotNull(message = "Choose a date") LocalDate date,
            @NotNull(message = "Choose a time slot") LocalTime time,
            @Size(max = 300, message = "Reason must be 300 characters or fewer") String reason) {}

    private final UserRepo users;
    private final PatientRepo patients;
    private final AppointmentRepo appointments;
    private final NoteRepo notes;
    private final OrderRepo orders;
    private final RxRepo medications;
    private final SlotService slots;
    private final AppointmentMapper mapper;

    public PatientPortalController(UserRepo users, PatientRepo patients, AppointmentRepo appointments,
                                   NoteRepo notes, OrderRepo orders, RxRepo medications,
                                   SlotService slots, AppointmentMapper mapper) {
        this.users = users; this.patients = patients; this.appointments = appointments;
        this.notes = notes; this.orders = orders; this.medications = medications;
        this.slots = slots; this.mapper = mapper;
    }

    private Long patientId(Authentication auth) {
        var user = users.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (!"PATIENT".equals(user.role) || user.patientId == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is not linked to a patient record");
        return user.patientId;
    }

    @GetMapping("/me")
    public Map<String, Object> myRecord(Authentication auth) {
        Long id = patientId(auth);
        Patient patient = patients.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient record not found"));
        return Map.of(
                "patient", patient,
                "notes", notes.findByPatientIdOrderByCreatedAtDesc(id),
                "orders", orders.findByPatientIdOrderByCreatedAtDesc(id),
                "medications", medications.findByPatientIdOrderByCreatedAtDesc(id),
                "appointments", appointments.findByPatientIdOrderByAppointmentAtAsc(id).stream().map(mapper::view).toList());
    }

    /** Free and taken 30-minute slots for one doctor on one day. */
    @GetMapping("/doctors/{doctorId}/slots")
    public List<SlotService.Slot> slotsFor(@PathVariable Long doctorId,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                           Authentication auth) {
        patientId(auth);
        return slots.slots(doctorId, date);
    }

    /** A new request always starts as REQUESTED. The chosen doctor (or an admin) must approve it. */
    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentView book(@Valid @RequestBody BookingRequest r, Authentication auth) {
        Long id = patientId(auth);
        Appointment a = slots.book(id, r.doctorId(), r.date(), r.time(), r.reason());
        return mapper.view(a);
    }

    @GetMapping("/appointments")
    public List<AppointmentView> myAppointments(Authentication auth) {
        return appointments.findByPatientIdOrderByAppointmentAtAsc(patientId(auth)).stream().map(mapper::view).toList();
    }

    /** A patient can withdraw a request or cancel an approved visit. This frees the slot. */
    @PatchMapping("/appointments/{appointmentId}/cancel")
    public AppointmentView cancel(@PathVariable Long appointmentId, Authentication auth) {
        Long id = patientId(auth);
        Appointment a = appointments.findById(appointmentId)
                .filter(x -> x.patientId.equals(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
        if (!List.of("REQUESTED", "APPROVED").contains(a.status))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This appointment can no longer be cancelled");
        a.status = "CANCELLED";
        return mapper.view(appointments.save(a));
    }
}
