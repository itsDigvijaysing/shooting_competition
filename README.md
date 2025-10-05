# 🎯 Shooting Competition Management System

A comprehensive web application for managing shooting competitions with advanced features including multi-competition support, detailed analytics, role-based access control, and professional score management.

## ✨ Features

### 🔐 **Authentication & Security**
- JWT-based authentication with role-based access control
- Admin and Participant user roles with different permissions
- Secure password handling with bcrypt support
- Protected routes and API endpoints

### 🏆 **Competition Management**
- Multiple competition support with status tracking (upcoming, active, completed)
- Competition details with timing and lane management
- Series count configuration (4 or 6 series per participant)
- Competition statistics and participant counts

### 👥 **Participant Management**
- Comprehensive participant registration with validation
- Multiple shooting events: Air Pistol (AP), Peep Site (PS), Open Site (OS)
- Age categories: Under 14, Under 17, Under 19
- Lane assignment with conflict prevention
- School and zone tracking

### 📊 **Score Management**
- Individual shot tracking (10 shots per series)
- Series-wise score entry with validation (0-100 points)
- Ten-pointer counting and tracking
- Automatic total score calculation and ranking

### 🏅 **Results & Rankings**
- Advanced ranking system with tie-breaking rules:
  1. Total score (primary)
  2. Ten-pointers count (secondary) 
  3. Last series score (tertiary)
  4. First series score (quaternary)
- Medal system (Gold, Silver, Bronze) by category
- Category-wise rankings (Event × Age × Gender)
- Export functionality for results

### 📈 **Analytics Dashboard**
- Competition overview with participation statistics
- Performance metrics and score distributions
- Participant demographics breakdown
- Top performers identification
- Interactive charts and visualizations

### 🎛️ **Admin Features**
- User management (create, update, delete users)
- Bulk operations for user management
- Competition creation and management
- Participant deletion with proper access control
- System health monitoring

## 🛠️ Tech Stack

**Backend:**
- **Node.js** with Express.js framework
- **MySQL** database with connection pooling
- **JWT** for authentication
- **bcrypt** for password hashing
- **mysql2** driver with prepared statements
- **CORS** enabled for cross-origin requests

**Frontend:**
- **React 18.2.0** with functional components and hooks
- **React Router v6** for navigation
- **Axios** for API communication
- **Context API** for state management
- **CSS Modules** for styling
- Responsive design with professional UI

## 📋 Prerequisites

- **Node.js** v14 or higher
- **MySQL** v5.7 or higher
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Installation & Setup

### 1. **Clone Repository**
```bash
git clone https://github.com/itsDigvijaysing/shooting_competition.git
cd shooting_competition
```

### 2. **Database Setup**
```bash
# Start MySQL service (Windows)
net start mysql80

# Or start MySQL service (macOS/Linux)
sudo systemctl start mysql
# or
brew services start mysql
```

**Create Database:**
```sql
CREATE DATABASE shooting_competition;
USE shooting_competition;
```

**Import Schema:**
```bash
# Run the complete database setup script
mysql -u root -p shooting_competition < complete_database_setup.sql
```

### 3. **Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env file with your database credentials
```

**Environment Configuration (.env):**
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=shooting_competition

# JWT Secret Key (use a strong random key in production)
JWT_SECRET=ShootingCompetition2024!@#SecretKey

# Server Configuration
PORT=5000
```

```bash
# Start backend server
npm start
```

