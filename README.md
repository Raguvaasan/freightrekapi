# Freightrek Server

A robust Node.js/TypeScript backend server for freight management system with admin authentication, role-based access control (RBAC), and hub management.

## 🚀 Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control** - Permission-based authorization
- ✅ **Admin Management** - User and role administration
- ✅ **Hub Management** - Freight hub operations
- ✅ **TypeScript** - Full type safety
- ✅ **MongoDB** - NoSQL database with Mongoose ODM
- ✅ **Input Validation** - Yup schema validation
- ✅ **Docker Support** - Containerized deployment

## 📋 Prerequisites

- Node.js 20+ (recommended)
- MongoDB 5.0+ or MongoDB Atlas account
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Freightrek-server
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/freightrek
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/freightrek

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3000
```

## 🚀 Running the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Build
```bash
# Build TypeScript
npm run build

# Run production server
npm start
```

### Using Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
Freightrek-server/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # Server entry point
│   ├── config/
│   │   ├── db.ts                # MongoDB connection
│   │   └── adminModule.ts       # Admin configuration
│   ├── controllers/             # Request handlers
│   │   └── admin/
│   │       ├── auth.controller.ts
│   │       ├── role.controller.ts
│   │       └── hub.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT authentication
│   │   ├── checkPermission.middleware.ts  # RBAC
│   │   └── validate.middleware.ts   # Input validation
│   ├── models/                  # Mongoose schemas
│   │   ├── admin/
│   │   │   ├── adminUser.model.ts
│   │   │   └── role.model.ts
│   │   └── hub/
│   │       └── hub.model.ts
│   ├── routes/                  # API routes
│   │   └── admin/
│   │       ├── index.ts
│   │       ├── auth.routes.ts
│   │       ├── role.routes.ts
│   │       └── hub.routes.ts
│   ├── services/                # Business logic
│   │   └── admin/
│   │       ├── auth.service.ts
│   │       ├── role.service.ts
│   │       └── hub.service.ts
│   ├── validators/              # Yup validation schemas
│   │   └── admin/
│   ├── utils/
│   │   └── jwt.ts              # JWT utilities
│   └── types/
│       └── express.d.ts        # TypeScript declarations
├── dist/                        # Compiled JavaScript (generated)
├── .env                         # Environment variables (not in git)
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

#### Register Admin User
```http
POST /admin/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNo": "+1234567890",
  "password": "SecurePass123",
  "roleId": "mongodb-objectid"
}
```

#### Login
```http
POST /admin/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token-here"
}
```

### Protected Endpoints

All protected endpoints require the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Role Management
- `POST /admin/role` - Create role
- `GET /admin/role` - List roles
- `PUT /admin/role/:id` - Update role
- `DELETE /admin/role/:id` - Delete role

#### Hub Management
- `POST /admin/hub` - Create hub
- `GET /admin/hub` - List hubs
- `PUT /admin/hub/:id` - Update hub
- `DELETE /admin/hub/:id` - Delete hub

## 🔒 Security

- Passwords are hashed using bcryptjs
- JWT tokens for stateless authentication
- Environment variables for sensitive data
- MongoDB injection protection via Mongoose
- Input validation on all endpoints
- CORS enabled (configure as needed)

## 🧪 Testing API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@freightrek.com",
    "phoneNo": "+1234567890",
    "password": "Admin@123",
    "roleId": "65abc123def456789"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@freightrek.com",
    "password": "Admin@123"
  }'
```

### Using Postman/Insomnia

1. Import the endpoints
2. Set base URL: `http://localhost:3000`
3. For protected routes, add header:
   - Key: `Authorization`
   - Value: `Bearer <token-from-login>`

## 🛠️ Development

### Scripts
```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run production build
npm test         # Run tests (configure as needed)
```

### Code Style
- TypeScript strict mode enabled
- ES2020 target
- CommonJS modules
- Async/await for asynchronous operations
- Layered architecture (routes → controllers → services → models)

### Adding New Features

1. **Create Model** in `src/models/`
2. **Create Service** in `src/services/` (business logic)
3. **Create Controller** in `src/controllers/` (HTTP handlers)
4. **Create Validator** in `src/validators/` (input validation)
5. **Create Routes** in `src/routes/`
6. **Register Routes** in `src/app.ts`

## 🐳 Docker Deployment

The application includes Docker support for easy deployment:

```bash
# Build and run
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f node-ts-app

# Stop
docker-compose down
```

The Docker setup uses multi-stage builds for optimized image size.

## 📦 Dependencies

### Production
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `dotenv` - Environment configuration
- `yup` - Schema validation

### Development
- `typescript` - TypeScript compiler
- `ts-node-dev` - Development server with hot reload
- `@types/*` - TypeScript type definitions

## 🔧 Configuration

### MongoDB
- Local: `mongodb://localhost:27017/freightrek`
- Atlas: Update `MONGO_URI` in `.env` with your connection string

### JWT
- Set a strong secret in production
- Recommended: Use a random 256-bit string
- Token expiration: Configure via `JWT_EXPIRES_IN`

### Port
- Default: `3000`
- Change via `PORT` environment variable

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/freightrek` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d`, `24h`, `30m` |
| `PORT` | Server port | `3000` |

## 🚨 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running locally or connection string is correct
- Check firewall settings for cloud databases
- Verify network access in MongoDB Atlas

### Port Already in Use
```bash
# Change PORT in .env or kill process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors
```bash
# Clear and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JWT.io](https://jwt.io/)

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ using Node.js, TypeScript, and MongoDB**
