# Dyslexia Support Platform

An intelligent, comprehensive full-stack web application designed to support children with dyslexia. This platform allows parents and therapists to track assessments, manage activities, and monitor progress in a user-friendly interface.

## Features

✨ **Complete Solution Includes:**
- **User Authentication**: JWT-based parent login and registration
- **Child Management**: Track multiple children per parent
- **Assessment Tracking**: Record detailed dyslexia assessments with scoring
- **Activity Management**: Curated activities with difficulty levels  
- **Progress Monitoring**: Track child activity progress and completion
- **Database**: Fully normalized MySQL schema with proper relationships
- **REST API**: Comprehensive Express.js API with 20+ endpoints
- **Responsive Dashboard**: Modern React (Vite) frontend
- **Docker Ready**: One-click deployment with Docker Compose

## Technology Stack

### Backend
- **Node.js** (v18+): Runtime environment
- **Express.js** (v4.18+): Web framework
- **MySQL** (v8.0): Relational database
- **JWT**: Secure authentication
- **Bcrypt**: Password hashing

### Frontend
- **React** (v18.2+): UI library
- **Vite** (v5.0+): Build tool and dev server
- **Axios**: HTTP client
- **CSS3**: Modern styling with gradients and flexbox

### DevOps
- **Docker**: Container platform
- **Docker Compose**: Multi-container orchestration
- **Windows PowerShell**: Automated setup

## Project Structure

```
dyslexia-platform/
├── backend/
│   ├── src/
│   │   ├── server.js                 # Express application entry point
│   │   ├── db.js                     # MySQL connection pool
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT authentication middleware
│   │   └── routes/
│   │       ├── parents.js            # Parent auth & profile endpoints
│   │       ├── children.js           # Child CRUD endpoints
│   │       ├── assessments.js        # Assessment & results endpoints
│   │       └── activities.js         # Activity & progress endpoints
│   ├── sql/
│   │   ├── database.sql              # Complete database schema
│   │   └── init.sql                  # Legacy sample data
│   ├── Dockerfile                    # Backend container definition
│   ├── package.json                  # Backend dependencies
│   ├── .env                          # Environment configuration
│   └── .env.example                  # Environment template
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Main React component with dashboard
│   │   ├── App.css                   # Application styles
│   │   └── main.jsx                  # React DOM entry point
│   ├── index.html                    # HTML template
│   ├── vite.config.js                # Vite configuration
│   ├── package.json                  # Frontend dependencies
│   └── .env                          # API URL configuration
├── docker-compose.yml                # Multi-container orchestration
├── setup.ps1                         # Windows PowerShell setup script
├── .gitignore                        # Git ignore rules
├── .env.example                      # Root environment template
└── README.md                         # This file
```

## Database Schema

### Tables

#### **Therapist**
- `id`: Primary key
- `full_name`, `email`, `phone`: Contact information
- `created_at`, `updated_at`: Timestamps
- **Index**: `idx_email` on email for quick lookups

#### **Parent**
- `id`: Primary key
- `full_name`, `email`, `phone`: Profile information
- `password_hash`: Bcrypt hashed password
- `created_at`, `updated_at`: Timestamps
- **Unique**: Email must be unique
- **Index**: `idx_email` for authentication

#### **Child**
- `id`: Primary key
- `full_name`, `grade`: Student information
- `parent_id`: Foreign key to Parent (ON DELETE CASCADE)
- `created_at`, `updated_at`: Timestamps
- **Index**: `idx_parent_id` for parent queries

#### **Activity**
- `id`: Primary key
- `name`, `description`: Activity details
- `difficulty_level`: 1=Easy, 2=Medium, 3=Hard
- `created_at`, `updated_at`: Timestamps
- **Index**: `idx_difficulty_level` for filtering

#### **Assessment**
- `id`: Primary key
- `child_id`: Foreign key to Child (ON DELETE CASCADE)
- `assessment_date`: When assessment was performed
- `notes`: Additional observations
- `created_at`, `updated_at`: Timestamps
- **Index**: `idx_assessment_date` for temporal queries

