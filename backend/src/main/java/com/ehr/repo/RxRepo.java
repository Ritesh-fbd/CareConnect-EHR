package com.ehr.repo;
import com.ehr.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RxRepo extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    void deleteByPatientId(Long patientId);
}
