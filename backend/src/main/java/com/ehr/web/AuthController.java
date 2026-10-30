package com.ehr.web;

import com.ehr.model.AppUser;
import com.ehr.model.Patient;
import com.ehr.repo.PatientRepo;
import com.ehr.repo.UserRepo;
import com.ehr.security.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    public record LoginRequest(String username, String password) {}

    public record RegisterRequest(
            @NotBlank(message = "Choose a username")
            @Pattern(regexp = "^[A-Za-z0-9._-]{3,30}$",
                     message = "Username must be 3 to 30 letters, numbers, dots, dashes or underscores")
            String username,
            @NotBlank(message = "Choose a password")
            @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters")
            String password,
            @NotBlank(message = "First name is required") String firstName,
            @NotBlank(message = "Last name is required") String lastName,
            @PastOrPresent(message = "Date of birth cannot be in the future") LocalDate dateOfBirth,
            String gender,
            String phone) {}

    private final UserRepo users;
    private final PatientRepo patients;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthController(UserRepo users, PatientRepo patients, PasswordEncoder encoder, JwtUtil jwt) {
        this.users = users; this.patients = patients; this.encoder = encoder; this.jwt = jwt;
    }

    /** Self-registration: creates the patient record and the patient's login together. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest req) {
        String username = req.username().trim().toLowerCase();
        if (users.findByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already taken");
        }
        Patient patient = new Patient();
        patient.firstName = req.firstName().trim();
        patient.lastName = req.lastName().trim();
        patient.dateOfBirth = req.dateOfBirth();
        patient.gender = req.gender();
        patient.phone = req.phone();
        patient = patients.save(patient);
        AppUser user = users.save(new AppUser(username, encoder.encode(req.password()), "PATIENT", patient.id));
        return session(user);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest req) {
        String name = req.username() == null ? "" : req.username().trim().toLowerCase();
        var user = users.findByUsername(name)
                .filter(u -> req.password() != null && encoder.matches(req.password(), u.passwordHash))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password"));
        return session(user);
    }

    private Map<String, Object> session(AppUser user) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("token", jwt.generate(user.username, user.role));
        out.put("username", user.username);
        out.put("role", user.role);
        out.put("mustChangePassword", Boolean.TRUE.equals(user.mustChangePassword));
        return out;
    }
}
