package com.ehr.web;

import com.ehr.model.*;
import com.ehr.repo.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Clinical notes, diagnostic orders and prescriptions, all scoped to one patient. */
@RestController
@RequestMapping("/api/patients/{patientId}")
public class RecordsController {
    private final PatientRepo patients;
    private final NoteRepo notes;
    private final OrderRepo orders;
    private final RxRepo prescriptions;

    public RecordsController(PatientRepo patients, NoteRepo notes, OrderRepo orders, RxRepo prescriptions) {
        this.patients = patients; this.notes = notes; this.orders = orders; this.prescriptions = prescriptions;
    }

    private void requirePatient(Long id) {
        if (!patients.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found");
    }

    // ---------- Clinical documentation ----------
    @GetMapping("/notes")
    public List<ClinicalNote> listNotes(@PathVariable Long patientId) {
        requirePatient(patientId);
        return notes.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @PostMapping("/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public ClinicalNote addNote(@PathVariable Long patientId, @Valid @RequestBody ClinicalNote n, Authentication auth) {
        requirePatient(patientId);
        n.id = null; n.patientId = patientId; n.author = auth.getName(); n.createdAt = LocalDateTime.now();
        return notes.save(n);
    }

    // ---------- Order management ----------
    @GetMapping("/orders")
    public List<DiagnosticOrder> listOrders(@PathVariable Long patientId) {
        requirePatient(patientId);
        return orders.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public DiagnosticOrder addOrder(@PathVariable Long patientId, @Valid @RequestBody DiagnosticOrder o, Authentication auth) {
        requirePatient(patientId);
        o.id = null; o.patientId = patientId; o.status = "ORDERED"; o.result = null;
        o.orderedBy = auth.getName(); o.createdAt = LocalDateTime.now();
        return orders.save(o);
    }

    /** Body: {"status":"COMPLETED","result":"..."} (result optional) */
    @PatchMapping("/orders/{orderId}")
    public DiagnosticOrder updateOrder(@PathVariable Long patientId, @PathVariable Long orderId,
                                       @RequestBody Map<String, String> body) {
        var o = orders.findById(orderId)
                .filter(x -> x.patientId.equals(patientId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        String status = body.get("status");
        if (status != null) {
            if (!List.of("ORDERED", "COMPLETED", "CANCELLED").contains(status))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
            o.status = status;
        }
        if (body.containsKey("result")) o.result = body.get("result");
        return orders.save(o);
    }

    // ---------- Medication management ----------
    @GetMapping("/medications")
    public List<Prescription> listMedications(@PathVariable Long patientId) {
        requirePatient(patientId);
        return prescriptions.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @PostMapping("/medications")
    @ResponseStatus(HttpStatus.CREATED)
    public Prescription prescribe(@PathVariable Long patientId, @Valid @RequestBody Prescription rx, Authentication auth) {
        requirePatient(patientId);
        rx.id = null; rx.patientId = patientId; rx.active = true;
        rx.prescribedBy = auth.getName(); rx.createdAt = LocalDateTime.now();
        return prescriptions.save(rx);
    }

    /** Body: {"active": false} to discontinue, true to resume. */
    @PatchMapping("/medications/{rxId}")
    public Prescription setActive(@PathVariable Long patientId, @PathVariable Long rxId,
                                  @RequestBody Map<String, Boolean> body) {
        var rx = prescriptions.findById(rxId)
                .filter(x -> x.patientId.equals(patientId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found"));
        rx.active = Boolean.TRUE.equals(body.get("active"));
        return prescriptions.save(rx);
    }
}
