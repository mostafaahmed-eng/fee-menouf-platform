# FEE-MENOUF Smart University Platform — Security Documentation

## Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Nginx   │         │  Backend │         │Database  │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │                    │
     │ POST /auth/login   │                    │                    │
     │ ─────────────────► │ ─────────────────► │                    │
     │                    │                    │                    │
     │                    │                    │ SELECT user WHERE  │
     │                    │                    │ email = :email     │
     │                    │                    │ ─────────────────► │
     │                    │                    │                    │
     │                    │                    │ ◄───────────────── │
     │                    │                    │                    │
     │                    │                    │ bcrypt.compare()   │
     │                    │                    │                    │
     │                    │                    │ Generate:          │
     │                    │                    │ - JWT Access Token │
     │                    │                    │ - JWT Refresh Token│
     │                    │                    │ - Session          │
     │                    │                    │                    │
     │ ◄──────────────── │ ◄───────────────── │                    │
     │ {accessToken,      │                    │                    │
     │  refreshToken,     │                    │                    │
     │  user}             │                    │                    │
     │                    │                    │                    │
```

### Token Management

- **Access Token**: JWT signed with HS256, short-lived (15 min default)
- **Refresh Token**: JWT signed with separate secret, long-lived (7 days)
- **Storage**: Access tokens in memory (Zustand store); refresh token in httpOnly cookie
- **Rotation**: Refresh tokens rotated on each use (old token invalidated)
- **Revocation**: Server-side blacklist for immediate logout

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Minimum length**: 8 characters
- **Complexity**: Requires uppercase, lowercase, number, special character
- **History**: Last 5 passwords stored to prevent reuse
- **Rate limiting**: 5 attempts per 15-minute window per IP
- **Lockout**: Account locked after 5 failed attempts for 15 minutes

### Session Management

- **Session ID**: Random UUID stored in Redis with TTL
- **Concurrent Sessions**: Limited to 5 per user (configurable)
- **Device Tracking**: User agent and IP logged per session
- **Force Logout**: Admin can terminate all sessions for a user

## RBAC Implementation

### Role Hierarchy

```
SUPER_ADMIN
  └── ADMIN
        └── DEAN
              └── HEAD_OF_DEPARTMENT
                    └── PROFESSOR
                          └── ASSISTANT_PROFESSOR
                                └── TEACHING_ASSISTANT
                                      └── STUDENT (separate hierarchy)
RESEARCHER
LIBRARIAN
ACCOUNTANT
IT_SUPPORT
```

### Permission Model

```
Roles ──M:N──► Permissions
  │               │
  │               ├── users:read, users:create, users:update, users:delete
  │               ├── courses:read, courses:create, courses:update, courses:delete
  │               ├── grades:read, grades:create, grades:update
  │               ├── ai:use, ai:manage, ai:logs
  │               └── system:config, system:logs, system:backup
  │
  ▼
Users ──M:1──► Role ──M:N──► Permissions
```

### Guard Implementation

```typescript
// JwtAuthGuard — validates JWT token
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// RBAC Guard — checks user permissions
@Injectable()
export class RbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get('permissions', context.getHandler());
    if (!requiredPermissions) return true;
    const { user } = context.switchToHttp().getRequest();
    return user.permissions.some(p => requiredPermissions.includes(p));
  }
}