#### **AssessmentResults**
- `id`: Primary key
- `assessment_id`: Foreign key to Assessment (ON DELETE CASCADE)
- `letter_recognition_score`: 0-100
- `word_reading_score`: 0-100
- `comprehension_score`: 0-100
- `overall_evaluation`: Text evaluation and recommendations
- `created_at`, `updated_at`: Timestamps
- **Unique**: One result per assessment

#### **ChildActivityProgress**
- `id`: Primary key
- `child_id`, `activity_id`: Foreign keys
- `completed`: Boolean completion status
- `completion_date`: When activity was completed
- `progress_percentage`: 0-100 progress
- `last_accessed`: Last interaction timestamp
- `created_at`, `updated_at`: Timestamps
- **Unique**: One progress record per child-activity pair
- **Indexes**: For child and activity lookups

### ER Diagram Concept

```
Therapist (1)
Parent (Many)
  ├── Child (Many per Parent)
  │   ├── Assessment (Many per Child)
  │   │   └── AssessmentResults (1 per Assessment)
  │   └── ChildActivityProgress (Many per Child)
  │       └── Activity
  └── Activity (Many)
```

## API Endpoints

### Health & Status
- `GET /api/health` - Server health check
- `GET /api/db-status` - Database connection status

### Parent Authentication & Profile
- `POST /api/parents/register` - Register new parent
  - **Body**: `{ full_name, email, phone, password }`
  - **Returns**: `{ id, full_name, email, message }`
  
- `POST /api/parents/login` - Parent login
  - **Body**: `{ email, password }`
  - **Returns**: `{ token, parentId, message }`
  - **Notes**: Returns JWT token valid for 24 hours
  
- `GET /api/parents/:id` - Get parent profile (Protected)
  - **Headers**: `Authorization: Bearer <token>`
  - **Returns**: `{ id, full_name, email, phone, created_at }`
  
- `PUT /api/parents/:id` - Update parent profile (Protected)
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ full_name, phone }`
  - **Returns**: `{ message }`

### Children Management
- `GET /api/children` - Get all children for authenticated parent (Protected)
  - **Headers**: `Authorization: Bearer <token>`
  - **Returns**: Array of child objects
  
- `GET /api/children/:id` - Get specific child (Protected)
  - **Headers**: `Authorization: Bearer <token>`
  - **Returns**: `{ id, full_name, grade, parent_id, created_at }`
  
- `POST /api/children` - Add new child (Protected)
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ full_name, grade }`
  - **Returns**: `{ id, full_name, grade, parent_id, message }`
  
