package com.ehr.web;

import ca.uhn.fhir.context.FhirContext;
import com.ehr.model.Patient;
import com.ehr.model.Prescription;
import com.ehr.repo.PatientRepo;
import com.ehr.repo.RxRepo;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.Enumerations;
import org.hl7.fhir.r4.model.MedicationRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/fhir")
public class FhirController {
    private static final FhirContext CTX = FhirContext.forR4();
    private final PatientRepo patients; private final RxRepo prescriptions;
    public FhirController(PatientRepo patients, RxRepo prescriptions) { this.patients=patients; this.prescriptions=prescriptions; }
    @GetMapping(value="/Patient", produces={"application/fhir+json", MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<String> patientBundle() {
        Bundle bundle=new Bundle().setType(Bundle.BundleType.SEARCHSET).setTotal((int)patients.count());
        for (Patient p: patients.findAll()) bundle.addEntry().setFullUrl("Patient/"+p.id).setResource(toFhir(p));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("application/fhir+json")).body(CTX.newJsonParser().encodeResourceToString(bundle));
    }
    @GetMapping(value="/Patient/{id}", produces={"application/fhir+json", MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<String> patient(@PathVariable Long id) {
        return patients.findById(id).map(p -> ResponseEntity.ok().contentType(MediaType.parseMediaType("application/fhir+json")).body(CTX.newJsonParser().encodeResourceToString(toFhir(p))))
          .orElseGet(() -> ResponseEntity.notFound().build());
    }
    @GetMapping(value="/MedicationRequest", produces={"application/fhir+json", MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<String> medicationRequests() {
        var list=prescriptions.findAll(); Bundle b=new Bundle().setType(Bundle.BundleType.SEARCHSET).setTotal(list.size());
        for (Prescription rx:list) b.addEntry().setFullUrl("MedicationRequest/"+rx.id).setResource(toFhir(rx));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("application/fhir+json")).body(CTX.newJsonParser().encodeResourceToString(b));
    }
    private org.hl7.fhir.r4.model.Patient toFhir(Patient p) {
        var f=new org.hl7.fhir.r4.model.Patient(); f.setId(p.id.toString());
        f.addName().setFamily(p.lastName).addGiven(p.firstName);
        if(p.dateOfBirth!=null) f.setBirthDate(java.util.Date.from(p.dateOfBirth.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
        if(p.phone!=null && !p.phone.isBlank()) f.addTelecom().setSystem(org.hl7.fhir.r4.model.ContactPoint.ContactPointSystem.PHONE).setValue(p.phone);
        if("male".equalsIgnoreCase(p.gender)) f.setGender(Enumerations.AdministrativeGender.MALE);
        else if("female".equalsIgnoreCase(p.gender)) f.setGender(Enumerations.AdministrativeGender.FEMALE);
        else f.setGender(Enumerations.AdministrativeGender.UNKNOWN);
        return f;
    }
    private MedicationRequest toFhir(Prescription rx) {
        MedicationRequest f=new MedicationRequest(); f.setId(rx.id.toString());
        f.setStatus(rx.active?MedicationRequest.MedicationRequestStatus.ACTIVE:MedicationRequest.MedicationRequestStatus.STOPPED);
        f.setIntent(MedicationRequest.MedicationRequestIntent.ORDER);
        f.setSubject(new org.hl7.fhir.r4.model.Reference("Patient/"+rx.patientId));
        f.setMedication(new org.hl7.fhir.r4.model.CodeableConcept().setText(rx.drugName+" - "+rx.dosage+" - "+rx.frequency));
        if(rx.createdAt!=null) f.setAuthoredOn(java.util.Date.from(rx.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()));
        return f;
    }
}
