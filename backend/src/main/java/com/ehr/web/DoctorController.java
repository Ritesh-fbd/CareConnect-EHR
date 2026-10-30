package com.ehr.web;

import com.ehr.model.AppUser;
import com.ehr.repo.UserRepo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/** Doctor directory. Any signed-in user can search it; patients use it to pick who to book. */
@RestController
@RequestMapping("/api/doctors")
public class DoctorController {
    public record DoctorView(Long id, String name, String specialty) {}

    private final UserRepo users;

    public DoctorController(UserRepo users) { this.users = users; }

    public static String displayName(AppUser u) {
        return u.fullName == null || u.fullName.isBlank() ? u.username : u.fullName;
    }

    @GetMapping
    public List<DoctorView> search(@RequestParam(required = false) String q) {
        String needle = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return users.findByRole("DOCTOR").stream()
                .filter(u -> needle.isEmpty()
                        || displayName(u).toLowerCase(Locale.ROOT).contains(needle)
                        || (u.specialty != null && u.specialty.toLowerCase(Locale.ROOT).contains(needle)))
                .sorted(Comparator.comparing(DoctorController::displayName, String.CASE_INSENSITIVE_ORDER))
                .map(u -> new DoctorView(u.id, displayName(u), u.specialty))
                .toList();
    }
}