- `PUT /api/children/:id` - Update child details (Protected)
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ full_name, grade }`
  - **Returns**: `{ message }`
  
- `DELETE /api/children/:id` - Delete child (Protected)
  - **Headers**: `Authorization: Bearer <token>`
  - **Returns**: `{ message }`

### Assessments
- `GET /api/assessments/child/:childId` - Get assessments for a child (Protected)
  - **Returns**: Array with assessment and results data
  
- `GET /api/assessments/:id` - Get specific assessment (Protected)
  - **Returns**: Assessment with combined results
  
- `POST /api/assessments` - Record new assessment (Protected)
  - **Body**:
    ```json
    {
      "child_id": 1,
      "assessment_date": "2026-02-14",
      "notes": "Optional notes",
      "letter_recognition_score": 85,
      "word_reading_score": 78,
      "comprehension_score": 82,
      "overall_evaluation": "Good progress"
    }
    ```
  - **Returns**: `{ assessment_id, child_id, assessment_date, message }`
  
- `PUT /api/assessments/:id` - Update assessment results (Protected)
  - **Body**: Scores and evaluation fields (same as POST)
  - **Returns**: `{ message }`

### Activities
- `GET /api/activities` - Get all activities (Protected)
  - **Returns**: Array of activity objects
  
- `GET /api/activities/:id` - Get specific activity (Protected)
  - **Returns**: `{ id, name, description, difficulty_level, created_at }`
  
- `POST /api/activities` - Create new activity (Protected)
  - **Body**: `{ name, description, difficulty_level }`
  - **Returns**: `{ id, name, description, difficulty_level, message }`
  
- `PUT /api/activities/:id` - Update activity (Protected)
  - **Body**: `{ name, description, difficulty_level }`
  - **Returns**: `{ message }`
  
- `GET /api/activities/child/:childId` - Get child's activity progress (Protected)
  - **Returns**: Array with activity data and progress info
  
- `POST /api/activities/track` - Track activity progress (Protected)
  - **Body**:
    ```json
    {
      "child_id": 1,
      "activity_id": 1,
      "completed": false,
      "completion_date": "2026-02-14",
      "progress_percentage": 50
    }
    ```
  - **Returns**: `{ message }`

## Quick Start

### Prerequisites
- Windows with PowerShell 5.1+
- Docker Desktop installed
- Node.js 18+ (optional, for local development)
- 4GB RAM minimum, 8GB recommended
- 2GB free disk space

### Automated Setup (Recommended)

1. **Run the setup script**:
   ```powershell
   cd c:\Users\ALEM\dyslexia-platform
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\setup.ps1
   ```

   This will:
   - Verify Docker and Node.js installation
   - Create all required directories
   - Install backend dependencies
   - Install frontend dependencies
   - Build Docker images

2. **Start Docker services**:
   ```powershell
   docker-compose up -d
   ```

   Wait for MySQL to become healthy (check status):
   ```powershell
   docker-compose ps
   ```

3. **Start frontend development server** (in a new terminal):
   ```powershell
   cd frontend
   npm run dev
   ```

4. **Open in browser**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

### Testing the Application

1. **Register as a parent**:
   - Go to the Register tab
   - Fill in name, email, phone, and create a password
   - Click "Register"

2. **Login**:
   - Use your registered credentials
   - Or use demo credentials: `john.smith@example.com` / `hashed_password_1`

3. **Manage children**:
   - Click "Children" tab
   - Add new children with name and grade
   - Click on a child card to select them

4. **Record assessments**:
   - Click "Assessments" tab
   - Fill in assessment date and scores
   - Click "Record Assessment"
   - View historical assessments in the table

5. **View activities**:
   - Click "Activities" tab
   - See all available dyslexia support activities
   - Difficulty levels: Easy (1), Medium (2), Hard (3)

### Local Development (Without Docker)

#### Setup MySQL Locally

1. Install MySQL Server 8.0+
2. Create database and user:
   ```sql
   CREATE DATABASE dyslexia_db;
   CREATE USER 'dyslexia_user'@'localhost' IDENTIFIED BY 'dyslexia_password';
   GRANT ALL PRIVILEGES ON dyslexia_db.* TO 'dyslexia_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Import schema:
   ```powershell
   mysql -u root -p dyslexia_db < backend/sql/database.sql
   ```

#### Start Services

1. **Backend** (Terminal 1):
   ```powershell
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend** (Terminal 2):
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=mysql (or localhost for local development)
DB_USER=root
DB_PASSWORD=dyslexia_password
DB_NAME=dyslexia_db
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

### Production Notes
⚠️ **IMPORTANT**: 
- Change `JWT_SECRET` to a secure random string in production
- Use strong database passwords
- Enable HTTPS for your API
- Set `NODE_ENV=production`

## Docker Management

### Common Commands

```powershell
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f mysql

# Check status
docker-compose ps

# Stop services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Restart services
docker-compose restart
```

### Accessing MySQL in Docker

```powershell
# Connect to MySQL from host
mysql -h 127.0.0.1 -u root -p dyslexia_db

