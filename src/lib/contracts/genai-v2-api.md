# GenAI-v2 API Contract (Phase 3)

**Version:** 1.0  
**Last Updated:** November 25, 2025  
**Base URL:** `/api/generative/projects/:projectId`

---

## 1. Create Module

**Endpoint:** `POST /api/generative/projects/:projectId/modules`

**Description:** Create a new architecture module from LLM output or manual input.

**Request Headers:**
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

**Request Body (LLM Mode):**
```json
{
  "llm_output": {
    "module_name": "Order Processing",
    "nodes": [
      {
        "id": "mobile_app",
        "type": "client",
        "label": "Mobile App",
        "meta": { "platform": "React Native" }
      },
      {
        "id": "api_gateway",
        "type": "gateway",
        "label": "API Gateway"
      },
      {
        "id": "order_service",
        "type": "service",
        "label": "Order Service",
        "meta": { "language": "Node.js" }
      },
      {
        "id": "database",
        "type": "database",
        "label": "Orders DB",
        "meta": { "engine": "mongodb" }
      }
    ],
    "edges": [
      { "from": "mobile_app", "to": "api_gateway", "label": "HTTPS" },
      { "from": "api_gateway", "to": "order_service", "label": "REST" },
      { "from": "order_service", "to": "database", "label": "Mongoose" }
    ],
    "rationale": "Handles order placement, validation, and storage. Separates concerns between gateway and business logic.",
    "confidence": "high"
  }
}
```

**Request Body (Manual Mode):**
```json
{
  "name": "Order Processing",
  "description": "Handles order flow",
  "nodes": [...],
  "edges": [...],
  "rationale": "Core business logic for orders"
}
```

**Response (Success 200):**
```json
{
  "ok": true,
  "module": {
    "_id": "673a8f2e1234567890abcdef",
    "project_id": "6925989bbe55f01b3130be98",
    "name": "Order Processing",
    "description": null,
    "nodes": [...],
    "edges": [...],
    "rationale": "Handles order placement...",
    "status": "proposed",
    "created_by": "user123",
    "version": 1,
    "order": 1,
    "ai_feedback": {
      "confidence": "high",
      "raw": {...}
    },
    "created_at": "2025-11-25T10:30:00.000Z",
    "updated_at": "2025-11-25T10:30:00.000Z"
  }
}
```

**Response (Validation Error 400):**
```json
{
  "ok": false,
  "error": "llm_validation_failed",
  "details": [
    {
      "instancePath": "/nodes/0",
      "message": "must have required property 'type'"
    }
  ]
}
```

**Response (Unauthorized 401):**
```json
{
  "error": "Unauthorized"
}
```

---

## 2. List Modules

**Endpoint:** `GET /api/generative/projects/:projectId/modules`

**Description:** Retrieve all modules for a project, sorted by order and creation date.

