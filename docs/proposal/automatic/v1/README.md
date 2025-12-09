# Automatic Schedule Generation and Schedule Management API Documentation

This folder contains the API specification for automatic schedule generation and schedule management within scheduled areas.

## Overview

The Automatic Schedule Generation API provides endpoints for generating schedules automatically based on various configurations (groups, people, teams) and managing those schedules. The system supports multiple generation types, period configurations, and distribution rules to ensure balanced and fair schedule assignments.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

---

## Table of Contents

1. [Schedule Generation Endpoints](#schedule-generation-endpoints)
2. [Schedule Management Endpoints](#schedule-management-endpoints)
3. [Schedule Members Endpoints](#schedule-members-endpoints)
4. [Schedule Comments Endpoints](#schedule-comments-endpoints)
5. [Data Models](#data-models)
6. [Business Rules](#business-rules)
7. [Generation Types](#generation-types)
8. [Period Types](#period-types)
9. [Distribution Rules](#distribution-rules)
10. [Validation Rules](#validation-rules)

---

## Schedule Generation Endpoints

### Generate Schedule Preview

**POST** `/api/scheduled-areas/{scheduledAreaId}/schedule-generations/preview`

Generates a preview of schedules that will be created based on the provided configuration. This endpoint does not create schedules, only returns a preview for validation.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)

**Request Body:**
```json
{
  "scheduledAreaId": "123e4567-e89b-12d3-a456-426614174000",
  "generationType": "group",
  "periodType": "daily",
  "periodStartDate": "2025-01-01",
  "periodEndDate": "2025-01-31",
  "groupConfig": {
    "groupIds": ["456e7890-e89b-12d3-a456-426614174001"],
    "groupsPerSchedule": 1,
    "distributionOrder": "balanced",
    "considerAbsences": true
  },
  "periodConfig": {
    "weekdays": [1, 2, 3, 4, 5],
    "startTime": "08:00",
    "endTime": "17:00",
    "excludedDates": ["2025-01-15"],
    "includedDates": []
  }
}
```

**Response (200 OK):**
```json
{
  "configuration": { /* ... */ },
  "schedules": [
    {
      "id": "preview-1",
      "startDatetime": "2025-01-01T08:00:00.000Z",
      "endDatetime": "2025-01-01T17:00:00.000Z",
      "groups": [
        {
          "id": "456e7890-e89b-12d3-a456-426614174001",
          "name": "Grupo A",
          "members": [
            {
              "personId": "789e0123-e89b-12d3-a456-426614174002",
              "personName": "João Silva",
              "personPhotoUrl": "https://example.com/photos/joao.jpg",
              "responsibilities": [
                {
                  "id": "resp-1",
                  "name": "Operador",
                  "imageUrl": null
                }
              ]
            }
          ]
        }
      ],
      "warnings": ["Repetição consecutiva detectada"],
      "errors": []
    }
  ],
  "summary": {
    "totalSchedules": 20,
    "totalParticipants": 15,
    "warnings": 2,
    "errors": 0,
    "distributionBalance": "balanced"
  }
}
```

**Validation Rules:**
- All required fields must be provided
- `periodStartDate` must be before or equal to `periodEndDate`
- For `group` generation type, `groupConfig` is required
- For `people` generation type, `peopleConfig` is required
- For `team_without_restriction` or `team_with_restriction` generation types, `teamConfig` is required
- Groups, teams, and persons referenced must exist and belong to the scheduled area

**Error Responses:**
- `400 Bad Request`: Invalid configuration or insufficient data
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Scheduled area, groups, teams, or persons not found

---

### Confirm and Create Schedule Generation

**POST** `/api/scheduled-areas/{scheduledAreaId}/schedule-generations`

Confirms the generation configuration and creates all schedules. This endpoint creates a schedule generation record and multiple schedule records based on the configuration.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)

**Request Body:** Same as preview endpoint

**Response (201 Created):**
```json
{
  "id": "gen-123e4567-e89b-12d3-a456-426614174000",
  "scheduledAreaId": "123e4567-e89b-12d3-a456-426614174000",
  "generationType": "group",
  "periodType": "daily",
  "periodStartDate": "2025-01-01",
  "periodEndDate": "2025-01-31",
  "configuration": { /* full configuration object */ },
  "totalSchedulesGenerated": 20,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "createdBy": "789e0123-e89b-12d3-a456-426614174002"
}
```

**Business Rules:**
- All schedules created are linked to the generation record
- Schedules cannot be individually deleted if they belong to a generation (must delete the entire generation)
- The generation record stores the full configuration for reference

**Error Responses:**
- `400 Bad Request`: Invalid configuration or validation errors
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Scheduled area, groups, teams, or persons not found
- `409 Conflict`: Cannot create generation due to conflicts. Common causes:
  - Existing schedules in the selected period that would conflict
  - Groups or persons being used in other active schedules
  - Database constraints preventing the operation

---

### List Schedule Generations

**GET** `/api/scheduled-areas/{scheduledAreaId}/schedule-generations`

Retrieves a paginated list of all schedule generations for a scheduled area.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)

**Query Parameters:**
- `page` (optional): Page number (starts at 1, default: 1)
- `limit` (optional): Number of items per page (max 100, default: 10)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "gen-123e4567-e89b-12d3-a456-426614174000",
      "scheduledAreaId": "123e4567-e89b-12d3-a456-426614174000",
      "generationType": "group",
      "periodType": "daily",
      "periodStartDate": "2025-01-01",
      "periodEndDate": "2025-01-31",
      "totalSchedulesGenerated": 20,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "createdBy": "789e0123-e89b-12d3-a456-426614174002"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### Get Schedule Generation by ID

**GET** `/api/scheduled-areas/{scheduledAreaId}/schedule-generations/{generationId}`

Retrieves a specific schedule generation with all its associated schedules.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `generationId` (required): Schedule generation unique identifier (UUID)

**Response (200 OK):** Same structure as create response

---

### Delete Schedule Generation

**DELETE** `/api/scheduled-areas/{scheduledAreaId}/schedule-generations/{generationId}`

Deletes a schedule generation and all schedules associated with it. This action cannot be undone.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `generationId` (required): Schedule generation unique identifier (UUID)

**Response (204 No Content):** Success, no response body

**Business Rules:**
- Deleting a generation deletes all associated schedules
- This action is irreversible
- Only the creator or administrators can delete generations

---

## Schedule Management Endpoints

### List Schedules

**GET** `/api/scheduled-areas/{scheduledAreaId}/schedules`

Retrieves a paginated list of schedules for a scheduled area. Supports filtering by schedule generation, date range, person, group, team, and status.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)

**Query Parameters:**
- `page` (optional): Page number (starts at 1, default: 1)
- `limit` (optional): Number of items per page (max 100, default: 10)
- `scheduleGenerationId` (optional): Filter by schedule generation ID
- `startDate` (optional): Filter by start date (inclusive, format: YYYY-MM-DD)
- `endDate` (optional): Filter by end date (inclusive, format: YYYY-MM-DD)
- `personId` (optional): Filter by person ID (schedules where this person participates)
- `groupId` (optional): Filter by group ID (schedules with this group)
- `teamId` (optional): Filter by team ID (schedules with this team)
- `status` (optional): Filter by schedule status (`pending`, `confirmed`, `cancelled`)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "schedule-123e4567-e89b-12d3-a456-426614174000",
      "scheduleGenerationId": "gen-123e4567-e89b-12d3-a456-426614174000",
      "scheduledAreaId": "123e4567-e89b-12d3-a456-426614174000",
      "startDatetime": "2025-01-01T08:00:00.000Z",
      "endDatetime": "2025-01-01T17:00:00.000Z",
      "scheduleType": "group",
      "status": "pending",
      "participantsCount": 5,
      "logs": [
        {
          "id": "log-123e4567-e89b-12d3-a456-426614174000",
          "scheduleId": "schedule-123e4567-e89b-12d3-a456-426614174000",
          "scheduleMemberId": null,
          "action": "schedule_created",
          "field": null,
          "oldValue": null,
          "newValue": null,
          "description": "Escala criada automaticamente",
          "userId": "user-123e4567-e89b-12d3-a456-426614174000",
          "userName": "Sistema",
          "createdAt": "2025-01-15T10:30:00.000Z"
        }
      ],
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### Create Manual Schedule

**POST** `/api/scheduled-areas/{scheduledAreaId}/schedules`

Creates a manual schedule (not generated automatically).

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)

**Request Body:**
```json
{
  "scheduledAreaId": "123e4567-e89b-12d3-a456-426614174000",
  "startDatetime": "2025-01-01T08:00:00.000Z",
  "endDatetime": "2025-01-01T17:00:00.000Z",
  "scheduleType": "group",
  "groupIds": ["456e7890-e89b-12d3-a456-426614174001"]
}
```

**For team schedule type:**
```json
{
  "scheduledAreaId": "123e4567-e89b-12d3-a456-426614174000",
  "startDatetime": "2025-01-01T08:00:00.000Z",
  "endDatetime": "2025-01-01T17:00:00.000Z",
  "scheduleType": "team",
  "teamId": "789e0123-e89b-12d3-a456-426614174002",
  "assignments": [
    {
      "personId": "abc12345-e89b-12d3-a456-426614174003",
      "teamRoleId": "role-123e4567-e89b-12d3-a456-426614174004"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "schedule-123e4567-e89b-12d3-a456-426614174000",
  "scheduleGenerationId": null,
  "scheduledAreaId": "123e4567-e89b-12d3-a456-426614174000",
  "startDatetime": "2025-01-01T08:00:00.000Z",
  "endDatetime": "2025-01-01T17:00:00.000Z",
  "scheduleType": "group",
  "status": "pending",
  "participantsCount": 5,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Validation Rules:**
- `endDatetime` must be after `startDatetime`
- For `group` type, `groupIds` is required and must not be empty
- For `team` type, `teamId` and `assignments` are required
- For `individual` type, `memberIds` is required
- Groups, teams, and persons must exist and belong to the scheduled area

---

### Get Schedule by ID

**GET** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}`

Retrieves a specific schedule with all its details including members, assignments, and comments.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `scheduleId` (required): Schedule unique identifier (UUID)

**Response (200 OK):**
```json
{
  "id": "schedule-123e4567-e89b-12d3-a456-426614174000",
  "scheduleGenerationId": "gen-123e4567-e89b-12d3-a456-426614174000",
  "scheduledAreaId": "123e4567-e89b-12d3-a456-426614174000",
  "startDatetime": "2025-01-01T08:00:00.000Z",
  "endDatetime": "2025-01-01T17:00:00.000Z",
  "scheduleType": "group",
  "status": "pending",
  "participantsCount": 5,
  "groups": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "Grupo A"
    }
  ],
  "members": [
    {
      "id": "member-123e4567-e89b-12d3-a456-426614174000",
      "personId": "789e0123-e89b-12d3-a456-426614174002",
      "person": {
        "id": "789e0123-e89b-12d3-a456-426614174002",
        "fullName": "João Silva",
        "email": "joao@example.com",
        "photoUrl": "https://example.com/photos/joao.jpg"
      },
      "responsibilityId": "resp-1",
      "responsibility": {
        "id": "resp-1",
        "name": "Operador",
        "imageUrl": null
      },
      "status": "pending",
      "present": null,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "comments": [
    {
      "id": "comment-123e4567-e89b-12d3-a456-426614174000",
      "content": "Observação importante sobre esta escala",
      "authorId": "789e0123-e89b-12d3-a456-426614174002",
      "authorName": "João Silva",
      "createdAt": "2025-01-15T11:00:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  ],
  "logs": [
    {
      "id": "log-123e4567-e89b-12d3-a456-426614174000",
      "scheduleId": "schedule-123e4567-e89b-12d3-a456-426614174000",
      "scheduleMemberId": null,
      "action": "schedule_created",
      "field": null,
      "oldValue": null,
      "newValue": null,
      "description": "Escala criada automaticamente",
      "userId": "user-123e4567-e89b-12d3-a456-426614174000",
      "userName": "Sistema",
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "log-223e4567-e89b-12d3-a456-426614174001",
      "scheduleId": "schedule-123e4567-e89b-12d3-a456-426614174000",
      "scheduleMemberId": "member-123e4567-e89b-12d3-a456-426614174000",
      "action": "member_added",
      "field": null,
      "oldValue": null,
      "newValue": null,
      "description": "João Silva adicionado à escala como Operador",
      "userId": "user-123e4567-e89b-12d3-a456-426614174000",
      "userName": "Sistema",
      "createdAt": "2025-01-15T10:31:00.000Z"
    }
  ],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

---

### Update Schedule

**PATCH** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}`

Updates a schedule. Only manual schedules can be fully updated. Automatically generated schedules can only have their status updated.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `scheduleId` (required): Schedule unique identifier (UUID)

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**For manual schedules only:**
```json
{
  "startDatetime": "2025-01-01T09:00:00.000Z",
  "endDatetime": "2025-01-01T18:00:00.000Z",
  "status": "confirmed"
}
```

**Business Rules:**
- Automatically generated schedules (with `scheduleGenerationId`) can only have `status` updated
- Manual schedules can have `startDatetime`, `endDatetime`, and `status` updated
- `endDatetime` must be after `startDatetime`

---

### Delete Schedule

**DELETE** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}`

Deletes a schedule. Only manual schedules can be deleted. Automatically generated schedules should be deleted through their schedule generation.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `scheduleId` (required): Schedule unique identifier (UUID)

**Response (204 No Content):** Success, no response body

**Business Rules:**
- Only manual schedules (`scheduleGenerationId` is null) can be deleted
- Automatically generated schedules must be deleted by deleting the entire generation
- Returns `400 Bad Request` if attempting to delete an automatically generated schedule

---

## Schedule Members Endpoints

### Add Member to Schedule

**POST** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}/members`

Adds a person to a schedule with a specific responsibility.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `scheduleId` (required): Schedule unique identifier (UUID)

**Request Body:**
```json
{
  "personId": "789e0123-e89b-12d3-a456-426614174002",
  "responsibilityId": "resp-1"
}
```

**Response (201 Created):**
```json
{
  "id": "member-123e4567-e89b-12d3-a456-426614174000",
  "personId": "789e0123-e89b-12d3-a456-426614174002",
  "person": {
    "id": "789e0123-e89b-12d3-a456-426614174002",
    "fullName": "João Silva",
    "email": "joao@example.com",
    "photoUrl": "https://example.com/photos/joao.jpg"
  },
  "responsibilityId": "resp-1",
  "responsibility": {
    "id": "resp-1",
    "name": "Operador",
    "imageUrl": null
  },
  "status": "pending",
  "present": null,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**Validation Rules:**
- Person must exist and be associated with the scheduled area
- Responsibility must exist and belong to the scheduled area
- Person cannot be added twice to the same schedule

---

### Update Schedule Member

**PATCH** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}/members/{memberId}`

Updates a schedule member's responsibility, status, or presence.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `scheduleId` (required): Schedule unique identifier (UUID)
- `memberId` (required): Schedule member unique identifier (UUID)

**Request Body:**
```json
{
  "responsibilityId": "resp-2",
  "status": "accepted",
  "present": true
}
```

**Request Body Fields:**
- `responsibilityId` (optional): New responsibility ID for the member
- `status` (optional): Member status (`pending`, `accepted`, `rejected`)
- `present` (optional): Whether the person was present (`true`, `false`, or `null` to unset)

**Response (200 OK):** Same structure as create response, including the updated `present` field

**Note:** All changes to schedule members (status, responsibility, presence) are automatically logged in `schedule_members_logs`.

---

### Remove Member from Schedule

**DELETE** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}/members/{memberId}`

Removes a person from a schedule.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `scheduleId` (required): Schedule unique identifier (UUID)
- `memberId` (required): Schedule member unique identifier (UUID)

**Response (204 No Content):** Success, no response body

**Note:** Removing a member automatically creates a log entry in `schedule_members_logs`.

---

## Schedule Logs

All changes to schedules and their members are automatically logged in `schedule_members_logs`. The logs are returned in the schedule details and list endpoints.

### Log Actions

The following actions are automatically logged:

- **Schedule Changes:**
  - `schedule_created`: When a schedule is created
  - `schedule_updated`: When a schedule is updated
  - `schedule_status_changed`: When the schedule status changes
  - `schedule_datetime_changed`: When start or end datetime changes

- **Member Changes:**
  - `member_added`: When a member is added to a schedule
  - `member_removed`: When a member is removed from a schedule
  - `member_status_changed`: When a member's status changes (pending/accepted/rejected)
  - `member_present_changed`: When a member's presence is marked or changed
  - `member_responsibility_changed`: When a member's responsibility changes

- **Team Changes:**
  - `team_changed`: When the team assigned to a schedule changes
  - `team_member_status_changed`: When a team member's status changes

### Log Structure

Each log entry contains:
- `id`: Unique log identifier
- `scheduleId`: ID of the schedule
- `scheduleMemberId`: ID of the member (if applicable, null for schedule-level changes)
- `action`: Type of action performed
- `field`: Field that was changed (optional)
- `oldValue`: Previous value (optional)
- `newValue`: New value (optional)
- `description`: Human-readable description of the change
- `userId`: ID of the user who made the change
- `userName`: Name of the user who made the change
- `createdAt`: Timestamp of when the change occurred

### Accessing Logs

Logs are included in:
- **GET** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}` - Returns logs in the schedule details
- **GET** `/api/scheduled-areas/{scheduledAreaId}/schedules` - Returns logs for each schedule in the list

---

## Schedule Comments Endpoints

### Add Comment to Schedule

**POST** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}/comments`

Adds a comment to a schedule.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `scheduleId` (required): Schedule unique identifier (UUID)

**Request Body:**
```json
{
  "content": "Observação importante sobre esta escala"
}
```

**Response (201 Created):**
```json
{
  "id": "comment-123e4567-e89b-12d3-a456-426614174000",
  "content": "Observação importante sobre esta escala",
  "authorId": "789e0123-e89b-12d3-a456-426614174002",
  "authorName": "João Silva",
  "createdAt": "2025-01-15T11:00:00.000Z",
  "updatedAt": "2025-01-15T11:00:00.000Z"
}
```

**Validation Rules:**
- `content` must be between 1 and 5000 characters
- Content cannot be empty or only whitespace

---

### Update Schedule Comment

**PATCH** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}/comments/{commentId}`

Updates a comment on a schedule. Only the comment author can update their comment.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `scheduleId` (required): Schedule unique identifier (UUID)
- `commentId` (required): Comment unique identifier (UUID)

**Request Body:**
```json
{
  "content": "Observação atualizada"
}
```

**Response (200 OK):** Same structure as create response

**Business Rules:**
- Only the comment author can update their comment
- Administrators can also update any comment

---

### Delete Schedule Comment

**DELETE** `/api/scheduled-areas/{scheduledAreaId}/schedules/{scheduleId}/comments/{commentId}`

Deletes a comment from a schedule. Only the comment author or administrators can delete comments.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `scheduleId` (required): Schedule unique identifier (UUID)
- `commentId` (required): Comment unique identifier (UUID)

**Response (204 No Content):** Success, no response body

**Business Rules:**
- Only the comment author or administrators can delete comments
- Returns `403 Forbidden` if user is not authorized to delete the comment

---

## Data Models

### GenerationConfigurationDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scheduledAreaId | UUID | Yes | Scheduled area where schedules will be generated |
| generationType | enum | Yes | Type: `group`, `people`, `team_without_restriction`, `team_with_restriction` |
| periodType | enum | Yes | Type: `fixed`, `monthly`, `weekly`, `daily` |
| periodStartDate | date | Yes | Start date of the generation period |
| periodEndDate | date | Yes | End date of the generation period |
| groupConfig | GroupGenerationConfigDto | Conditional | Required when generationType is `group` |
| peopleConfig | PeopleGenerationConfigDto | Conditional | Required when generationType is `people` |
| teamConfig | TeamGenerationConfigDto | Conditional | Required when generationType is `team_without_restriction` or `team_with_restriction` |
| periodConfig | PeriodConfigDto | Optional | Period-specific configuration |

### GroupGenerationConfigDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupIds | UUID[] | Yes | Array of group IDs to use in generation (min 1) |
| groupsPerSchedule | number | Yes | Number of groups to assign per schedule (min 1) |
| distributionOrder | enum | Yes | `sequential`, `random`, or `balanced` |
| considerAbsences | boolean | Yes | Whether to consider absences when selecting groups |
| excludedPersonIds | UUID[] | Optional | Person IDs to exclude from groups |

### PeopleGenerationConfigDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| considerAbsences | boolean | Yes | Whether to consider absences when selecting people |
| excludedPersonIds | UUID[] | Optional | Person IDs to exclude (all others are included by default) |

### TeamGenerationConfigDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| teamId | UUID | Yes | Team ID to use in generation |
| participantSelection | enum | Yes | `all`, `by_group`, `individual`, or `all_with_exclusions` |
| selectedGroupIds | UUID[] | Conditional | Required when participantSelection is `by_group` |
| selectedPersonIds | UUID[] | Conditional | Required when participantSelection is `individual` |
| excludedPersonIds | UUID[] | Conditional | Used when participantSelection is `all_with_exclusions` |
| considerAbsences | boolean | Yes | Whether to consider absences when selecting people |
| requireResponsibilities | boolean | Yes | Whether to require responsibilities (only for `team_with_restriction`) |
| repeatPersonsWhenInsufficient | boolean | Optional | Repeat people when not enough available (default: false) |

### PeriodConfigDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| baseDateTime | date-time | Optional | Base date/time for the first schedule |
| duration | number | Optional | Duration in days (weekly/monthly) or hours (fixed) |
| interval | number | Optional | Interval between schedules in days (for weekly, default: 7) |
| weekdays | number[] | Optional | Days of week (0-6) for daily type |
| startTime | string | Optional | Start time in HH:mm format (for daily) |
| endTime | string | Optional | End time in HH:mm format (for daily) |
| excludedDates | date[] | Optional | Dates to exclude from generation |
| includedDates | date[] | Optional | Dates to include even if they don't match pattern |

---

## Business Rules

### Schedule Generation Rules

1. **Preview Before Creation**: Always generate a preview before creating schedules to validate the configuration.

2. **Avoid Repetitions**: The system should avoid repeating groups, teams, or people in consecutive schedules when using balanced distribution.

3. **Consider Absences**: When `considerAbsences` is enabled:
   - For groups: Groups with members who have absences overlapping the schedule period are excluded
   - For people/teams: People with absences overlapping the schedule period are excluded

4. **Respect Fixed Persons**: In team generation, fixed persons (defined in `area_team_role_fixed_persons`) are always assigned first and have priority over selection rules.

5. **Validate Responsibilities**: When `requireResponsibilities` is enabled (team_with_restriction):
   - Only people with the matching responsibility can be assigned to a role
   - Responsibilities are checked from `person_area_responsibilities` and `area_group_member_responsibilities`
   - If selection is by group, only group member responsibilities are used

6. **Distribution Balance**: The system tracks assignment history to ensure balanced distribution:
   - People with fewer previous assignments are prioritized
   - In case of ties, rotation is used to ensure fair distribution

7. **Repeat Persons When Insufficient**: When `repeatPersonsWhenInsufficient` is enabled and there are not enough people to fill all roles, available people are repeated to fill remaining slots using balanced rotation.

8. **Group Exclusion**: When `excludedPersonIds` is provided in group generation, those people are excluded even if they are group members.

9. **Participant Selection Modes**:
   - `all`: All people in the scheduled area
   - `by_group`: Only people who belong to selected groups
   - `individual`: Only selected people
   - `all_with_exclusions`: All people except excluded ones

10. **Period Generation Rules**:
    - **Fixed**: Creates a single schedule with specific start and end datetime
    - **Weekly**: Creates schedules repeating weekly within the period, respecting interval
    - **Monthly**: Creates schedules repeating monthly on the same day
    - **Daily**: Creates schedules for each day matching weekdays, respecting excluded/included dates

11. **Date Exclusions and Inclusions**:
    - Excluded dates are skipped during generation
    - Included dates override exclusions and are always included
    - Included dates can include dates that don't match the weekday pattern

12. **Schedule Grouping**: All schedules created in a single generation are linked to the same `scheduleGenerationId`, allowing batch operations.

### Schedule Management Rules

1. **Manual vs Automatic**: 
   - Manual schedules (`scheduleGenerationId` is null) can be fully edited and deleted
   - Automatic schedules (have `scheduleGenerationId`) can only have status updated

2. **Schedule Types**:
   - `group`: Schedule assigned to one or more groups
   - `team`: Schedule assigned to a team with specific person-role assignments
   - `individual`: Schedule assigned to individual people

3. **Status Management**:
   - `pending`: Default status for new schedules
   - `confirmed`: Schedule is confirmed
   - `cancelled`: Schedule is cancelled

4. **Member Management**:
   - Members can be added, updated, or removed from schedules
   - Each member has a responsibility and status
   - Member status: `pending`, `accepted`, `rejected`

5. **Comment Management**:
   - Comments can be added to any schedule
   - Only the author can update their comment
   - Author or administrators can delete comments

---

## Generation Types

### 1. Generation by Groups

**Description**: Generates schedules by assigning complete groups to each schedule period.

**Configuration:**
- `groupIds`: Array of group IDs to use
- `groupsPerSchedule`: Number of groups per schedule
- `distributionOrder`: How to distribute groups
  - `sequential`: Fixed order, cycles through groups
  - `random`: Random order each time
  - `balanced`: Balanced distribution avoiding consecutive repetitions
- `considerAbsences`: Exclude groups with absent members
- `excludedPersonIds`: Exclude specific people even if they're in groups

**Example:**
- Groups: A, B, C
- `groupsPerSchedule`: 1
- `distributionOrder`: balanced
- Result: Week 1: A, Week 2: B, Week 3: C, Week 4: A (balanced rotation)

**Rules:**
- All members of selected groups participate
- Groups with many absent members are excluded (if `considerAbsences` is true)
- Distribution avoids consecutive repetitions when using balanced mode

---

### 2. Generation by People

**Description**: Generates schedules with all people in the area (except excluded ones).

**Configuration:**
- `excludedPersonIds`: People to exclude (all others are included)
- `considerAbsences`: Exclude people with absences

**Example:**
- Area has 20 people
- `excludedPersonIds`: [person-1, person-2]
- Result: All 18 remaining people participate

**Rules:**
- All people in the area are included by default
- Excluded people are removed
- People with absences are excluded (if `considerAbsences` is true)

---

### 3. Generation by Team (Without Restriction)

**Description**: Generates schedules by assigning people to team roles without requiring specific responsibilities.

**Configuration:**
- `teamId`: Team to use
- `participantSelection`: How to select participants
- `considerAbsences`: Exclude people with absences
- `repeatPersonsWhenInsufficient`: Repeat people when not enough available

**Example:**
- Team has roles: Baterista (1), Tecladista (1), Vocalista (2)
- Any person can be assigned to any role
- System distributes people to fill all roles

**Rules:**
- Fixed persons are assigned first (priority)
- Then remaining slots are filled with available people
- If `repeatPersonsWhenInsufficient` is enabled, people are repeated to fill slots
- Distribution is balanced to avoid over-assigning the same people

---

### 4. Generation by Team (With Restriction)

**Description**: Generates schedules by assigning people to team roles, but only people with matching responsibilities can be assigned.

**Configuration:**
- `teamId`: Team to use
- `participantSelection`: How to select participants
- `requireResponsibilities`: Must be `true` (enforced)
- `considerAbsences`: Exclude people with absences

**Example:**
- Team has roles: Baterista (requires "Baterista" responsibility), Vocalista (requires "Vocalista" responsibility)
- Only people with matching responsibilities can be assigned
- If no one has the responsibility, the role remains unassigned

**Rules:**
- Fixed persons are assigned first (if they have the responsibility)
- Only people with matching responsibilities can be assigned
- Responsibilities are checked from:
  - `person_area_responsibilities` (area-level)
  - `area_group_member_responsibilities` (group-level, if selection is by group)
- If selection is by group, only group member responsibilities are used
- Roles without eligible people remain unassigned (shown as "[Não atribuído]")

---

## Period Types

### 1. Fixed Period

**Description**: Creates a single schedule with specific start and end datetime.

**Configuration:**
- `baseDateTime`: Start date/time
- `endDatetime`: End date/time (calculated from baseDateTime + duration)

**Example:**
- `baseDateTime`: 2025-01-01 14:00
- `duration`: 2 hours
- Result: One schedule from 14:00 to 16:00 on 2025-01-01

---

### 2. Weekly Period

**Description**: Creates schedules repeating weekly within the period.

**Configuration:**
- `periodStartDate`: Start of period
- `periodEndDate`: End of period
- `baseDateTime`: Start date/time of first schedule
- `duration`: Duration of each schedule in days
- `interval`: Interval between schedules in days (default: 7)

**Example:**
- Period: 2025-01-01 to 2025-01-31
- `baseDateTime`: 2025-01-01 00:00
- `duration`: 7 days
- `interval`: 7 days
- Result: 4 schedules (weeks 1, 2, 3, 4)

---

### 3. Monthly Period

**Description**: Creates schedules repeating monthly on the same day.

**Configuration:**
- `periodStartDate`: Start of period
- `periodEndDate`: End of period
- `baseDateTime`: Start date/time (day of month is used)
- `duration`: Duration of each schedule in days

**Example:**
- Period: 2025-01-01 to 2025-12-31
- `baseDateTime`: 2025-01-01 00:00
- `duration`: 1 day
- Result: 12 schedules (1st of each month)

---

### 4. Daily Period

**Description**: Creates schedules for each day matching weekdays, with time restrictions.

**Configuration:**
- `periodStartDate`: Start of period
- `periodEndDate`: End of period
- `weekdays`: Days of week (0=Sunday, 6=Saturday)
- `startTime`: Start time (HH:mm)
- `endTime`: End time (HH:mm)
- `excludedDates`: Dates to exclude
- `includedDates`: Dates to include (override exclusions)

**Example:**
- Period: 2025-01-01 to 2025-01-31
- `weekdays`: [1, 2, 3, 4, 5] (Monday to Friday)
- `startTime`: 08:00
- `endTime`: 17:00
- `excludedDates`: [2025-01-15] (holiday)
- Result: ~20 schedules (weekdays except excluded dates)

---

## Distribution Rules

### Balanced Distribution

The system uses a balanced distribution algorithm to ensure fair assignment:

1. **Assignment History Tracking**: Tracks how many times each person has been assigned to each role
2. **Priority to Less Assigned**: People with fewer assignments are prioritized
3. **Rotation on Ties**: When multiple people have the same assignment count, rotation is used
4. **Avoid Consecutive Repetitions**: The system tries to avoid assigning the same person/group in consecutive schedules

### Sequential Distribution

Groups/people are assigned in a fixed order, cycling through the list.

### Random Distribution

Groups/people are assigned in random order each time (not recommended for production).

---

## Validation Rules

### Input Validation

1. **Required Fields**: All required fields must be provided
2. **Date Validation**: 
   - `periodStartDate` must be before or equal to `periodEndDate`
   - `endDatetime` must be after `startDatetime`
3. **UUID Validation**: All UUID fields must be valid UUIDs
4. **Enum Validation**: Enum fields must match allowed values
5. **Array Validation**: Arrays must have minimum required items when specified

### Business Validation

1. **Existence Checks**: 
   - Scheduled area must exist
   - Groups, teams, and persons must exist and belong to the scheduled area
   - Responsibilities must exist and belong to the scheduled area

2. **Relationship Validation**:
   - Groups must belong to the scheduled area
   - Teams must belong to the scheduled area
   - Persons must be associated with the scheduled area
   - Responsibilities must belong to the scheduled area

3. **Generation Validation**:
   - At least one group must be selected for group generation
   - At least one person must be available for people/team generation
   - Team must have roles defined
   - For team with restriction, at least some people must have required responsibilities

4. **Period Validation**:
   - Period dates must be valid
   - For daily type, at least one weekday must be selected
   - For daily type, startTime and endTime must be provided
   - Excluded dates must be within the period
   - Included dates can be outside the period

5. **Schedule Validation**:
   - Cannot delete automatically generated schedules individually
   - Cannot update startDatetime/endDatetime of automatically generated schedules
   - Members must belong to the scheduled area
   - Responsibilities must belong to the scheduled area

---

## Example Workflows

### Workflow 1: Generate Weekly Schedules by Groups

1. **Generate Preview**:
   ```bash
   POST /api/scheduled-areas/{areaId}/schedule-generations/preview
   {
     "scheduledAreaId": "{areaId}",
     "generationType": "group",
     "periodType": "weekly",
     "periodStartDate": "2025-01-01",
     "periodEndDate": "2025-01-31",
     "groupConfig": {
       "groupIds": ["{groupId1}", "{groupId2}", "{groupId3}"],
       "groupsPerSchedule": 1,
       "distributionOrder": "balanced",
       "considerAbsences": true
     },
     "periodConfig": {
       "baseDateTime": "2025-01-01T00:00:00.000Z",
       "duration": 7,
       "interval": 7
     }
   }
   ```

2. **Review Preview**: Check warnings and errors in the preview response

3. **Confirm Generation**:
   ```bash
   POST /api/scheduled-areas/{areaId}/schedule-generations
   {
     /* same configuration */
   }
   ```

4. **List Generated Schedules**:
   ```bash
   GET /api/scheduled-areas/{areaId}/schedules?scheduleGenerationId={generationId}
   ```

---

### Workflow 2: Generate Daily Team Schedules with Restrictions

1. **Generate Preview**:
   ```bash
   POST /api/scheduled-areas/{areaId}/schedule-generations/preview
   {
     "scheduledAreaId": "{areaId}",
     "generationType": "team_with_restriction",
     "periodType": "daily",
     "periodStartDate": "2025-01-01",
     "periodEndDate": "2025-01-31",
     "teamConfig": {
       "teamId": "{teamId}",
       "participantSelection": "all",
       "considerAbsences": true,
       "requireResponsibilities": true
     },
     "periodConfig": {
       "weekdays": [1, 2, 3, 4, 5],
       "startTime": "08:00",
       "endTime": "17:00",
       "excludedDates": ["2025-01-15"]
     }
   }
   ```

2. **Review Preview**: Check for unassigned roles and errors

3. **Confirm Generation**: Same as above

---

### Workflow 3: Create Manual Schedule

1. **Create Schedule**:
   ```bash
   POST /api/scheduled-areas/{areaId}/schedules
   {
     "scheduledAreaId": "{areaId}",
     "startDatetime": "2025-01-15T08:00:00.000Z",
     "endDatetime": "2025-01-15T17:00:00.000Z",
     "scheduleType": "team",
     "teamId": "{teamId}",
     "assignments": [
       {
         "personId": "{personId1}",
         "teamRoleId": "{roleId1}"
       },
       {
         "personId": "{personId2}",
         "teamRoleId": "{roleId2}"
       }
     ]
   }
   ```

2. **Add Comment**:
   ```bash
   POST /api/scheduled-areas/{areaId}/schedules/{scheduleId}/comments
   {
     "content": "Observação importante"
   }
   ```

3. **Update Status**:
   ```bash
   PATCH /api/scheduled-areas/{areaId}/schedules/{scheduleId}
   {
     "status": "confirmed"
   }
   ```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "message": "Error description",
  "statusCode": 400,
  "error": "Bad Request"
}
```

Common error codes:
- `400 Bad Request`: Invalid input data or validation errors
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Not authorized to perform the action
- `404 Not Found`: Resource not found
- `409 Conflict`: Conflict with existing data (e.g., person already in schedule)
- `500 Internal Server Error`: Server error

---

## File Specification

- **api.json**: OpenAPI 3.0 specification file containing the complete API definition
- **README.md**: This documentation file with detailed explanations and examples

