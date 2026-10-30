package com.ehr.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
public class ClinicalNote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long patientId;
    /** PROGRESS, ASSESSMENT or TREATMENT_PLAN */
    @NotBlank public String type;
    @NotBlank @Column(length = 4000)
    public String content;
    public String author;
    public LocalDateTime createdAt;
}