// Usage
@UseGuards(JwtAuthGuard, RbacGuard)
@Permissions('grades:update')
@Patch('grades/:id')
async updateGrade() {}
```

## Data Encryption

### At Rest

| Data Type              | Encryption Method      | Key Management                    |
|------------------------|------------------------|-----------------------------------|
| Passwords              | bcrypt (12 rounds)     | Not applicable (one-way hash)     |
| JWT Secrets            | Environment variable   | Server file system (0600)         |
| Personal Data (PII)    | AES-256-GCM            | Key in env, IV stored with data   |
| Refresh Tokens         | SHA-256 hash           | Not applicable                    |
| Database at rest       | Transparent Data Encryption (TDE) via PostgreSQL |
| Backups                | GPG symmetric + S3 SSE | Key in secure vault               |
| File Uploads (MinIO)   | MinIO SSE-S3           | MinIO-managed keys                |

### In Transit

| Connection              | Protocol        | Certificate                |
|-------------------------|-----------------|----------------------------|
| Client → Nginx          | HTTPS/TLS 1.3   | Let's Encrypt (RSA 4096)   |
| Nginx → Backend         | HTTP (internal Docker network) | None (isolated) |
| Backend → PostgreSQL    | TLS 1.2+        | Internal CA                |
| Backend → Redis         | AUTH password   | Optional TLS               |
| Backend → MinIO         | HTTPS (optional)| Self-signed                |
| AI Engine → OpenAI      | HTTPS/TLS 1.3   | OpenAI certificate         |

## API Security

### Rate Limiting

| Endpoint Group  | Limit  | Window | Response Header               |
|-----------------|--------|--------|-------------------------------|
| Auth            | 5/min  | 15 min | X-RateLimit-Auth-Remaining    |
| General API     | 100/min| 1 min  | X-RateLimit-Remaining         |
| AI              | 10/min | 1 min  | X-RateLimit-AI-Remaining      |
| Upload          | 10/hour| 1 hour | X-RateLimit-Upload-Remaining  |

### CORS Configuration

```typescript
app.enableCors({
  origin: [
    'https://fee-menouf.local',
    'https://admin.fee-menouf.local',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  exposedHeaders: ['Set-Cookie', 'Authorization'],
});
```

### Helmet Configuration

```typescript
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.fee-menouf.local", "wss://api.fee-menouf.local"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
}));
```

## Audit Logging

### Audit Events

| Category        | Events Logged                              | Retention |
|-----------------|--------------------------------------------|-----------|
| Authentication  | Login, logout, failed login, token refresh | 1 year    |
| User Management | Create, update, delete, role change         | 5 years   |
| Grade Changes   | Create, update, delete grade                | 5 years   |
| Course Changes  | Create, update, delete, enrollment          | 3 years   |
| Schedule Changes| Generate, modify, cancel                    | 3 years   |
| Sensitive Ops   | Backup, config change, permission change    | 5 years   |
| AI Engine       | Chat queries, document ingestion            | 1 year    |

### Audit Log Schema

```typescript
// audit-log.entity.ts
{
  id: UUID,
  userId: UUID,        // Who performed the action
  action: string,      // e.g., 'GRADE_UPDATE', 'USER_DELETE'
  entity: string,      // e.g., 'Grade', 'User'
  entityId: UUID,      // Affected record ID
  oldValues: JSONB,    // Snapshot before change
  newValues: JSONB,    // Snapshot after change
  ipAddress: string,   // Client IP
  userAgent: string,   // Browser/Client info
  timestamp: Date      // When it happened
}
```

### Log Integrity

- **Immutable**: Audit logs are append-only (no UPDATE/DELETE allowed)
- **Separate schema**: `audit` schema with restricted access
- **Crypto hash**: Each log entry contains hash of previous entry (blockchain-style)
- **Tamper detection**: Daily hash verification report generated
- **Access control**: Only SUPER_ADMIN can read audit logs; no one can modify

## GDPR / Data Privacy Compliance

### Personal Data Classification

| Category        | Examples                                    | Protection Level |
|-----------------|---------------------------------------------|------------------|
| Public          | Name, department, role                      | Low              |
| Internal        | Email, phone, student ID, schedule          | Medium           |
| Confidential    | Grades, attendance record, warnings         | High             |
| Sensitive       | National ID, password hash, IP logs         | Critical         |

### Data Protection Measures

1. **Data Minimization**
   - Only collect data necessary for academic operations
   - Automatic anonymization of records after 5 years of inactivity
   - No unnecessary PII stored in analytics/ML datasets

2. **Access Control**
   - Role-based access with principle of least privilege
   - Faculty can only view their own students' data
   - Students can only view their own records
   - All data access logged and auditable

3. **Data Retention**
   - Active students: Data retained until graduation + 3 years
   - Graduated: Academic records retained indefinitely (legal requirement)
   - AI conversations: Retained for 1 year, then anonymized
   - Audit logs: Retained per schedule above

4. **User Rights**
   - **Right to Access**: Users can download all their data via profile
   - **Right to Rectification**: Users can update profile information
   - **Right to Erasure**: Account deletion available (with legal restrictions)
   - **Right to Data Portability**: Export in JSON format
   - **Right to Object**: Opt-out of AI processing

5. **Data Processing Agreement**
   - OpenAI API: Only non-personal, anonymized queries sent
   - No PII included in RAG document chunks
   - All external API calls logged and monitored

6. **Breach Notification**
   - Internal notification within 24 hours of detection
   - Regulatory notification within 72 hours (if applicable)
   - Affected users notified within 7 days
   - Incident response plan documented and tested quarterly
