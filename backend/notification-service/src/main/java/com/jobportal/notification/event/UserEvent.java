package com.jobportal.notification.event;

import lombok.Data;

@Data
public class UserEvent {
    private Long id;
    private String email;
    private String role;
    private String action;
}
