package com.ehr.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
public class DiagnosticOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long patientId;
    /** LAB or IMAGING */
    @NotBlank public String category;
    /** e.g. "Complete Blood Count", "Chest X-ray" */
    @NotBlank public String name;
    /** ORDERED, COMPLETED or CANCELLED */
    public String status;
    @Column(length = 2000)
    public String result;
    public String orderedBy;
    public LocalDateTime createdAt;
}
