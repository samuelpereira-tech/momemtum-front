# Groups API Documentation

This folder contains the API specification for managing groups within scheduled areas and the association of persons (members) to those groups.

## Overview

The Groups API provides endpoints for:
- Managing groups within scheduled areas (Áreas de Escala)
- Associating persons with groups as members
- Managing member responsibilities (roles) within groups

Groups are organizational units within a scheduled area that allow for better team management and role assignment. A person must be associated with a scheduled area (via Person Area API) before they can be added to a group within that area.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

## Endpoints

### List Groups in Scheduled Area

**GET** `/api/scheduled-areas/{scheduledAreaId}/groups`

Retrieves a paginated list of all groups within a scheduled area, including their members and member responsibilities.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)

**Query Parameters:**
- `page` (optional): Page number (starts at 1, default: 1)
- `limit` (optional): Number of items per page (max 100, default: 10)
- `name` (optional): Filter by group name (partial match, case-insensitive)

**Example Request:**
```
GET /api/scheduled-areas/def67890-e89b-12d3-a456-426614174004/groups?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "abc12345-e89b-12d3-a456-426614174003",
      "name": "Equipe de Plantão A",
      "description": "Grupo responsável pelo plantão noturno",
      "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
      "membersCount": 5,
      "members": [
        {
          "id": "xyz98765-e89b-12d3-a456-426614174005",
          "personId": "123e4567-e89b-12d3-a456-426614174000",
          "person": {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "fullName": "João Silva",
            "email": "joao.silva@example.com",
            "photoUrl": "https://example.com/photos/person-123e4567.jpg"
          },
          "responsibilities": [
            {
              "id": "456e7890-e89b-12d3-a456-426614174001",
              "name": "Líder",
              "description": "Lidera a equipe",
              "imageUrl": "https://example.com/images/responsibility-456e7890.jpg"
            },
            {
              "id": "789e0123-e89b-12d3-a456-426614174002",
              "name": "Executor",
              "description": "Executa tarefas operacionais",
              "imageUrl": null
            }
          ],
          "createdAt": "2024-01-15T10:30:00.000Z",
          "updatedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Scheduled area not found

---

### Get Group by ID

**GET** `/api/scheduled-areas/{scheduledAreaId}/groups/{groupId}`

Retrieves a specific group by its ID, including all members and their responsibilities.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `groupId` (required): Group unique identifier (UUID)

**Response (200 OK):**
```json
{
  "id": "abc12345-e89b-12d3-a456-426614174003",
  "name": "Equipe de Plantão A",
  "description": "Grupo responsável pelo plantão noturno",
  "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
  "scheduledArea": {
    "id": "def67890-e89b-12d3-a456-426614174004",
    "name": "Área de Produção"
  },
  "membersCount": 5,
  "members": [
    {
      "id": "xyz98765-e89b-12d3-a456-426614174005",
      "personId": "123e4567-e89b-12d3-a456-426614174000",
      "person": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "fullName": "João Silva",
        "email": "joao.silva@example.com",
        "photoUrl": "https://example.com/photos/person-123e4567.jpg"
      },
      "responsibilities": [
        {
          "id": "456e7890-e89b-12d3-a456-426614174001",
          "name": "Líder",
          "description": "Lidera a equipe",
          "imageUrl": "https://example.com/images/responsibility-456e7890.jpg"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Group or scheduled area not found

---

### Create Group

**POST** `/api/scheduled-areas/{scheduledAreaId}/groups`

Creates a new group within a scheduled area.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)

**Request Body:**
```json
{
  "name": "Nova Equipe",
  "description": "Descrição opcional do grupo"
}
```

**Response (201 Created):**
```json
{
  "id": "abc12345-e89b-12d3-a456-426614174003",
  "name": "Nova Equipe",
  "description": "Descrição opcional do grupo",
  "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
  "membersCount": 0,
  "members": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Validation Rules:**
- `name`: Required, 3-255 characters
- `description`: Optional, maximum 1000 characters

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Scheduled area not found
- `409 Conflict`: Group with this name already exists in the scheduled area
- `500 Internal Server Error`: Server error

---

### Update Group

**PATCH** `/api/scheduled-areas/{scheduledAreaId}/groups/{groupId}`

Updates a group's name and description. Only provided fields will be updated.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `groupId` (required): Group unique identifier (UUID)

**Request Body:**
```json
{
  "name": "Nome Atualizado",
  "description": "Nova descrição"
}
```

**Response (200 OK):**
```json
{
  "id": "abc12345-e89b-12d3-a456-426614174003",
  "name": "Nome Atualizado",
  "description": "Nova descrição",
  "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
  "membersCount": 5,
  "members": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T14:20:00.000Z"
}
```

**Validation Rules:**
- `name`: Optional, 3-255 characters (if provided)
- `description`: Optional, maximum 1000 characters (if provided)

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Group or scheduled area not found
- `409 Conflict`: Group with this name already exists in the scheduled area
- `500 Internal Server Error`: Server error

---

### Delete Group

**DELETE** `/api/scheduled-areas/{scheduledAreaId}/groups/{groupId}`

Removes a group and all its member associations. This operation cannot be undone.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `groupId` (required): Group unique identifier (UUID)

**Response (204 No Content):** Success, no response body

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Group or scheduled area not found
- `500 Internal Server Error`: Server error

---

## Group Members Endpoints

### Add Member to Group

**POST** `/api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members`

Adds a person to a group within a scheduled area. The person must already be associated with the scheduled area (via Person Area API). The person can have multiple responsibilities (roles) assigned within the group context.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `groupId` (required): Group unique identifier (UUID)

**Request Body:**
```json
{
  "personId": "123e4567-e89b-12d3-a456-426614174000",
  "responsibilityIds": [
    "456e7890-e89b-12d3-a456-426614174001",
    "789e0123-e89b-12d3-a456-426614174002"
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "xyz98765-e89b-12d3-a456-426614174005",
  "personId": "123e4567-e89b-12d3-a456-426614174000",
  "person": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "fullName": "João Silva",
    "email": "joao.silva@example.com",
    "photoUrl": "https://example.com/photos/person-123e4567.jpg"
  },
  "groupId": "abc12345-e89b-12d3-a456-426614174003",
  "group": {
    "id": "abc12345-e89b-12d3-a456-426614174003",
    "name": "Equipe de Plantão A"
  },
  "responsibilities": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "Líder",
      "description": "Lidera a equipe",
      "imageUrl": "https://example.com/images/responsibility-456e7890.jpg"
    },
    {
      "id": "789e0123-e89b-12d3-a456-426614174002",
      "name": "Executor",
      "description": "Executa tarefas operacionais",
      "imageUrl": null
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Validation Rules:**
- `personId`: Required, must exist and be associated with the scheduled area
- `responsibilityIds`: Required, array with at least one responsibility ID, all IDs must exist and belong to the scheduled area

**Error Responses:**
- `400 Bad Request`: Invalid input data (person not found, person not in scheduled area, responsibility not found, or responsibility doesn't belong to the area)
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Group or scheduled area not found
- `409 Conflict`: Person is already a member of this group
- `500 Internal Server Error`: Server error

---

### List Members in Group

**GET** `/api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members`

Retrieves a paginated list of all members in a group, including their responsibilities.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `groupId` (required): Group unique identifier (UUID)

**Query Parameters:**
- `page` (optional): Page number (starts at 1, default: 1)
- `limit` (optional): Number of items per page (max 100, default: 10)
- `personName` (optional): Filter by person name (partial match, case-insensitive)
- `personEmail` (optional): Filter by person email (partial match, case-insensitive)
- `responsibilityId` (optional): Filter by responsibility ID (show only members with this responsibility)

**Example Request:**
```
GET /api/scheduled-areas/def67890-e89b-12d3-a456-426614174004/groups/abc12345-e89b-12d3-a456-426614174003/members?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "xyz98765-e89b-12d3-a456-426614174005",
      "personId": "123e4567-e89b-12d3-a456-426614174000",
      "person": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "fullName": "João Silva",
        "email": "joao.silva@example.com",
        "photoUrl": "https://example.com/photos/person-123e4567.jpg"
      },
      "groupId": "abc12345-e89b-12d3-a456-426614174003",
      "responsibilities": [
        {
          "id": "456e7890-e89b-12d3-a456-426614174001",
          "name": "Líder",
          "description": "Lidera a equipe",
          "imageUrl": "https://example.com/images/responsibility-456e7890.jpg"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Group or scheduled area not found

---

### Get Group Member by ID

**GET** `/api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members/{memberId}`

Retrieves a specific group member by their member ID.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `groupId` (required): Group unique identifier (UUID)
- `memberId` (required): Group member unique identifier (UUID)

**Response (200 OK):**
```json
{
  "id": "xyz98765-e89b-12d3-a456-426614174005",
  "personId": "123e4567-e89b-12d3-a456-426614174000",
  "person": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "fullName": "João Silva",
    "email": "joao.silva@example.com",
    "photoUrl": "https://example.com/photos/person-123e4567.jpg"
  },
  "groupId": "abc12345-e89b-12d3-a456-426614174003",
  "group": {
    "id": "abc12345-e89b-12d3-a456-426614174003",
    "name": "Equipe de Plantão A"
  },
  "responsibilities": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "Líder",
      "description": "Lidera a equipe",
      "imageUrl": "https://example.com/images/responsibility-456e7890.jpg"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Group member, group, or scheduled area not found

---

### Update Group Member Responsibilities

**PATCH** `/api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members/{memberId}`

Updates the responsibilities assigned to a member within a group. The entire responsibilities list is replaced with the provided list.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `groupId` (required): Group unique identifier (UUID)
- `memberId` (required): Group member unique identifier (UUID)

**Request Body:**
```json
{
  "responsibilityIds": [
    "456e7890-e89b-12d3-a456-426614174001",
    "012e3456-e89b-12d3-a456-426614174005"
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "xyz98765-e89b-12d3-a456-426614174005",
  "personId": "123e4567-e89b-12d3-a456-426614174000",
  "person": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "fullName": "João Silva",
    "email": "joao.silva@example.com",
    "photoUrl": "https://example.com/photos/person-123e4567.jpg"
  },
  "groupId": "abc12345-e89b-12d3-a456-426614174003",
  "responsibilities": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "Líder",
      "description": "Lidera a equipe",
      "imageUrl": "https://example.com/images/responsibility-456e7890.jpg"
    },
    {
      "id": "012e3456-e89b-12d3-a456-426614174005",
      "name": "Supervisor",
      "description": "Supervisiona operações",
      "imageUrl": null
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T14:20:00.000Z"
}
```

**Validation Rules:**
- `responsibilityIds`: Required, array with at least one responsibility ID, all IDs must exist and belong to the scheduled area

**Error Responses:**
- `400 Bad Request`: Invalid input data (responsibility not found or doesn't belong to the area)
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Group member, group, or scheduled area not found
- `500 Internal Server Error`: Server error

---

### Remove Member from Group

**DELETE** `/api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members/{memberId}`

Removes a person from a group, including all their responsibility assignments within that group.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `groupId` (required): Group unique identifier (UUID)
- `memberId` (required): Group member unique identifier (UUID)

**Response (204 No Content):** Success, no response body

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Group member, group, or scheduled area not found
- `500 Internal Server Error`: Server error

---

### Get Group Member by Person ID

**GET** `/api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members/by-person/{personId}`

Retrieves the group member association for a specific person in a group. This is useful when you know the person ID but not the member ID.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `groupId` (required): Group unique identifier (UUID)
- `personId` (required): Person unique identifier (UUID)

**Response (200 OK):**
```json
{
  "id": "xyz98765-e89b-12d3-a456-426614174005",
  "personId": "123e4567-e89b-12d3-a456-426614174000",
  "person": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "fullName": "João Silva",
    "email": "joao.silva@example.com",
    "photoUrl": "https://example.com/photos/person-123e4567.jpg"
  },
  "groupId": "abc12345-e89b-12d3-a456-426614174003",
  "responsibilities": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "Líder",
      "description": "Lidera a equipe",
      "imageUrl": "https://example.com/images/responsibility-456e7890.jpg"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Person not a member of this group, or group/scheduled area not found

---

## Data Models

### CreateGroupDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Name of the group (3-255 characters) |
| description | string | No | Description of the group (max 1000 characters) |

### UpdateGroupDto

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Name of the group (3-255 characters) |
| description | string | Description of the group (max 1000 characters) |

### GroupResponseDto

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier for the group |
| name | string | Name of the group |
| description | string \| null | Description of the group |
| scheduledAreaId | UUID | ID of the scheduled area this group belongs to |
| scheduledArea | ScheduledAreaDto \| null | Scheduled area information (populated when requested) |
| membersCount | number | Number of members in the group |
| members | GroupMemberResponseDto[] | Array of group members (populated when requested) |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### CreateGroupMemberDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| personId | UUID | Yes | ID of the person to add to the group (must be associated with the scheduled area) |
| responsibilityIds | UUID[] | Yes | Array of responsibility IDs (must belong to the scheduled area, at least one required) |

### UpdateGroupMemberDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| responsibilityIds | UUID[] | Yes | Array of responsibility IDs (must belong to the scheduled area, at least one required) |

### GroupMemberResponseDto

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier for the group member association |
| personId | UUID | ID of the associated person |
| person | PersonInfoDto \| null | Person information (populated when requested) |
| groupId | UUID | ID of the group |
| group | GroupInfoDto \| null | Group information (populated when requested) |
| responsibilities | ResponsibilityInfoDto[] | Array of responsibilities assigned to the person in this group |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### PersonInfoDto

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Person unique identifier |
| fullName | string | Person's full name |
| email | string | Person's email address |
| photoUrl | string \| null | URL to the person's photo |

### GroupInfoDto

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Group unique identifier |
| name | string | Group name |

### ScheduledAreaDto

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Scheduled area unique identifier |
| name | string | Scheduled area name |

### ResponsibilityInfoDto

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Responsibility unique identifier |
| name | string | Responsibility name |
| description | string \| null | Responsibility description |
| imageUrl | string \| null | URL to the responsibility image |

### PaginatedGroupResponseDto

| Field | Type | Description |
|-------|------|-------------|
| data | GroupResponseDto[] | Array of groups |
| meta | PaginationMetaDto | Pagination metadata |

### PaginatedGroupMemberResponseDto

| Field | Type | Description |
|-------|------|-------------|
| data | GroupMemberResponseDto[] | Array of group members |
| meta | PaginationMetaDto | Pagination metadata |

### PaginationMetaDto

| Field | Type | Description |
|-------|------|-------------|
| page | number | Current page number |
| limit | number | Items per page |
| total | number | Total number of items |
| totalPages | number | Total number of pages |

---

## Business Rules

1. **Group Uniqueness**: Group names must be unique within a scheduled area. Attempting to create a group with a name that already exists in the same scheduled area will result in a 409 Conflict error.

2. **Person Must Be in Scheduled Area**: A person must be associated with a scheduled area (via Person Area API) before they can be added to a group within that area. Attempting to add a person who is not in the scheduled area will result in a 400 Bad Request error.

3. **One Person Per Group**: A person can only be a member of a specific group once. Attempting to add the same person again will result in a 409 Conflict error.

4. **Responsibilities Must Belong to Area**: All responsibility IDs provided when adding or updating a member must belong to the scheduled area. If any responsibility doesn't belong to the area, a 400 Bad Request error will be returned.

5. **At Least One Responsibility**: A member must have at least one responsibility assigned when added to a group, and when updating responsibilities.

6. **Cascade Deletion**: When a group is deleted, all member associations within that group are also deleted. When a member is removed from a group, all their responsibility assignments within that group are also removed.

7. **Responsibility Updates**: When updating member responsibilities, the entire list is replaced. To add a responsibility, include all existing responsibilities plus the new one.

8. **Group Deletion**: Deleting a group will remove all member associations, but will not affect the person's association with the scheduled area itself.

---

## Validation Rules

### Group

- `name`: Required, 3-255 characters, must be unique within the scheduled area
- `description`: Optional, maximum 1000 characters

### Group Member

- `personId`: Required, must be a valid UUID, must exist, and must be associated with the scheduled area
- `responsibilityIds`: Required, array with at least one UUID, all IDs must exist and belong to the scheduled area

---

## Pagination

All list endpoints support pagination with the following query parameters:
- `page` - Page number (default: 1, minimum: 1)
- `limit` - Items per page (default: 10, minimum: 1, maximum: 100)

The response includes a `meta` object with:
- `page` - Current page number
- `limit` - Items per page
- `total` - Total number of items
- `totalPages` - Total number of pages

---

## Filtering

### Groups

- Filter by name (partial match, case-insensitive)
- Multiple filters can be combined

### Group Members

- Filter by person name (partial match, case-insensitive)
- Filter by person email (partial match, case-insensitive)
- Filter by responsibility ID (show only members with this responsibility)
- Multiple filters can be combined

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "error": "Bad Request",
  "details": [
    "name must be longer than or equal to 3 characters",
    "personId must be a UUID"
  ]
}
```

Common HTTP status codes:
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Resource deleted successfully
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate name, person already in group)
- `500 Internal Server Error`: Server error

---

## Example Workflow

1. **Create a group in a scheduled area:**
   ```bash
   POST /api/scheduled-areas/{scheduledAreaId}/groups
   {
     "name": "Equipe de Plantão A",
     "description": "Grupo responsável pelo plantão noturno"
   }
   ```

2. **List all groups in a scheduled area:**
   ```bash
   GET /api/scheduled-areas/{scheduledAreaId}/groups?page=1&limit=10
   ```

3. **Add a person to a group (person must already be in the scheduled area):**
   ```bash
   POST /api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members
   {
     "personId": "123e4567-e89b-12d3-a456-426614174000",
     "responsibilityIds": [
       "456e7890-e89b-12d3-a456-426614174001",
       "789e0123-e89b-12d3-a456-426614174002"
     ]
   }
   ```

4. **List all members in a group:**
   ```bash
   GET /api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members?page=1&limit=10
   ```

5. **Update member responsibilities:**
   ```bash
   PATCH /api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members/{memberId}
   {
     "responsibilityIds": [
       "456e7890-e89b-12d3-a456-426614174001",
       "012e3456-e89b-12d3-a456-426614174005"
     ]
   }
   ```

6. **Remove member from group:**
   ```bash
   DELETE /api/scheduled-areas/{scheduledAreaId}/groups/{groupId}/members/{memberId}
   ```

7. **Delete group:**
   ```bash
   DELETE /api/scheduled-areas/{scheduledAreaId}/groups/{groupId}
   ```

---

## File Specification

- **api.json**: OpenAPI 3.0 specification file containing the complete API definition

