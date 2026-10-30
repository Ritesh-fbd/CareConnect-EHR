package com.ehr.repo;
import com.ehr.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface UserRepo extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    Optional<AppUser> findByPatientId(Long patientId);
    List<AppUser> findByRole(String role);
    void deleteByPatientId(Long patientId);
}
