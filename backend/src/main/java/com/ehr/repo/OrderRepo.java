package com.ehr.repo;
import com.ehr.model.DiagnosticOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderRepo extends JpaRepository<DiagnosticOrder, Long> {
    List<DiagnosticOrder> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    void deleteByPatientId(Long patientId);
}