**Request Headers:**
```json
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Response (Success 200):**
```json
{
  "ok": true,
  "modules": [
    {
      "_id": "673a8f2e1234567890abcdef",
      "project_id": "6925989bbe55f01b3130be98",
      "name": "Order Processing",
      "status": "approved",
      "nodes": [...],
      "edges": [...],
      "order": 1,
      "version": 2,
      "created_at": "2025-11-25T10:30:00.000Z"
    },
    {
      "_id": "673a8f2e1234567890abcd00",
      "name": "Real-time Tracking",
      "status": "proposed",
      "order": 2,
      "version": 1,
      "created_at": "2025-11-25T10:35:00.000Z"
    }
  ]
}
```

**Response (Empty 200):**
```json
{
  "ok": true,
  "modules": []
}
```

---

## 3. Get Single Module

**Endpoint:** `GET /api/generative/projects/:projectId/modules/:moduleId`

**Description:** Retrieve detailed information for a specific module.

**Response (Success 200):**
```json
{
  "ok": true,
  "module": {
    "_id": "673a8f2e1234567890abcdef",
    "project_id": "6925989bbe55f01b3130be98",
    "name": "Order Processing",
    "description": "Full order lifecycle management",
    "nodes": [...],
    "edges": [...],
    "rationale": "Handles order placement...",
    "status": "approved",
    "created_by": "user123",
    "approved_by": "user123",
    "version": 2,
    "order": 1,
    "ai_feedback": {
      "confidence": "high",
      "alternatives": ["Serverless approach", "Monolithic design"],
      "resources": ["https://microservices.io"]
    },
    "created_at": "2025-11-25T10:30:00.000Z",
    "updated_at": "2025-11-25T10:45:00.000Z"
  }
}
```

**Response (Not Found 404):**
```json
{
  "ok": false,
  "error": "Module not found"
}
```

---

## 4. Modify Module

**Endpoint:** `PATCH /api/generative/projects/:projectId/modules/:moduleId`

**Description:** Update module fields. If status is 'approved', changes to 'modified' and version increments.

**Request Body:**
```json
{
  "name": "Updated Order Processing",
  "description": "Enhanced with payment integration",
  "nodes": [
    {
      "id": "payment_gateway",
      "type": "service",
      "label": "Payment Gateway",
      "meta": { "provider": "Stripe" }
    }
  ],
  "edges": [
    { "from": "order_service", "to": "payment_gateway" }
  ],
  "rationale": "Added payment processing to order flow"
}
```

**Response (Success 200):**
```json
{
  "ok": true,
  "module": {
    "_id": "673a8f2e1234567890abcdef",
    "name": "Updated Order Processing",
    "status": "modified",
    "version": 3,
    "updated_at": "2025-11-25T11:00:00.000Z"
  }
}
```

**Response (Project Mismatch 403):**
```json
{
  "ok": false,
  "error": "Project mismatch"
}
```

---

## 5. Approve Module

**Endpoint:** `PATCH /api/generative/projects/:projectId/modules/:moduleId/approve`

**Description:** Approve module and merge into canonical architecture snapshot. Performs conflict detection before merge.

**Request Headers:**
```json
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Response (Success 200):**
```json
{
  "ok": true,
  "snapshot": {
    "_id": "673a9000abcdef1234567890",
    "project_id": "6925989bbe55f01b3130be98",
    "version": 2,
    "modules": [
      "673a8f2e1234567890abcdef"
    ],
    "nodes": [
      {
        "id": "mobile_app",
        "type": "client",
        "label": "Mobile App",
        "meta": { "platform": "React Native" }
      },
      {
        "id": "api_gateway",
        "type": "gateway",
        "label": "API Gateway"
      },
      {
        "id": "order_service",
        "type": "service",
        "label": "Order Service",
        "meta": { "language": "Node.js" }
      },
      {
        "id": "database",
        "type": "database",
        "label": "Orders DB",
        "meta": { "engine": "mongodb" }
      }
    ],
    "edges": [
      { "from": "mobile_app", "to": "api_gateway", "label": "HTTPS" },
      { "from": "api_gateway", "to": "order_service", "label": "REST" },
      { "from": "order_service", "to": "database", "label": "Mongoose" }
    ],
    "active": true,
    "created_by": "user123",
    "created_at": "2025-11-25T10:50:00.000Z"
  }
}
```

**Response (Conflict Detected 409):**
```json
{
  "ok": false,
  "requires_admin": true,
  "conflicts": [
    {
      "type": "node_type_mismatch",
      "message": "Node 'database' type conflict: existing='postgres' new='mongodb'",
      "details": {
        "existing": { "id": "database", "type": "postgres" },
        "incoming": { "id": "database", "type": "mongodb" }
      }
    },
    {
      "type": "gateway_plurality",
      "message": "Multiple API gateway nodes detected (2).",
      "details": {}
    }
  ],
  "review_id": "673a9100def1234567890abc"
}
```

**Response (Module Not Found 404):**
```json
{
  "ok": false,
  "error": "module_not_found"
}
```

---

## 6. Get Snapshots

**Endpoint:** `GET /api/generative/projects/:projectId/snapshots`

**Description:** Retrieve architecture snapshots. Supports multiple modes.

