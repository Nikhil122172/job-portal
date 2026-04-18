package com.jobportal.auth.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEvent {
    private Long id;
    private String email;
    private String role;
    private String action; // REGISTERED, TOGGLED_STATUS, DELETED
}
