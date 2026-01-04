# Freightrek Server - GitHub Copilot Instructions

## Project Overview
Freightrek Server is a Node.js/TypeScript backend application built with Express.js and MongoDB. It provides admin authentication, role-based access control (RBAC), and hub management functionality for a freight management system.

## Tech Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.9+
- **Framework**: Express.js 5.x
- **Database**: MongoDB (Mongoose ODM 9.x)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Yup
- **Dev Tools**: ts-node-dev (hot reload)

## Architecture Patterns

### Project Structure
```
src/
├── app.ts                    # Express app configuration
├── server.ts                 # Server entry point
├── config/                   # Configuration files
│   ├── db.ts                # MongoDB connection
│   └── adminModule.ts       # Admin module config
├── controllers/             # Request handlers
│   └── admin/              # Admin-specific controllers
├── middleware/             # Express middleware
│   ├── auth.middleware.ts  # JWT authentication
│   ├── checkPermission.middleware.ts
│   └── validate.middleware.ts
├── models/                 # Mongoose models
│   ├── admin/             # Admin user & role models
│   └── hub/               # Hub models
├── routes/                # Route definitions
│   └── admin/            # Admin routes (auth, roles, hubs)
├── services/             # Business logic layer
│   └── admin/           # Admin service logic
├── validators/          # Yup validation schemas
│   └── admin/
├── utils/               # Utility functions
│   └── jwt.ts          # JWT token generation
└── types/              # TypeScript type definitions
    └── express.d.ts    # Extended Express types
```

### Layered Architecture
1. **Routes** → Define endpoints and attach middleware
2. **Controllers** → Handle HTTP request/response
3. **Services** → Business logic and data manipulation
4. **Models** → Database schema and operations
5. **Middleware** → Authentication, validation, permissions

## Coding Standards

### TypeScript Guidelines
- Use **strict mode** (enabled in tsconfig.json)
- Define interfaces for all data structures
- Use `Types.ObjectId` from mongoose for MongoDB references
- Leverage type inference but be explicit for public APIs
- Use `async/await` for asynchronous operations

### Express Patterns
```typescript
// Controller Pattern
export const controllerName = async (req: Request, res: Response) => {
  try {
    const result = await service.method(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
```

### Service Layer Pattern
- Always return structured responses: `{ success: boolean, message?: string, data?: any }`
- Handle business logic validation
- Keep services pure and testable
- Use transactions for multi-document operations

### Mongoose Patterns
```typescript
// Model definition
export interface IModelName {
  field: string;
  reference: Types.ObjectId;
}

const schema = new Schema<IModelName>({
  field: { type: String, required: true },
  reference: { type: Types.ObjectId, ref: 'RefModel', required: true }
}, { timestamps: true });

export const ModelName = model<IModelName>('ModelName', schema);
```

### Authentication & Authorization
- JWT tokens stored in Authorization header: `Bearer <token>`
- Use `authMiddleware` to protect routes
- Use `checkPermission` middleware for RBAC
- Password fields have `select: false` in schema

### Validation
- Use Yup for input validation
- Create reusable validation schemas in `validators/`
- Apply via `validate` middleware
- Validate at route level before controller

### Error Handling
- Always use try-catch in controllers
- Return consistent error structure
- Use appropriate HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request (validation errors)
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Internal Server Error

## Environment Variables
Required in `.env`:
```bash
MONGO_URI=mongodb://localhost:27017/freightrek
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
```

## Common Development Tasks

### Adding a New Feature Module
1. Create model in `src/models/<module>/`
2. Create service in `src/services/<module>/`
3. Create controller in `src/controllers/<module>/`
4. Create validator in `src/validators/<module>/`
5. Create routes in `src/routes/<module>/`
6. Register routes in `src/app.ts` or parent router

### Adding Authentication to Route
```typescript
import { authMiddleware } from '../../middleware/auth.middleware';
router.post('/endpoint', authMiddleware, controller.method);
```

### Adding Permission Check
```typescript
import { checkPermission } from '../../middleware/checkPermission.middleware';
router.post('/endpoint', authMiddleware, checkPermission(['permission']), controller.method);
```

### Adding Request Validation
```typescript
import { validate } from '../../middleware/validate.middleware';
import { validationSchema } from '../../validators/module/schema.validator';
router.post('/endpoint', validate(validationSchema), controller.method);
```

## Scripts
```bash
npm run dev      # Development with hot reload
npm run build    # Compile TypeScript to dist/
npm start        # Run production build
```

## Docker Usage
```bash
docker-compose up -d     # Start containerized app
docker-compose down      # Stop containers
```

## API Endpoint Patterns
Base URL: `http://localhost:3000`

### Admin Endpoints
- `POST /admin/auth/register` - Register admin user
- `POST /admin/auth/login` - Login admin user
- `POST /admin/role/*` - Role management (requires auth)
- `POST /admin/hub/*` - Hub management (requires auth)

## When Suggesting Code

### DO:
- Follow the established layered architecture
- Use existing patterns for controllers/services/models
- Add proper TypeScript types and interfaces
- Include error handling in try-catch blocks
- Use async/await consistently
- Follow the naming conventions in the codebase
- Suggest middleware for cross-cutting concerns
- Validate input data with Yup

### DON'T:
- Mix business logic in controllers (keep in services)
- Expose sensitive data in responses (e.g., passwords)
- Skip input validation
- Use callback patterns (use async/await)
- Hardcode configuration values (use environment variables)
- Return different response structures across endpoints
- Forget to handle errors properly

## Testing Recommendations
When implementing features, consider:
- Unit tests for services (pure business logic)
- Integration tests for API endpoints
- Validation tests for Yup schemas
- Mock MongoDB for unit tests
- Use supertest for API testing

## Security Best Practices
- Never commit `.env` file (already in .gitignore)
- Always hash passwords with bcryptjs
- Use JWT for stateless authentication
- Validate and sanitize all inputs
- Use `select: false` for sensitive fields
- Implement rate limiting for public endpoints
- Use HTTPS in production
- Set secure HTTP headers (helmet recommended)

## Database Conventions
- Use timestamps: `{ timestamps: true }` in schemas
- Index frequently queried fields
- Use soft deletes where appropriate (status field)
- Reference other models with `Types.ObjectId` and `ref`
- Use plural names for collection names (automatic)

## Common Patterns to Suggest

### Pagination
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 10;
const skip = (page - 1) * limit;

const results = await Model.find().skip(skip).limit(limit);
const total = await Model.countDocuments();
```

### Population
```typescript
const user = await AdminUser.findById(id).populate('roleId');
```

### Transaction
```typescript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // operations
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Module System
- Uses CommonJS (`"type": "commonjs"` in package.json)
- Use `import/export` syntax (transpiled by TypeScript)
- Enable `esModuleInterop` in tsconfig.json

## Tips for Copilot
- When generating controllers, always delegate to services
- When creating models, include proper indexes
- When adding routes, consider auth and validation middleware
- Keep concerns separated: routes → controllers → services → models
- Suggest environment variable for any configuration value
- Always include error handling
- Return consistent JSON response structures
