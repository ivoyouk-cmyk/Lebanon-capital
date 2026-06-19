# Lebanon Capital Backend API

Node.js Express server with JSON-based database for user authentication and management.

## Setup

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and change JWT_SECRET to something secure
```

### 3. Start server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server will run on `http://localhost:5000`

## Default Admin Account

- **Username**: admin
- **Password**: admin123

⚠️ Change this in production!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user or admin

### User Profile
- `GET /api/user/profile` - Get current user profile (requires auth)
- `PUT /api/user/profile` - Update current user profile (requires auth)

### Admin (requires admin token)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get user statistics
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Delete user

## Database

Data is stored in `data.json` file with structure:
```json
{
  "users": [...],
  "admins": [...]
}
```

No external database required!

## Example Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "password": "password123",
    "country": "Lebanon",
    "phone": "+961701234567"
  }'
```

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "password123"
  }'
```

### Login Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin",
    "password": "admin123",
    "isAdmin": true
  }'
```

### Get All Users (Admin)
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
