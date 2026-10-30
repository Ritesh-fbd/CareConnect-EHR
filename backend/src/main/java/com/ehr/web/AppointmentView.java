package com.ehr.web;

import java.time.LocalDateTime;

/** What the API sends for an appointment, with the names already filled in. */
public record AppointmentView(Long id, Long patientId, String patientName, Long doctorId, String doctorName,
                              String reason, LocalDateTime appointmentAt, String status,
                              LocalDateTime createdAt, String decidedBy, LocalDateTime decidedAt) {}
