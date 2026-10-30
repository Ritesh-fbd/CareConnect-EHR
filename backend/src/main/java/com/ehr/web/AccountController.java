package com.ehr.web;

import com.ehr.repo.UserRepo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/** Lets any signed-in user change their own password (required after a staff-generated one). */
@RestController
@RequestMapping("/api/account")
public class AccountController {
    public record ChangePasswordRequest(
            @NotBlank(message = "Enter your current password") String currentPassword,
            @NotBlank(message = "Choose a new password")
            @Size(min = 8, max = 72, message = "New password must be 8 to 72 characters") String newPassword) {}

    private final UserRepo users;
    private final PasswordEncoder encoder;

    public AccountController(UserRepo users, PasswordEncoder encoder) {
        this.users = users; this.encoder = encoder;
    }

    @PostMapping("/password")
    public Map<String, String> changePassword(@Valid @RequestBody ChangePasswordRequest req, Authentication auth) {
        var user = users.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (!encoder.matches(req.currentPassword(), user.passwordHash))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your current password is not correct");
        if (req.currentPassword().equals(req.newPassword()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a password different from the current one");
        user.passwordHash = encoder.encode(req.newPassword());
        user.mustChangePassword = false;
        users.save(user);
        return Map.of("message", "Password updated");
    }
}
