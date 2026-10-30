package com.ehr.web;

import com.ehr.model.Appointment;
import com.ehr.repo.AppointmentRepo;
import com.ehr.repo.UserRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Appointment slots: 30-minute blocks from 9:00 AM to 5:00 PM (last block starts 4:30 PM).
 * A slot is taken while a request is waiting or approved. Declined or cancelled requests free it again.
 */
@Component
public class SlotService {
    public record Slot(String time, String label, boolean available) {}

    public static final LocalTime OPEN = LocalTime.of(9, 0);
    public static final LocalTime CLOSE = LocalTime.of(17, 0);
    public static final int STEP_MINUTES = 30;
    public static final int MAX_DAYS_AHEAD = 60;
    private static final List<String> BLOCKING = List.of("REQUESTED", "APPROVED");
    private static final DateTimeFormatter LABEL = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    private final AppointmentRepo appointments;
    private final UserRepo users;

    public SlotService(AppointmentRepo appointments, UserRepo users) {
        this.appointments = appointments; this.users = users;
    }

    private void requireDoctor(Long doctorId) {
        users.findById(doctorId).filter(u -> "DOCTOR".equals(u.role))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    private void requireBookableDate(LocalDate date) {
        if (date.isBefore(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose today or a later date");
        if (date.isAfter(LocalDate.now().plusDays(MAX_DAYS_AHEAD)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You can book up to " + MAX_DAYS_AHEAD + " days ahead");
    }

    private Set<LocalTime> taken(Long doctorId, LocalDate date) {
        return appointments.findByDoctorIdAndStatusInAndAppointmentAtBetween(
                        doctorId, BLOCKING, date.atStartOfDay(), date.plusDays(1).atStartOfDay())
                .stream().map(a -> a.appointmentAt.toLocalTime().withSecond(0).withNano(0))
                .collect(Collectors.toSet());
    }

    public List<Slot> slots(Long doctorId, LocalDate date) {
        requireDoctor(doctorId);
        requireBookableDate(date);
        Set<LocalTime> taken = taken(doctorId, date);
        LocalDateTime now = LocalDateTime.now();
        List<Slot> out = new ArrayList<>();
        for (LocalTime t = OPEN; t.isBefore(CLOSE); t = t.plusMinutes(STEP_MINUTES)) {
            boolean free = !taken.contains(t) && date.atTime(t).isAfter(now);
            out.add(new Slot(t.toString(), t.format(LABEL), free));
        }
        return out;
    }

    /** Synchronized so two patients cannot take the same slot at the same moment (single server). */
    public synchronized Appointment book(Long patientId, Long doctorId, LocalDate date, LocalTime time, String reason) {
        requireDoctor(doctorId);
        requireBookableDate(date);
        boolean onGrid = !time.isBefore(OPEN) && time.isBefore(CLOSE)
                && time.getMinute() % STEP_MINUTES == 0 && time.getSecond() == 0;
        if (!onGrid)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose one of the listed time slots");
        LocalDateTime at = date.atTime(time);
        if (!at.isAfter(LocalDateTime.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a time in the future");
        if (taken(doctorId, date).contains(time))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That slot was just taken. Please choose another.");

        Appointment a = new Appointment();
        a.patientId = patientId;
        a.doctorId = doctorId;
        a.appointmentAt = at;
        a.reason = reason == null || reason.isBlank() ? null : reason.trim();
        a.status = "REQUESTED";
        return appointments.save(a);
    }
}
