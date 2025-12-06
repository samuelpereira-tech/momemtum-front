# Team Area API Documentation

This folder contains the API specification for managing teams within scheduled areas and their roles (funções) with quantities, priorities, and fixed person assignments.

## Overview

The Team Area API provides endpoints for:
- Managing teams within scheduled areas (Áreas de Escala)
- Defining roles (funções) within teams with quantities and priorities
- Assigning fixed persons to specific roles or leaving roles free for assignment
- Managing team names and descriptions

Teams are organizational units within a scheduled area that allow for structured role management. Each team can have multiple roles, where each role:
- Has a responsibility (função) associated with it
- Defines a quantity (number of people needed)
- Has a priority (lower number = higher priority, must be unique within the team)
- Can be either "free" (isFree=true) to be assigned to any person, or "fixed" (isFree=false) with specific persons assigned

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

### List Teams in Scheduled Area

**GET** `/api/scheduled-areas/{scheduledAreaId}/teams`

Retrieves a paginated list of all teams within a scheduled area, including their roles.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)

**Query Parameters:**
- `page` (optional): Page number (starts at 1, default: 1)
- `limit` (optional): Number of items per page (max 100, default: 10)
- `name` (optional): Filter by team name (partial match, case-insensitive)

**Example Request:**
```
GET /api/scheduled-areas/def67890-e89b-12d3-a456-426614174004/teams?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "abc12345-e89b-12d3-a456-426614174003",
      "name": "Equipe de Plantão A",
      "description": "Equipe responsável pelo plantão noturno",
      "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
      "roles": [
        {
          "id": "role-12345-e89b-12d3-a456-426614174003",
          "responsibilityId": "456e7890-e89b-12d3-a456-426614174001",
          "responsibilityName": "Líder",
          "quantity": 1,
          "priority": 1,
          "isFree": false,
          "fixedPersonIds": [
            "123e4567-e89b-12d3-a456-426614174000"
          ]
        },
        {
          "id": "role-12346-e89b-12d3-a456-426614174004",
          "responsibilityId": "789e0123-e89b-12d3-a456-426614174002",
          "responsibilityName": "Executor",
          "quantity": 3,
          "priority": 2,
          "isFree": true,
          "fixedPersonIds": []
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

### Get Team by ID

**GET** `/api/scheduled-areas/{scheduledAreaId}/teams/{teamId}`

Retrieves a specific team by its ID, including all roles and fixed person assignments.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `teamId` (required): Team unique identifier (UUID)

**Response (200 OK):**
```json
{
  "id": "abc12345-e89b-12d3-a456-426614174003",
  "name": "Equipe de Plantão A",
  "description": "Equipe responsável pelo plantão noturno",
  "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
  "scheduledArea": {
    "id": "def67890-e89b-12d3-a456-426614174004",
    "name": "Área de Produção"
  },
  "roles": [
    {
      "id": "role-12345-e89b-12d3-a456-426614174003",
      "responsibilityId": "456e7890-e89b-12d3-a456-426614174001",
      "responsibilityName": "Líder",
      "quantity": 1,
      "priority": 1,
      "isFree": false,
      "fixedPersonIds": [
        "123e4567-e89b-12d3-a456-426614174000"
      ]
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Team or scheduled area not found

---

### Create Team

**POST** `/api/scheduled-areas/{scheduledAreaId}/teams`

Creates a new team within a scheduled area. Roles can be added during creation or later via update.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)

**Request Body:**
```json
{
  "name": "Nova Equipe",
  "description": "Descrição opcional da equipe",
  "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
  "roles": []
}
```

**Response (201 Created):**
```json
{
  "id": "abc12345-e89b-12d3-a456-426614174003",
  "name": "Nova Equipe",
  "description": "Descrição opcional da equipe",
  "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
  "roles": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Validation Rules:**
- `name`: Required, 1-255 characters
- `description`: Optional, maximum 1000 characters
- `scheduledAreaId`: Required, must exist
- `roles`: Optional array, can be empty initially

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Scheduled area not found
- `409 Conflict`: Team with this name already exists in the scheduled area
- `500 Internal Server Error`: Server error

---

### Update Team

**PATCH** `/api/scheduled-areas/{scheduledAreaId}/teams/{teamId}`

Updates a team's name, description, and/or roles. Only provided fields will be updated. When updating roles, the entire roles array is replaced.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `teamId` (required): Team unique identifier (UUID)

**Request Body:**
```json
{
  "name": "Nome Atualizado",
  "description": "Nova descrição",
  "roles": [
    {
      "id": "role-12345-e89b-12d3-a456-426614174003",
      "responsibilityId": "456e7890-e89b-12d3-a456-426614174001",
      "quantity": 2,
      "priority": 1,
      "isFree": false,
      "fixedPersonIds": [
        "123e4567-e89b-12d3-a456-426614174000",
        "234e5678-e89b-12d3-a456-426614174001"
      ]
    },
    {
      "responsibilityId": "789e0123-e89b-12d3-a456-426614174002",
      "quantity": 3,
      "priority": 2,
      "isFree": true,
      "fixedPersonIds": []
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "abc12345-e89b-12d3-a456-426614174003",
  "name": "Nome Atualizado",
  "description": "Nova descrição",
  "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
  "roles": [
    {
      "id": "role-12345-e89b-12d3-a456-426614174003",
      "responsibilityId": "456e7890-e89b-12d3-a456-426614174001",
      "responsibilityName": "Líder",
      "quantity": 2,
      "priority": 1,
      "isFree": false,
      "fixedPersonIds": [
        "123e4567-e89b-12d3-a456-426614174000",
        "234e5678-e89b-12d3-a456-426614174001"
      ]
    },
    {
      "id": "role-12346-e89b-12d3-a456-426614174004",
      "responsibilityId": "789e0123-e89b-12d3-a456-426614174002",
      "responsibilityName": "Executor",
      "quantity": 3,
      "priority": 2,
      "isFree": true,
      "fixedPersonIds": []
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T14:20:00.000Z"
}
```

**Validation Rules:**
- `name`: Optional, 1-255 characters (if provided)
- `description`: Optional, maximum 1000 characters (if provided)
- `roles`: Optional array. When provided:
  - Each role must have a unique `priority` within the team
  - `responsibilityId` must exist and belong to the scheduled area
  - `quantity` must be at least 1
  - If `isFree` is false, `fixedPersonIds` must have at least one person
  - The number of `fixedPersonIds` cannot exceed `quantity`
  - All persons in `fixedPersonIds` must be associated with the scheduled area (via Person Area API)
  - When updating an existing role, include the `id` field. When adding a new role, omit the `id` field.

**Error Responses:**
- `400 Bad Request`: Invalid input data (e.g., duplicate priority, invalid quantity, fixed persons exceed quantity, person not in scheduled area, responsibility not in scheduled area)
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Team or scheduled area not found
- `409 Conflict`: Team with this name already exists in the scheduled area, or duplicate priority in roles
- `500 Internal Server Error`: Server error

---

### Delete Team

**DELETE** `/api/scheduled-areas/{scheduledAreaId}/teams/{teamId}`

Removes a team and all its roles. This operation cannot be undone.

**Path Parameters:**
- `scheduledAreaId` (required): Scheduled area unique identifier (UUID)
- `teamId` (required): Team unique identifier (UUID)

**Response (204 No Content):** Success, no response body

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Team or scheduled area not found
- `500 Internal Server Error`: Server error

---

## Data Models

### CreateTeamDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Name of the team (1-255 characters) |
| description | string | No | Description of the team (max 1000 characters) |
| scheduledAreaId | UUID | Yes | ID of the scheduled area this team belongs to |
| roles | CreateTeamRoleDto[] | No | Array of roles (funções) for the team (optional, can be added later) |

### UpdateTeamDto

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Name of the team (1-255 characters) |
| description | string | Description of the team (max 1000 characters) |
| roles | UpdateTeamRoleDto[] | Array of roles (funções) for the team. When provided, the entire roles array is replaced. |

### CreateTeamRoleDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| responsibilityId | UUID | Yes | ID of the responsibility (função) - must belong to the scheduled area |
| quantity | integer | Yes | Number of people needed for this role (minimum: 1) |
| priority | integer | Yes | Priority of this role (lower number = higher priority, minimum: 1). Must be unique within the team. |
| isFree | boolean | No | If true, the role is free to be assigned to any person. If false, specific fixed persons must be assigned. Default: true. |
| fixedPersonIds | UUID[] | Conditional | Array of person IDs assigned as fixed to this role. Required if isFree is false. All persons must be associated with the scheduled area. The number of fixed persons cannot exceed the quantity. |

### UpdateTeamRoleDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Conditional | ID of the role (required when updating existing role, omit when adding new role) |
| responsibilityId | UUID | Yes | ID of the responsibility (função) - must belong to the scheduled area |
| quantity | integer | Yes | Number of people needed for this role (minimum: 1) |
| priority | integer | Yes | Priority of this role (lower number = higher priority, minimum: 1). Must be unique within the team (excluding the role being updated). |
| isFree | boolean | No | If true, the role is free to be assigned to any person. If false, specific fixed persons must be assigned. |
| fixedPersonIds | UUID[] | Conditional | Array of person IDs assigned as fixed to this role. Required if isFree is false. All persons must be associated with the scheduled area. The number of fixed persons cannot exceed the quantity. |

### TeamResponseDto

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier for the team |
| name | string | Name of the team |
| description | string \| null | Description of the team |
| scheduledAreaId | UUID | ID of the scheduled area this team belongs to |
| scheduledArea | ScheduledAreaDto \| null | Scheduled area information (populated when requested) |
| roles | TeamRoleDto[] | Array of roles (funções) in the team |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### TeamRoleDto

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier for the team role |
| responsibilityId | UUID | ID of the responsibility (função) |
| responsibilityName | string | Name of the responsibility (função) - populated by the server |
| quantity | integer | Number of people needed for this role |
| priority | integer | Priority of this role (lower number = higher priority) |
| isFree | boolean | If true, the role is free to be assigned to any person. If false, specific fixed persons are assigned. |
| fixedPersonIds | UUID[] | Array of person IDs assigned as fixed to this role (empty if isFree is true) |

### ScheduledAreaDto

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Scheduled area unique identifier |
| name | string | Scheduled area name |

### PaginatedTeamResponseDto

| Field | Type | Description |
|-------|------|-------------|
| data | TeamResponseDto[] | Array of teams |
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

1. **Team Uniqueness**: Team names must be unique within a scheduled area. Attempting to create a team with a name that already exists in the same scheduled area will result in a 409 Conflict error.

2. **Role Priority Uniqueness**: Within a team, each role must have a unique priority. Attempting to create or update a role with a priority that already exists in the team (excluding the role being updated) will result in a 400 Bad Request or 409 Conflict error.

3. **Fixed Persons Validation**: 
   - If `isFree` is `false`, at least one person must be assigned in `fixedPersonIds`
   - The number of `fixedPersonIds` cannot exceed the `quantity` of the role
   - All persons in `fixedPersonIds` must be associated with the scheduled area (via Person Area API)

4. **Responsibility Must Belong to Area**: All `responsibilityId` values provided when creating or updating roles must belong to the scheduled area. If any responsibility doesn't belong to the area, a 400 Bad Request error will be returned.

5. **Quantity Minimum**: The `quantity` field must be at least 1 for all roles.

6. **Priority Minimum**: The `priority` field must be at least 1 for all roles.

7. **Role Updates**: When updating a team's roles via PATCH, the entire roles array is replaced. To update a specific role, include all existing roles plus the updated one. To add a new role, include all existing roles plus the new one (without an `id` field). To remove a role, omit it from the array.

8. **Team Deletion**: Deleting a team will remove all roles associated with it, but will not affect the persons or responsibilities themselves.

9. **Fixed Person Assignment**: When a role is marked as "fixed" (`isFree=false`), the persons assigned must be associated with the scheduled area. The system will validate this before allowing the assignment.

---

## Validation Rules

### Team

- `name`: Required, 1-255 characters, must be unique within the scheduled area
- `description`: Optional, maximum 1000 characters

### Team Role

- `responsibilityId`: Required, must be a valid UUID, must exist, and must belong to the scheduled area
- `quantity`: Required, must be an integer, minimum 1
- `priority`: Required, must be an integer, minimum 1, must be unique within the team
- `isFree`: Optional boolean, default `true`
- `fixedPersonIds`: 
  - Required if `isFree` is `false`
  - Must be an array of UUIDs
  - All person IDs must exist and be associated with the scheduled area (via Person Area API)
  - The length of the array cannot exceed `quantity`
  - Must have at least one person if `isFree` is `false`

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

### Teams

- Filter by name (partial match, case-insensitive)
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
    "name must be longer than or equal to 1 character",
    "priority must be unique within the team",
    "fixedPersonIds length cannot exceed quantity",
    "All persons in fixedPersonIds must be associated with the scheduled area"
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
- `409 Conflict`: Resource conflict (e.g., duplicate name, duplicate priority)
- `500 Internal Server Error`: Server error

---

## Example Workflow

1. **Create a team in a scheduled area:**
   ```bash
   POST /api/scheduled-areas/{scheduledAreaId}/teams
   {
     "name": "Equipe de Plantão A",
     "description": "Equipe responsável pelo plantão noturno",
     "scheduledAreaId": "def67890-e89b-12d3-a456-426614174004",
     "roles": []
   }
   ```

2. **List all teams in a scheduled area:**
   ```bash
   GET /api/scheduled-areas/{scheduledAreaId}/teams?page=1&limit=10
   ```

3. **Add a role to a team (fixed persons):**
   ```bash
   PATCH /api/scheduled-areas/{scheduledAreaId}/teams/{teamId}
   {
     "roles": [
       {
         "responsibilityId": "456e7890-e89b-12d3-a456-426614174001",
         "quantity": 2,
         "priority": 1,
         "isFree": false,
         "fixedPersonIds": [
           "123e4567-e89b-12d3-a456-426614174000",
           "234e5678-e89b-12d3-a456-426614174001"
         ]
       }
     ]
   }
   ```

4. **Add a role to a team (free assignment):**
   ```bash
   PATCH /api/scheduled-areas/{scheduledAreaId}/teams/{teamId}
   {
     "roles": [
       {
         "responsibilityId": "789e0123-e89b-12d3-a456-426614174002",
         "quantity": 3,
         "priority": 2,
         "isFree": true,
         "fixedPersonIds": []
       }
     ]
   }
   ```

5. **Update a team's role:**
   ```bash
   PATCH /api/scheduled-areas/{scheduledAreaId}/teams/{teamId}
   {
     "roles": [
       {
         "id": "role-12345-e89b-12d3-a456-426614174003",
         "responsibilityId": "456e7890-e89b-12d3-a456-426614174001",
         "quantity": 3,
         "priority": 1,
         "isFree": false,
         "fixedPersonIds": [
           "123e4567-e89b-12d3-a456-426614174000",
           "234e5678-e89b-12d3-a456-426614174001",
           "345e6789-e89b-12d3-a456-426614174002"
         ]
       }
     ]
   }
   ```

6. **Update team name and description:**
   ```bash
   PATCH /api/scheduled-areas/{scheduledAreaId}/teams/{teamId}
   {
     "name": "Nome Atualizado",
     "description": "Nova descrição"
   }
   ```

7. **Delete team:**
   ```bash
   DELETE /api/scheduled-areas/{scheduledAreaId}/teams/{teamId}
   ```

---

## File Specification

- **api.json**: OpenAPI 3.0 specification file containing the complete API definition