**Query Parameters:**
- `mode` (required): `latest` | `history` | `diff`
- `from_version` (required if mode=diff): Starting version number
- `to_version` (required if mode=diff): Ending version number

**Request Examples:**

```
GET /api/generative/projects/:projectId/snapshots?mode=latest
GET /api/generative/projects/:projectId/snapshots?mode=history
GET /api/generative/projects/:projectId/snapshots?mode=diff&from_version=1&to_version=3
```

**Response (mode=latest, Success 200):**
```json
{
  "ok": true,
  "snapshot": {
    "_id": "673a9000abcdef1234567890",
    "version": 3,
    "nodes": [...],
    "edges": [...],
    "modules": ["673a8f2e1234567890abcdef", "673a8f2e1234567890abcd00"],
    "active": true
  }
}
```

**Response (mode=history, Success 200):**
```json
{
  "ok": true,
  "snapshots": [
    {
      "_id": "673a9000abcdef1234567890",
      "version": 3,
      "nodes": [...],
      "active": true,
      "created_at": "2025-11-25T11:00:00.000Z"
    },
    {
      "_id": "673a8fff1234567890abcdef",
      "version": 2,
      "active": false,
      "created_at": "2025-11-25T10:50:00.000Z"
    },
    {
      "_id": "673a8ffe1234567890abcd00",
      "version": 1,
      "active": false,
      "created_at": "2025-11-25T10:40:00.000Z"
    }
  ]
}
```

**Response (mode=diff, Success 200):**
```json
{
  "ok": true,
  "diff": {
    "from_version": 1,
    "to_version": 3,
    "added_nodes": [
      { "id": "payment_service", "type": "service", "label": "Payment Service" },
      { "id": "notification_service", "type": "service", "label": "Notification Service" }
    ],
    "removed_nodes": [],
    "added_edges": [
      { "from": "order_service", "to": "payment_service" },
      { "from": "payment_service", "to": "notification_service" }
    ],
    "removed_edges": [],
    "node_count_change": 2,
    "edge_count_change": 2
  }
}
```

**Response (No Snapshot 404):**
```json
{
  "ok": false,
  "error": "No snapshots found"
}
```

---

## 7. Rollback Snapshot

**Endpoint:** `POST /api/generative/projects/:projectId/snapshots/rollback`

**Description:** Rollback to a previous snapshot version. Creates a NEW snapshot with old state (immutable pattern).

**Request Body:**
```json
{
  "target_version": 1
}
```

**Response (Success 200):**
```json
{
  "ok": true,
  "snapshot": {
    "_id": "673a9200new1234567890abc",
    "project_id": "6925989bbe55f01b3130be98",
    "version": 4,
    "nodes": [...],
    "edges": [...],
    "modules": ["673a8f2e1234567890abcdef"],
    "active": true,
    "created_by": "user123",
    "created_at": "2025-11-25T11:30:00.000Z"
  },
  "message": "Rolled back to version 1 (created new snapshot v4 with v1 state)"
}
```

**Response (Version Not Found 404):**
```json
{
  "ok": false,
  "error": "Target snapshot version not found"
}
```

**Response (Missing Version 400):**
```json
{
  "ok": false,
  "error": "target_version required"
}
```

---

## 8. Admin Review Queue (GET)

**Endpoint:** `GET /api/generative/projects/:projectId/admin/review`

**Description:** List pending conflict reviews for admin resolution.

**Query Parameters:**
- `status` (optional): `pending` | `reviewed` | `approved` | `rejected` (default: `pending`)

**Response (Success 200):**
```json
{
  "ok": true,
  "items": [
    {
      "_id": "673a9300review1234567890",
      "project_id": "6925989bbe55f01b3130be98",
      "module_id": "673a8f2e1234567890abcdef",
      "snapshot_version": 2,
      "conflicts": [
        {
          "type": "node_type_mismatch",
          "message": "Node 'database' type conflict",
          "details": {...}
        }
      ],
      "status": "pending",
      "created_at": "2025-11-25T11:00:00.000Z"
    }
  ]
}
```

---

## 9. Admin Resolve Review

