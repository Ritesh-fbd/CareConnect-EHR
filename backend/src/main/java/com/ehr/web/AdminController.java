package com.ehr.web;

import com.ehr.model.AppUser;
import com.ehr.repo.AppointmentRepo;
import com.ehr.repo.UserRepo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/** Doctor accounts. Admin only (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin/doctors")
public class AdminController {
    public record NewDoctor(@NotBlank(message = "First name is required") String firstName,
                            @NotBlank(message = "Last name is required") String lastName,
                            @NotBlank(message = "Specialty is required") String specialty) {}

    public record AdminDoctorView(Long id, String username, String name, String specialty, boolean mustChangePassword) {}

    private final UserRepo users;
    private final AppointmentRepo appointments;
    private final PasswordEncoder encoder;
    private final CredentialService credentials;

    public AdminController(UserRepo users, AppointmentRepo appointments, PasswordEncoder encoder, CredentialService credentials) {
        this.users = users; this.appointments = appointments; this.encoder = encoder; this.credentials = credentials;
    }

    private AdminDoctorView view(AppUser u) {
        return new AdminDoctorView(u.id, u.username, DoctorController.displayName(u), u.specialty,
                Boolean.TRUE.equals(u.mustChangePassword));
    }

    private AppUser doctor(Long id) {
        return users.findById(id).filter(u -> "DOCTOR".equals(u.role))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    @GetMapping
    public List<AdminDoctorView> list() {
        return users.findByRole("DOCTOR").stream()
                .sorted(Comparator.comparing(DoctorController::displayName, String.CASE_INSENSITIVE_ORDER))
                .map(this::view).toList();
    }

    /** Creates the doctor's login and returns the generated password once. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> create(@Valid @RequestBody NewDoctor req) {
        String first = req.firstName().trim(), last = req.lastName().trim();
        String username = credentials.uniqueUsername("dr.", first, last);
        String password = credentials.password();
        AppUser u = new AppUser(username, encoder.encode(password), "DOCTOR");
        u.fullName = first + " " + last;
        u.specialty = req.specialty().trim();
        u.mustChangePassword = true;
        u = users.save(u);
        return Map.of("doctor", view(u), "username", username, "temporaryPassword", password);
    }

    @PostMapping("/{id}/reset-password")
    @Transactional
    public Map<String, Object> resetPassword(@PathVariable Long id) {
        AppUser u = doctor(id);
        String password = credentials.password();
        u.passwordHash = encoder.encode(password);
        u.mustChangePassword = true;
        users.save(u);
        return Map.of("username", u.username, "temporaryPassword", password);
    }

    /** Removes the doctor's login. Their waiting and approved appointments are cancelled so patients can rebook. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        AppUser u = doctor(id);
        appointments.findByDoctorIdAndStatusIn(id, List.of("REQUESTED", "APPROVED")).forEach(a -> {
            a.status = "CANCELLED";
            a.decidedBy = "admin";
            a.decidedAt = LocalDateTime.now();
            appointments.save(a);
        });
        users.delete(u);
    }
}