# Or use Docker container
docker exec -it dyslexia-mysql mysql -u root -p dyslexia_db
```

## Development Workflow

### Backend Development
1. Edit files in `backend/src/`
2. Nodemon automatically restarts the server
3. Test changes via API endpoints or frontend
4. Check logs: `docker-compose logs -f backend`

### Frontend Development
1. Edit files in `frontend/src/`
2. Vite hot module replacement updates browser automatically
3. Open DevTools (F12) to see console errors
4. Changes appear instantly without page refresh

### Database Changes
1. For new tables, edit `backend/sql/database.sql`
2. Drop and recreate containers:
   ```powershell
   docker-compose down -v
   docker-compose up -d
   ```

## Production Deployment

### Building for Production

**Backend**:
```powershell
cd backend
npm install --production
docker build -t dyslexia-backend:prod .
```

**Frontend**:
```powershell
cd frontend
npm run build
# Deploy 'dist' folder to CDN or static hosting
```

### Production Checklist
- [ ] Change JWT_SECRET to secure value
- [ ] Use strong database password
- [ ] Set NODE_ENV=production
- [ ] Use environment-specific .env files
- [ ] Enable HTTPS/SSL
- [ ] Setup database backups
- [ ] Configure CORS for permitted origins
- [ ] Setup monitoring and logging
- [ ] Test authentication thoroughly
- [ ] Validate all API endpoints

## Troubleshooting

### Docker Issues

**MySQL not starting**:
```powershell
docker-compose logs mysql
docker-compose down -v  # Clean slate
docker-compose up -d
```

**Backend connection refused**:
- Ensure MySQL is healthy: `docker-compose ps`
- Wait 10-15 seconds for MySQL to initialize
- Check logs: `docker-compose logs backend`

**Port already in use**:
- Change port in `docker-compose.yml`
- Or: `docker-compose down` to free ports

### Frontend Issues

**Cannot connect to API**:
1. Check backend health: `curl http://localhost:5000/api/health`
2. Verify VITE_API_URL in `frontend/.env`
3. Check browser console for CORS errors
4. Ensure `.env` file is loaded: `npm run dev` shows URL

**Module not found**:
- Delete `node_modules` and package-lock.json
- Run `npm install` again

### Database Issues

**Tables not created**:
```powershell
# Manually import schema
docker exec dyslexia-mysql mysql -u root -pdyslexia_password dyslexia_db < backend/sql/database.sql
```

**Foreign key constraint errors**:
- Ensure parent records exist before inserting children
- Check constraint order in database.sql

## API Testing with curl

### Register
```powershell
curl -X POST http://localhost:5000/api/parents/register `
  -H "Content-Type: application/json" `
  -d '{"full_name":"Test Parent","email":"test@example.com","phone":"555-1234","password":"password123"}'
```

### Login
```powershell
curl -X POST http://localhost:5000/api/parents/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Children (requires token from login response)
```powershell
curl -X GET http://localhost:5000/api/children `
  -H "Authorization: Bearer <your_token>"
```

## Sample Data

Database initializes with:
- 1 Therapist (Dr. Sarah Johnson)
- 2 Sample Parents (John Smith, Mary Johnson)
- 3 Sample Children (Emma, Liam, Sophie)
- 5 Sample Activities (progressive difficulty)

Use sample data for testing or delete and create your own through the UI.

## Performance Optimization

### Indexes
- `Parent(email)` - Fast login lookups
- `Child(parent_id)` - Fast parent queries
- `Assessment(child_id, assessment_date)` - Combined index
- `ChildActivityProgress(child_id, activity_id)` - Unique pair

### Database Optimization Tips
- Use prepared statements (already implemented)
- Connection pooling with limit of 10 (configurable)
- Indexes on foreign keys and search columns

## Security Best Practices

✅ **Implemented**:
- JWT token-based authentication
- Bcrypt password hashing
- Input validation on all endpoints
- CORS protection
- SQL injection prevention (parameterized queries)

🔒 **Additional Recommendations**:
- Rate limiting on auth endpoints
- HTTPS/SSL in production
- Password complexity requirements
- Two-factor authentication
- Regular security audits
- Encrypted file storage for assessments
- GDPR compliance for child data

## Contributing

1. Create feature branches: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m "Add feature description"`
3. Push to branch: `git push origin feature/feature-name`
4. Create Pull Request with detailed description

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or documentation improvements:
1. Check README.md first
2. Review API endpoints documentation
3. Check browser console and server logs
4. Create an issue with detailed description

## Acknowledgments

- Express.js for robust API framework
- React + Vite for modern frontend development
- MySQL for reliable data persistence
- Docker for containerization and deployment

---

**Ready to deploy your Dyslexia Support Platform! 🚀**

For comprehensive setup, run:
```powershell
.\setup.ps1
```

Then start with:
```powershell
docker-compose up -d
cd frontend && npm run dev
```

