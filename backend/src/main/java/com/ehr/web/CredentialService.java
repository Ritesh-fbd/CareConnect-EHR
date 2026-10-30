package com.ehr.web;

import com.ehr.repo.UserRepo;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Locale;

/** Creates unique usernames and random temporary passwords for accounts that staff set up. */
@Component
public class CredentialService {
    private final UserRepo users;
    private final SecureRandom random = new SecureRandom();

    public CredentialService(UserRepo users) { this.users = users; }

    /** first.last, with a number added if it is taken. A prefix such as "dr." can be passed in. */
    public String uniqueUsername(String prefix, String first, String last) {
        String base = (prefix + first + "." + last).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9.]", "");
        if (base.isBlank() || base.equals(prefix) || base.equals(".")) base = prefix + "user";
        String username = base;
        int suffix = 1;
        while (users.findByUsername(username).isPresent()) username = base + suffix++;
        return username;
    }

    /** 12 characters, no look-alikes (0/O, 1/l/I), so it is easy to read out or type. */
    public String password() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        StringBuilder value = new StringBuilder();
        for (int i = 0; i < 12; i++) value.append(chars.charAt(random.nextInt(chars.length())));
        return value.toString();
    }
}
