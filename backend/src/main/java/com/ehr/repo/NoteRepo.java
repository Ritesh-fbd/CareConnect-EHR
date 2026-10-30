package com.ehr.repo;
import com.ehr.model.ClinicalNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface NoteRepo extends JpaRepository<ClinicalNote, Long> {
    List<ClinicalNote> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    void deleteByPatientId(Long patientId);
}
