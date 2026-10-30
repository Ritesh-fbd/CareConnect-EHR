package com.ehr.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
public class Prescription {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long patientId;
    @NotBlank public String drugName;
    @NotBlank public String dosage;
    @NotBlank public String frequency;
    public boolean active = true;
    public String prescribedBy;
    public LocalDateTime createdAt;
}
