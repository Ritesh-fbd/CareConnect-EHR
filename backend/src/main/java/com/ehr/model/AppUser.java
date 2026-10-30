package com.ehr.model;

import jakarta.persistence.*;

@Entity
@Table(name = "app_user")
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(unique = true, nullable = false) public String username;
    @Column(nullable = false) public String passwordHash;
    /** DOCTOR, NURSE, ADMIN or PATIENT */
    @Column(nullable = false) public String role;
    /** Set only for PATIENT users; links the login to their own EHR record. */
    public Long patientId;
    /** True while the account still has a staff-generated temporary password. Null counts as false. */
    public Boolean mustChangePassword;
    /** Display name, used for doctors (patients search and book by it). */
    public String fullName;
    /** Doctors only, for example Cardiology. */
    public String specialty;

    public AppUser() {}
    public AppUser(String username, String passwordHash, String role) {
        this.username = username; this.passwordHash = passwordHash; this.role = role;
    }
    public AppUser(String username, String passwordHash, String role, Long patientId) {
        this(username, passwordHash, role); this.patientId = patientId;
    }
}