**Endpoint:** `PATCH /api/generative/projects/:projectId/admin/review`

**Description:** Resolve a conflict review item (admin action).

**Request Body:**
```json
{
  "review_item_id": "673a9300review1234567890",
  "resolution": "approve_module1",
  "admin_notes": "Approved MongoDB as canonical database engine"
}
```

**Valid resolution values:**
- `approve_module1` - Approve conflicting module
- `approve_module2` - Approve alternative
- `manual_merge` - Admin will manually merge
- `reject_both` - Reject module entirely

**Response (Success 200):**
```json
{
  "ok": true,
  "review_item": {
    "_id": "673a9300review1234567890",
    "status": "reviewed",
    "resolution": "approve_module1",
    "reviewed_by": "admin_user_id",
    "reviewed_at": "2025-11-25T11:45:00.000Z",
    "admin_notes": "Approved MongoDB as canonical database engine"
  },
  "message": "Review item approve_module1"
}
```

---

## 10. Generate Modules from Proposal

**Endpoint:** `POST /api/generative/projects/:projectId/modules/generate`

**Description:** Auto-generate initial modules from Phase 2 proposal (Phase 2 → Phase 3 bridge).

**Request Headers:**
```json
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Response (Success 200):**
```json
{
  "ok": true,
  "modules": [
    {
      "_id": "673a8f2e1234567890abcdef",
      "name": "Authentication & User Management",
      "status": "proposed",
      "order": 1
    },
    {
      "_id": "673a8f2e1234567890abcd00",
      "name": "Order Processing",
      "status": "proposed",
      "order": 2
    },
    {
      "_id": "673a8f2e1234567890abcd01",
      "name": "Real-time Tracking",
      "status": "proposed",
      "order": 3
    }
  ],
  "message": "Generated 3 modules from proposal"
}
```

**Response (Already Generated 200):**
```json
{
  "ok": true,
  "message": "Modules already generated",
  "modules": [...]
}
```

**Response (Proposal Not Found 404):**
```json
{
  "error": "Proposal not found. Complete Phase 2 first."
}
```

---

## Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request body format |
| 401 | Unauthorized | Provide valid JWT token |
| 403 | Forbidden | User lacks permission (project mismatch) |
| 404 | Not Found | Resource (module/snapshot) doesn't exist |
| 409 | Conflict | Merge conflicts detected, requires admin review |
| 500 | Internal Server Error | Server-side issue, check logs |

---

## LLM Validation Schema (Ajv)

**All LLM outputs MUST pass this schema before persistence:**

```json
{
  "type": "object",
  "required": ["module_name", "nodes", "edges", "rationale", "confidence"],
  "additionalProperties": false,
  "properties": {
    "module_name": { "type": "string" },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type"],
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string" },
          "label": { "type": "string" },
          "meta": { "type": "object" }
        },
        "additionalProperties": false
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["from", "to"],
        "properties": {
          "from": { "type": "string" },
          "to": { "type": "string" },
          "meta": { "type": "object" }
        },
        "additionalProperties": false
      }
    },
    "rationale": { "type": "string" },
    "confidence": { "type": "string", "enum": ["low", "medium", "high"] }
  }
}
```

---

## Node Type Vocabulary (Whitelisted)

**Valid node types (15 total):**
- `client` - Mobile/web client applications
- `frontend` - Frontend applications
- `gateway` - API gateway
- `service` - Backend services
- `database` - Database systems
- `cache` - Caching layer (Redis, Memcached)
- `queue` - Message queue
- `messaging` - Messaging systems
- `auth` - Authentication service
- `blob_storage` - File/blob storage
- `search` - Search engine
- `realtime` - Real-time/WebSocket server
- `worker` - Background workers
- `monitoring` - Monitoring/logging
- `cdn` - Content delivery network

**Canonical Node IDs (18 total):**
mobile_app, web_app, api_gateway, auth_service, order_service, payment_service, tracking_service, notification_service, user_service, product_service, restaurant_service, delivery_service, database, redis, s3_bucket, websocket_server, message_queue, cdn

---

**End of Contract Document**
