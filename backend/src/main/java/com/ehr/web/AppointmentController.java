package com.ehr.web;

import com.ehr.model.Appointment;
import com.ehr.repo.AppointmentRepo;
import com.ehr.repo.UserRepo;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Appointment review. SecurityConfig limits this to doctors and admins.
 * A doctor sees and decides only the requests booked with them. An admin sees and decides all.
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private final AppointmentRepo appointments;
    private final UserRepo users;
    private final AppointmentMapper mapper;

    public AppointmentController(AppointmentRepo appointments, UserRepo users, AppointmentMapper mapper) {
        this.appointments = appointments; this.users = users; this.mapper = mapper;
    }

    public record StatusRequest(String status) {}

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(g -> g.getAuthority().equals("ROLE_ADMIN"));
    }

    private Long myId(Authentication auth) {
        return users.findByUsername(auth.getName()).map(u -> u.id).orElse(-1L);
    }

    @GetMapping
    public List<AppointmentView> list(Authentication auth) {
        Long me = isAdmin(auth) ? null : myId(auth);
        return appointments.findAllByOrderByAppointmentAtAsc().stream()
                .filter(a -> me == null || a.doctorId == null || a.doctorId.equals(me))
                .map(mapper::view).toList();
    }

    /** Approve or reject a request that is still waiting for a decision. */
    @PatchMapping("/{id}/status")
    public AppointmentView decide(@PathVariable Long id, @RequestBody StatusRequest request, Authentication auth) {
        if (request == null || request.status() == null
                || !(request.status().equals("APPROVED") || request.status().equals("REJECTED"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be APPROVED or REJECTED");
        }
        Appointment a = appointments.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
        if (!isAdmin(auth) && a.doctorId != null && !a.doctorId.equals(myId(auth))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This request is booked with another doctor");
        }
        if (!"REQUESTED".equals(a.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This request was already " + a.status.toLowerCase() + ".");
        }
        a.status = request.status();
        a.decidedBy = auth.getName();
        a.decidedAt = LocalDateTime.now();
        return mapper.view(appointments.save(a));
    }
}
