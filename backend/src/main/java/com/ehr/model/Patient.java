package com.ehr.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

@Entity
public class Patient {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @NotBlank public String firstName;
    @NotBlank public String lastName;
    public LocalDate dateOfBirth;
    public String gender;
    public String phone;
    public String insuranceProvider;
    public String insuranceNumber;
    @Column(length = 2000)
    public String medicalHistory;
}
