package com.ehr.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
public class Appointment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @NotNull public Long patientId;
    /** The doctor (an AppUser with role DOCTOR) the patient chose. Null only for old records. */
    public Long doctorId;
    public String reason;
    @NotNull public LocalDateTime appointmentAt;
    /** REQUESTED, APPROVED, REJECTED or CANCELLED */
    @Column(nullable = false) public String status = "REQUESTED";
    public LocalDateTime createdAt = LocalDateTime.now();
    /** Doctor or admin who approved or rejected the request. */
    public String decidedBy;
    public LocalDateTime decidedAt;
}
