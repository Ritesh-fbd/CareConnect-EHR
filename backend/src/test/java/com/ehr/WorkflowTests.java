package com.ehr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** End-to-end checks of the rules the app must enforce. */
@SpringBootTest
@AutoConfigureMockMvc
class WorkflowTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    private JsonNode json(MvcResult r) throws Exception {
        return om.readTree(r.getResponse().getContentAsString());
    }

    private MvcResult send(MockHttpServletRequestBuilder req, String token, String body, ResultMatcher expected) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(body);
        return mvc.perform(req).andExpect(expected).andReturn();
    }

    private String login(String username, String password) throws Exception {
        return json(send(post("/api/auth/login"), null,
                "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}", status().isOk())).get("token").asText();
    }

    private String register(String username) throws Exception {
        return json(send(post("/api/auth/register"), null,
                "{\"username\":\"" + username + "\",\"password\":\"secret-pass-1\",\"firstName\":\"Test\",\"lastName\":\"Patient\"}",
                status().isCreated())).get("token").asText();
    }

    private long doctorId(String token, String nameSearch) throws Exception {
        JsonNode list = json(send(get("/api/doctors").param("q", nameSearch), token, null, status().isOk()));
        assertTrue(list.size() > 0, "no doctor found for " + nameSearch);
        return list.get(0).get("id").asLong();
    }

    private String booking(long doctorId, LocalDate date, String time) {
        return "{\"doctorId\":" + doctorId + ",\"date\":\"" + date + "\",\"time\":\"" + time + "\",\"reason\":\"Check-up\"}";
    }

    private JsonNode slot(JsonNode slots, String time) {
        for (JsonNode s : slots) if (s.get("time").asText().equals(time)) return s;
        throw new AssertionError("slot not listed: " + time);
    }

    @Test
    void patientRegistersAndCanSignInToTheirOwnRecord() throws Exception {
        String name = "reg" + System.nanoTime();
        register(name);
        String token = login(name, "secret-pass-1");
        send(get("/api/portal/me"), token, null, status().isOk());
        send(get("/api/patients"), token, null, status().isForbidden());
        send(get("/api/admin/doctors"), token, null, status().isForbidden());
    }

    @Test
    void patientFindsDoctorByNameAndOnlyThatDoctorOrAdminApproves() throws Exception {
        String patient = register("appt" + System.nanoTime());
        long meera = doctorId(patient, "meera");
        LocalDate day = LocalDate.now().plusDays(1);

        JsonNode appt = json(send(post("/api/portal/appointments"), patient, booking(meera, day, "15:30"), status().isCreated()));
        assertEquals("REQUESTED", appt.get("status").asText());
        assertTrue(appt.get("doctorName").asText().contains("Meera"));
        long id = appt.get("id").asLong();
        String approve = "{\"status\":\"APPROVED\"}";

        send(patch("/api/appointments/" + id + "/status"), patient, approve, status().isForbidden());                // the patient
        send(patch("/api/appointments/" + id + "/status"), login("nurse", "nurse123"), approve, status().isForbidden()); // a nurse
        send(patch("/api/appointments/" + id + "/status"), login("dr.arjun", "doctor123"), approve, status().isForbidden()); // another doctor
        send(patch("/api/appointments/" + id + "/status"), login("doctor", "doctor123"), approve, status().isOk());          // the chosen doctor
        send(patch("/api/appointments/" + id + "/status"), login("doctor", "doctor123"), "{\"status\":\"REJECTED\"}", status().isConflict());

        JsonNode mine = json(send(get("/api/portal/appointments"), patient, null, status().isOk()));
        assertEquals("APPROVED", mine.get(0).get("status").asText());
    }

    @Test
    void slotsAreHalfHourBlocksAndATakenSlotCannotBeBookedAgain() throws Exception {
        String first = register("slotA" + System.nanoTime());
        String second = register("slotB" + System.nanoTime());
        long sana = doctorId(first, "sana");
        LocalDate day = LocalDate.now().plusDays(3);

        JsonNode before = json(send(get("/api/portal/doctors/" + sana + "/slots").param("date", day.toString()), first, null, status().isOk()));
        assertEquals(16, before.size());                       // 9:00 AM to 4:30 PM, every 30 minutes
        assertEquals("9:00 AM", before.get(0).get("label").asText());
        assertEquals("4:30 PM", before.get(15).get("label").asText());
        assertTrue(slot(before, "15:30").get("available").asBoolean());

        send(post("/api/portal/appointments"), first, booking(sana, day, "15:30"), status().isCreated());

        JsonNode after = json(send(get("/api/portal/doctors/" + sana + "/slots").param("date", day.toString()), second, null, status().isOk()));
        assertFalse(slot(after, "15:30").get("available").asBoolean());
        assertTrue(slot(after, "16:00").get("available").asBoolean());

        send(post("/api/portal/appointments"), second, booking(sana, day, "15:30"), status().isConflict());
        send(post("/api/portal/appointments"), second, booking(sana, day, "15:10"), status().isBadRequest());  // not on the grid
        send(post("/api/portal/appointments"), second, booking(sana, day, "17:00"), status().isBadRequest());  // after closing
        send(post("/api/portal/appointments"), second, booking(sana, day, "16:00"), status().isCreated());
    }

    @Test
    void adminAddsAndDeletesDoctors() throws Exception {
        String admin = login("admin", "admin123");
        String last = "Doc" + System.nanoTime();
        String body = "{\"firstName\":\"Test\",\"lastName\":\"" + last + "\",\"specialty\":\"Dermatology\"}";

        send(post("/api/admin/doctors"), login("nurse", "nurse123"), body, status().isForbidden());
        send(post("/api/admin/doctors"), login("doctor", "doctor123"), body, status().isForbidden());

        JsonNode created = json(send(post("/api/admin/doctors"), admin, body, status().isCreated()));
        String username = created.get("username").asText();
        String password = created.get("temporaryPassword").asText();
        long doctorId = created.get("doctor").get("id").asLong();
        assertTrue(username.startsWith("dr."));
        assertTrue(password.length() >= 12);

        // The new doctor can sign in, must change the temporary password, and shows up in patient search
        JsonNode session = json(send(post("/api/auth/login"), null,
                "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}", status().isOk()));
        assertTrue(session.get("mustChangePassword").asBoolean());
        assertEquals("DOCTOR", session.get("role").asText());
        String patient = register("fordoc" + System.nanoTime());
        assertEquals(doctorId, doctorId(patient, last.toLowerCase()));

        // A patient books them, then the admin deletes the doctor
        JsonNode appt = json(send(post("/api/portal/appointments"), patient,
                booking(doctorId, LocalDate.now().plusDays(4), "10:00"), status().isCreated()));
        send(delete("/api/admin/doctors/" + doctorId), admin, null, status().isNoContent());

        // The login stops working, the doctor leaves the search, and the booking is cancelled so the patient can rebook
        send(post("/api/auth/login"), null,
                "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}", status().isUnauthorized());
        assertEquals(0, json(send(get("/api/doctors").param("q", last.toLowerCase()), patient, null, status().isOk())).size());
        JsonNode mine = json(send(get("/api/portal/appointments"), patient, null, status().isOk()));
        assertEquals(appt.get("id").asLong(), mine.get(0).get("id").asLong());
        assertEquals("CANCELLED", mine.get(0).get("status").asText());

        // Admin can also reset a doctor's password
        JsonNode second = json(send(post("/api/admin/doctors"), admin, body.replace("Test", "Reset"), status().isCreated()));
        long id2 = second.get("doctor").get("id").asLong();
        JsonNode reset = json(send(post("/api/admin/doctors/" + id2 + "/reset-password"), admin, null, status().isOk()));
        assertNotEquals(second.get("temporaryPassword").asText(), reset.get("temporaryPassword").asText());
    }

    @Test
    void staffCreatedPatientGetsAGeneratedPasswordThatWorks() throws Exception {
        String nurse = login("nurse", "nurse123");
        String first = "Gen" + System.nanoTime();
        JsonNode body = json(send(post("/api/patients"), nurse,
                "{\"firstName\":\"" + first + "\",\"lastName\":\"Walker\"}", status().isCreated()));
        String username = body.get("username").asText();
        String password = body.get("temporaryPassword").asText();
        assertTrue(password.length() >= 12);

        JsonNode session = json(send(post("/api/auth/login"), null,
                "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}", status().isOk()));
        assertTrue(session.get("mustChangePassword").asBoolean());

        send(post("/api/account/password"), session.get("token").asText(),
                "{\"currentPassword\":\"" + password + "\",\"newPassword\":\"my-new-pass-9\"}", status().isOk());
        JsonNode again = json(send(post("/api/auth/login"), null,
                "{\"username\":\"" + username + "\",\"password\":\"my-new-pass-9\"}", status().isOk()));
        assertFalse(again.get("mustChangePassword").asBoolean());
    }

    @Test
    void nurseCannotPlaceOrdersButDoctorCan() throws Exception {
        String order = "{\"category\":\"LAB\",\"name\":\"CBC\"}";
        // The seeded patient (id 1) exists in every fresh in-memory database
        send(post("/api/patients/1/orders"), login("nurse", "nurse123"), order, status().isForbidden());
        send(post("/api/patients/1/orders"), login("doctor", "doctor123"), order, status().isCreated());
    }
}
