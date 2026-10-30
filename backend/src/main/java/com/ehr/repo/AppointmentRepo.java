package com.ehr.repo;
import com.ehr.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
public interface AppointmentRepo extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientIdOrderByAppointmentAtAsc(Long patientId);
    List<Appointment> findAllByOrderByAppointmentAtAsc();
    List<Appointment> findByDoctorIdAndStatusIn(Long doctorId, Collection<String> statuses);
    List<Appointment> findByDoctorIdAndStatusInAndAppointmentAtBetween(
            Long doctorId, Collection<String> statuses, LocalDateTime from, LocalDateTime to);
    void deleteByPatientId(Long patientId);
}
