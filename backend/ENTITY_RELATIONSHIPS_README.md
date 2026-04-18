# TalentBridge Entities and Relationships

This document lists all persisted entities in the backend and explains how they relate to each other.

## Overview

TalentBridge uses microservices with separate databases.

- auth-service -> auth_db -> users
- job-service -> job_db -> jobs
- application-service -> application_db -> job_applications
- notification-service -> notif_db -> notifications

Because each service owns its own database, relationships are mostly maintained by ID references (for example, user_id, recruiter_id, job_id) rather than direct JPA foreign-key mappings across services.

## Entity Catalog

## 1. User (auth-service)

Table: users  
Primary key: id

Important fields:
- username (unique)
- email (unique)
- password
- fullName
- phoneNumber
- profileImageUrl
- profileImagePublicId
- bio
- location
- companyName
- role: ROLE_JOB_SEEKER | ROLE_RECRUITER | ROLE_ADMIN
- isActive
- isEmailVerified
- createdAt
- updatedAt

Used by other services via ID:
- Job.recruiterId -> User.id
- JobApplication.userId -> User.id
- JobApplication.recruiterId -> User.id
- Notification.userId -> User.id

## 2. Job (job-service)

Table: jobs  
Primary key: id

Important fields:
- title
- description
- company
- location
- jobType: FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP | FREELANCE
- experienceLevel: ENTRY | JUNIOR | MID | SENIOR | LEAD
- status: ACTIVE | CLOSED | DRAFT | EXPIRED
- salaryMin
- salaryMax
- salaryCurrency
- requirements
- responsibilities
- category
- skills
- recruiterId (references User.id logically)
- applicationDeadline
- isRemote
- viewsCount
- applicationsCount
- createdAt
- updatedAt

Used by other services via ID:
- JobApplication.jobId -> Job.id

## 3. JobApplication (application-service)

Table: job_applications  
Primary key: id  
Unique constraint: (user_id, job_id)

Important fields:
- userId (references User.id logically)
- jobId (references Job.id logically)
- recruiterId (references User.id logically)
- status: APPLIED | UNDER_REVIEW | SHORTLISTED | INTERVIEW_SCHEDULED | REJECTED | OFFERED | WITHDRAWN
- resumeUrl
- resumePublicId
- coverLetter
- applicantName
- applicantEmail
- applicantPhone
- jobTitle
- companyName
- statusNote
- appliedAt
- updatedAt

Used by other services via ID:
- Notification.applicationId -> JobApplication.id

## 4. Notification (notification-service)

Table: notifications  
Primary key: id

Important fields:
- userId (references User.id logically)
- applicationId (references JobApplication.id logically)
- to (recipient email)
- subject
- body
- type
- status: PENDING | SENT | FAILED
- errorMessage
- sentAt
- createdAt

## Relationship Map

## Cardinality

- User (recruiter) 1 -> many Job
- User (job seeker) 1 -> many JobApplication
- Job 1 -> many JobApplication
- User (recruiter) 1 -> many JobApplication (through recruiterId)
- JobApplication 1 -> many Notification
- User 1 -> many Notification

## Business Rules

- A user can apply to the same job only once (unique user_id + job_id).
- JobApplication stores denormalized snapshot fields (applicantName, applicantEmail, jobTitle, companyName) to preserve history even if source data changes later.
- Cross-service relations are validated through API calls and business logic, not by cross-database foreign keys.

## Mermaid ER Diagram

```mermaid
erDiagram
    USER {
        LONG id PK
        STRING username
        STRING email
        STRING role
        BOOLEAN isActive
    }

    JOB {
        LONG id PK
        LONG recruiterId FK_LOGICAL
        STRING title
        STRING status
    }

    JOB_APPLICATION {
        LONG id PK
        LONG userId FK_LOGICAL
        LONG jobId FK_LOGICAL
        LONG recruiterId FK_LOGICAL
        STRING status
    }

    NOTIFICATION {
        LONG id PK
        LONG userId FK_LOGICAL
        LONG applicationId FK_LOGICAL
        STRING status
        STRING type
    }

    USER ||--o{ JOB : posts
    USER ||--o{ JOB_APPLICATION : applies
    JOB ||--o{ JOB_APPLICATION : receives
    USER ||--o{ JOB_APPLICATION : owns_as_recruiter
    JOB_APPLICATION ||--o{ NOTIFICATION : triggers
    USER ||--o{ NOTIFICATION : receives
```

## Source Classes

- auth-service/src/main/java/com/jobportal/auth/model/User.java
- job-service/src/main/java/com/jobportal/job/model/Job.java
- application-service/src/main/java/com/jobportal/application/model/JobApplication.java
- notification-service/src/main/java/com/jobportal/notification/model/Notification.java
