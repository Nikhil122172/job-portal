package com.jobportal.job.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobEvent {
    private Long id;
    private String title;
    private String company;
    private String action; // CREATED, UPDATED, DELETED
    private List<String> applicantEmails;
}