### 4. **Frontend Setup**
```bash
# Navigate to frontend directory (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 5. **Access Application**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## 🔑 Default Credentials

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Permissions:** Full system access, user management, competition management

### Demo Participant Account
- **Username:** `participant1`
- **Password:** `user123`
- **Permissions:** Self-registration, view results

## 📚 Usage Guide

### 🏁 **Getting Started**
1. **Login** with admin credentials at http://localhost:3000
2. **Select Competition** from the dropdown (default competitions are pre-loaded)
3. **Navigate** using the header menu based on your role

### 👤 **Admin Workflow**
1. **Admin Dashboard** - Manage users and system overview
2. **Register Participants** - Add new participants to competitions
3. **Score Entry** - Enter series scores for participants
4. **Results** - View rankings and delete participants if needed
5. **Analytics** - View comprehensive competition analytics

### 🎯 **Participant Registration**
- Fill all required fields (name, zone, event, school, age, gender, lane)
- **Age Range:** 10-25 years (auto-categorized)
- **Lane Numbers:** 1-100 (must be unique per competition detail)
- **Events:** AP (Air Pistol), PS (Peep Site), OS (Open Site)

### 📝 **Score Entry Process**
1. Select participant from dropdown
2. Choose series number (1-4 or 1-6 based on competition)
3. Enter 10 individual shot scores (0-10 points each)
4. System automatically calculates totals and ten-pointers
5. Updates participant ranking in real-time

## 🗄️ Database Schema

### **Main Tables:**
- **users** - Authentication and user management
- **competitions** - Competition definitions and settings
- **competition_details** - Timing and lane management
- **participants** - Participant registration and scores
- **series_scores** - Individual series tracking
- **shots** - Individual shot tracking (10 per series)

### **Key Relationships:**
- Users → Participants (one-to-many)
- Competitions → Participants (one-to-many)
- Participants → Series Scores (one-to-many)
- Series Scores → Shots (one-to-many)

## 🔗 API Endpoints

### **Authentication**
```
POST /api/login              - User authentication
```

### **Competitions**
```
GET  /api/competitions       - List all competitions
GET  /api/competitions/:id   - Get single competition
POST /api/competitions       - Create competition (admin)
PUT  /api/competitions/:id   - Update competition (admin)
DELETE /api/competitions/:id - Delete competition (admin)
GET  /api/competitions/:id/stats - Competition statistics
```

### **Participants**
```
GET  /api/participants              - List participants (with filters)
POST /api/participants/add          - Register new participant
GET  /api/participants/:id          - Get single participant
PUT  /api/participants/update/:id   - Update participant
DELETE /api/participants/delete/:id - Delete participant
GET  /api/participants/my-registrations - User's registrations
```

### **Scores**
```
POST /api/scores/save                    - Save series scores
GET  /api/scores/participant/:id         - Get participant scores
PUT  /api/scores/shot/:seriesId/:shotNum - Update individual shot
GET  /api/scores/leaderboard/:compId     - Competition leaderboard
```

### **Rankings**
```
GET /api/rankings/competition/:compId           - Competition rankings
GET /api/rankings/competition/:compId/categories - Category rankings
GET /api/rankings/competition/:compId/medals     - Medal tally
GET /api/rankings/competition/:compId/qualifiers - Finals qualifiers
POST /api/rankings/competition/:compId/qualify   - Mark qualifiers (admin)
GET /api/rankings/competition/:compId/export     - Export rankings
```

### **Admin**
```
GET  /api/admin/users              - List users (admin)
POST /api/admin/users              - Create user (admin)
PUT  /api/admin/users/:id          - Update user (admin)
DELETE /api/admin/users/:id        - Delete user (admin)
POST /api/admin/users/:id/reset-password - Reset password (admin)
GET  /api/admin/stats/users        - User statistics (admin)
```

### **System**
```
GET /health                        - Health check endpoint
```

## ⚙️ Configuration Options

### **Competition Settings**
- **Max Series Count:** 4 or 6 series per participant
- **Status:** upcoming, active, completed
- **Lane Management:** Configurable max lanes per detail
- **Section Types:** main, final (for qualification rounds)

### **Validation Rules**
- **Age Range:** 10-25 years (enforced at database level)
- **Lane Numbers:** 1-100 (unique per competition detail)
- **Score Range:** 0-10 per shot, 0-100 per series
- **Ten-Pointers:** 0-10 per series (auto-calculated)

## 🔧 Troubleshooting

### **Common Issues**

**1. Database Connection Error**
```bash
# Check MySQL service status
net start mysql80
```

**2. Port Already in Use**
```bash
# Kill processes on ports 3000 or 5000
npx kill-port 3000
npx kill-port 5000
```

**3. API 500 Errors**
```bash
# Check backend console for detailed error messages
# Verify database connection and table structure
# Check .env file configuration
```

**4. Login Issues**
```bash
# Verify default users exist in database:
SELECT * FROM users WHERE username IN ('admin', 'participant1');
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
---

**🎯 Ready to manage your shooting competitions professionally! 🏆**
