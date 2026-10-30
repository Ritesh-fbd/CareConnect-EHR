package com.ehr.repo;
import com.ehr.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PatientRepo extends JpaRepository<Patient, Long> {
 List<Patient> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String f, String l);
}
