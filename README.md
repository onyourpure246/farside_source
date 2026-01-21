# CASDU Far-Side API

Backend API server for CASDU project, built with Hono framework, designed to be deployed on a standalone server with MySQL database and file system storage.

## 🚀 Features

- **Hono Framework**: Fast and lightweight web framework
- **MySQL Database**: Robust relational database support
- **File System Storage**: Direct file storage on server (replaces Cloudflare R2)
- **JWT Authentication**: Secure user authentication with JSON Web Tokens
- **Dual Authentication**: Supports both technical bearer tokens and user JWT tokens
- **TypeScript**: Full type safety and better developer experience
- **RESTful API**: Clean and consistent API design

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
cd casdu_farside
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=casdu_db

# File Storage Configuration
FILE_UPLOAD_PATH=/path/to/upload/directory

# Authentication Secrets
AUTH_SECRET=your-auth-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-key-must-be-long-and-random-change-in-production

# Server Configuration
PORT=3000
NODE_ENV=development
```

5. Set up the database:
   - Create a MySQL database
   - Run the SQL migrations (see `Database Schema` section below)

6. Create the upload directory:
```bash
mkdir -p /path/to/upload/directory
chmod 755 /path/to/upload/directory
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Health Check
```
GET /health
```

### Authentication Endpoints
```
POST   /api/fy2569/auth/login
POST   /api/fy2569/auth/register
GET    /api/fy2569/auth/me
PUT    /api/fy2569/auth/profile
PUT    /api/fy2569/auth/password
GET    /api/fy2569/auth/users
DELETE /api/fy2569/auth/users/:id
```

### Commons Endpoints (Participants & Tags)
```
GET    /api/fy2569/commons/participants
GET    /api/fy2569/commons/participants/:id
POST   /api/fy2569/commons/participants
PUT    /api/fy2569/commons/participants/:id
DELETE /api/fy2569/commons/participants/:id

GET    /api/fy2569/commons/tags
GET    /api/fy2569/commons/tags/:id
POST   /api/fy2569/commons/tags
PUT    /api/fy2569/commons/tags/:id
DELETE /api/fy2569/commons/tags/:id
```

### Planner Endpoints (Projects, Tasks, Task Participants)
```
GET    /api/fy2569/planner/projects
GET    /api/fy2569/planner/projects/:id
POST   /api/fy2569/planner/projects
PUT    /api/fy2569/planner/projects/:id
DELETE /api/fy2569/planner/projects/:id

GET    /api/fy2569/planner/tasks
GET    /api/fy2569/planner/tasks/:id
POST   /api/fy2569/planner/tasks
PUT    /api/fy2569/planner/tasks/:id
DELETE /api/fy2569/planner/tasks/:id

GET    /api/fy2569/planner/task-participants
POST   /api/fy2569/planner/task-participants
DELETE /api/fy2569/planner/task-participants/:id
```

### Download System Endpoints
```
GET    /api/fy2569/dl/folder/:id
GET    /api/fy2569/dl/folder/:id/contents
POST   /api/fy2569/dl/folder
PUT    /api/fy2569/dl/folder/:id
DELETE /api/fy2569/dl/folder/:id

GET    /api/fy2569/dl/file/:id
GET    /api/fy2569/dl/file/:id/download
POST   /api/fy2569/dl/file
POST   /api/fy2569/dl/file/upload
PUT    /api/fy2569/dl/file/:id
DELETE /api/fy2569/dl/file/:id
```

## 🗄️ Database Schema

The application requires the following database tables:

### Common Tables
- `common_users` - User accounts and authentication
- `common_participants` - Project participants
- `common_tags` - Tags for tasks

### Planner Tables
- `planner_projects` - Projects
- `planner_tasks` - Tasks within projects
- `planner_task_participants` - Task assignments
- `planner_task_tags` - Task-tag relationships

### Download System Tables
- `dl_folders` - Folder structure
- `dl_files` - File metadata

See the original `casdu-backops/migrations/` directory for detailed SQL schemas.

## 🔐 Authentication

The API supports two authentication methods:

1. **Technical Bearer Token** (for system-to-system communication):
   ```
   Authorization: Bearer <AUTH_SECRET>
   ```

2. **User JWT Token** (for authenticated users):
   ```
   Authorization: Bearer <JWT_TOKEN>
   ```

To obtain a JWT token, use the login endpoint:
```bash
curl -X POST http://localhost:3000/api/fy2569/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

## 📁 Project Structure

```
casdu_farside/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── types.ts              # TypeScript type definitions
│   ├── middleware/           # Middleware functions
│   │   ├── auth.middleware.ts
│   │   ├── cors.middleware.ts
│   │   └── dual-auth.middleware.ts
│   ├── routes/              # API route handlers
│   │   ├── auth.routes.ts
│   │   ├── commons.routes.ts
│   │   ├── planner.routes.ts
│   │   └── download.routes.ts
│   └── services/            # Business logic services
│       ├── database.service.ts
│       ├── file-storage.service.ts
│       ├── auth.service.ts
│       ├── participant.service.ts
│       ├── project.service.ts
│       ├── task.service.ts
│       ├── tag.service.ts
│       └── download.service.ts
├── .env                     # Environment configuration (not in git)
├── .env.example             # Environment configuration template
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Deployment

### Standalone Server Deployment

1. Build the application:
```bash
npm run build
```

2. Copy files to server:
```bash
# Copy built files and dependencies
scp -r dist/ package.json package-lock.json user@server:/path/to/app/
```

3. On the server:
```bash
cd /path/to/app
npm install --production
```

4. Set up environment variables on server

5. Set up systemd service (example):
```ini
[Unit]
Description=CASDU Far-Side API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/app
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

6. Start the service:
```bash
sudo systemctl start casdu-farside
sudo systemctl enable casdu-farside
```

### Using PM2 (Alternative)

```bash
npm install -g pm2
pm2 start dist/index.js --name casdu-farside
pm2 save
pm2 startup
```

## 🔧 Development

### Type Checking
```bash
npm run typecheck
```

### Building
```bash
npm run build
```

## 📝 Migration from Cloudflare

This project was ported from `casdu-backops` which was designed for Cloudflare Workers. Key differences:

- **Database**: Cloudflare D1 → MySQL
- **File Storage**: Cloudflare R2 → File System
- **Runtime**: Cloudflare Workers → Node.js with @hono/node-server
- **Environment**: Cloudflare bindings → dotenv

## 📄 License

ISC

## 👥 Author

CASDU Development Team

---

For more information or support, please contact the development team.
