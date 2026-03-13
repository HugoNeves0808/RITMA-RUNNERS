package com.ritma.runners.mail.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    private String from;
    private String inviteAllowedDomains;

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getInviteAllowedDomains() {
        return inviteAllowedDomains;
    }

    public void setInviteAllowedDomains(String inviteAllowedDomains) {
        this.inviteAllowedDomains = inviteAllowedDomains;
    }
}
