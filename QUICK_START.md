# 🚀 Quick Setup Guide - Freightrek Server

**Project Status:** ✅ Running successfully on port 3000

---

## ✅ What's Already Done

1. ✅ Dependencies installed
2. ✅ Server running (`npm run dev`)
3. ✅ MongoDB connected
4. ✅ TypeScript compiling
5. ✅ No errors detected

---

## 🎯 Quick Start (Already Running!)

Your server is currently running at: **http://localhost:3000**

### Current Status
```
✅ MongoDB connected
✅ Server running on port 3000
✅ Hot reload enabled (ts-node-dev)
```

---

## 📝 Testing the API

### 1. Register an Admin User

```bash
curl -X POST http://localhost:3000/admin/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Admin\",\"email\":\"admin@test.com\",\"phoneNo\":\"1234567890\",\"password\":\"Test@123\",\"roleId\":\"65abc123def456789\"}"
```

**Note:** You'll need a valid `roleId`. Create a role first or use an existing one from your database.

### 2. Login

```bash
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@test.com\",\"password\":\"Test@123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Use Protected Endpoints

```bash
# Replace <YOUR_TOKEN> with the token from login response
curl -X GET http://localhost:3000/admin/role \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 📁 Important Files Created

1. **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Complete coding guidelines for GitHub Copilot
2. **[README.md](README.md)** - Comprehensive project documentation
3. **[PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)** - Detailed technical analysis

---

## 🛠️ Available Commands

```bash
# Development (currently running)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Stop the dev server
Ctrl + C (in terminal)

# Docker deployment
docker-compose up -d
docker-compose down
```

---

## 🔐 Environment Variables

Your `.env` file is configured with:
- ✅ MONGO_URI (MongoDB Atlas connection)
- ✅ JWT_SECRET
- ✅ PORT (3000)

---

## 📚 API Endpoints

### Authentication (No auth required)
- `POST /admin/auth/register` - Register new admin
- `POST /admin/auth/login` - Login and get JWT token

### Roles (Auth required)
- `POST /admin/role` - Create role
- `GET /admin/role` - List roles
- `PUT /admin/role/:id` - Update role
- `DELETE /admin/role/:id` - Delete role

### Hubs (Auth required - Currently commented)
- `POST /admin/hub` - Create hub
- `GET /admin/hub` - List hubs
- `PUT /admin/hub/:id` - Update hub
- `DELETE /admin/hub/:id` - Delete hub

---

## 🎯 Next Steps

### Recommended Immediate Actions

1. **Test the API endpoints** using the curl commands above

2. **Create initial roles** in your database:
   ```javascript
   // Use MongoDB shell or Compass
   db.adminroles.insertOne({
     name: "Super Admin",
     permissions: ["all"],
     status: true
   })
   ```

3. **Enable hub routes** (currently commented in [src/routes/admin/index.ts](src/routes/admin/index.ts)):
   ```typescript
   // Uncomment this line:
   router.use("/hub", hubRoutes)
   ```

4. **Add rate limiting** for security:
   ```bash
   npm install express-rate-limit
   ```

5. **Add logging** (recommended):
   ```bash
   npm install winston
   ```

6. **Add Swagger documentation**:
   ```bash
   npm install swagger-jsdoc swagger-ui-express
   npm install -D @types/swagger-jsdoc @types/swagger-ui-express
   ```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <pid> /F

# Restart
npm run dev
```

### MongoDB connection issues
- Check `.env` file has correct `MONGO_URI`
- Verify MongoDB Atlas network access
- Check IP whitelist in MongoDB Atlas

### TypeScript errors
```bash
# Clean rebuild
Remove-Item -Recurse -Force dist, node_modules
npm install
npm run build
```

---

## 📊 Project Health

| Metric | Status |
|--------|--------|
| Server Running | ✅ Yes |
| Database Connected | ✅ Yes |
| TypeScript Errors | ✅ None |
| Dependencies | ✅ Up to date |
| Documentation | ✅ Complete |

---

## 🎓 Learning Resources

- **README.md** - Full project documentation
- **PROJECT_ANALYSIS.md** - Technical deep dive
- **.github/copilot-instructions.md** - Coding standards

---

## 🆘 Quick Help

**Server URL:** http://localhost:3000  
**MongoDB:** Connected via Atlas  
**Auth:** JWT Bearer tokens  
**Validation:** Yup schemas  

**Terminal Status:** Your dev server is running with hot reload enabled. Any changes to TypeScript files will automatically restart the server.

---

**Setup completed successfully! 🎉**

*Last updated: January 3, 2026*
