# Shooting Competition Management System

This is a comprehensive web application for managing shooting competitions, including participant registration, score entry, and results display with proper rankings.

## Features

- 🔐 User authentication with JWT tokens
- 👥 Participant registration and management with lane validation
- 🎯 Score entry for multiple series (4 series per participant)
- 🏆 Real-time results with automatic ranking and medal display
- 📱 Professional UI with responsive design
- 🔍 Comprehensive filtering and search functionality
- ✅ Input validation and error handling
- 📊 Competition summaries and top performer highlights

## Tech Stack

**Backend:**
- Node.js with Express
- MySQL database with proper indexing
- JWT authentication
- CORS enabled
- Comprehensive validation

**Frontend:**
- React (Create React App)
- React Router for navigation
- Axios for API calls
- Modern CSS with responsive design
- Professional styling with animations

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=shooting_competition
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
PORT=5000
```

5. Set up the database:
   - Create a MySQL database named `shooting_competition`
   - Run the SQL commands in `database_schema.sql`

6. Start the backend server:
```bash
npm start
# or for development with auto-restart
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Default Login Credentials

- **Admin User:**
  - Username: `admin`
  - Password: `admin123`

- **Regular User:**
  - Username: `user`  
  - Password: `user123`

## Usage

### 1. Login
Use the default credentials or create new users in the database.

### 2. Register Participants
- Navigate to the "Register Participant" tab
- Fill in all required fields (name, zone, event, school, age, gender, lane number)
- Age must be between 10-25, lane number between 1-50
- Lane numbers cannot be duplicated

### 3. Enter Scores
- Navigate to the "Score Entry" tab
- Select a participant from the dropdown
- Enter scores for each of the 4 series (0-100 points)
- Enter ten-pointer counts (0-10 per series)
- Scores are automatically validated and totaled

### 4. View Results
- Navigate to "Results" to see participant rankings
- Rankings are calculated by:
  1. Total score (primary)
  2. Ten pointers (secondary)
  3. Last series score (tertiary)
  4. First series score (quaternary)
- Filter by name, age, or event
- Top 3 performers are highlighted with medals

## Database Schema

The application uses three main tables with proper relationships:

### Users Table
- `id`, `username`, `password`, `role`, `created_at`

### Participants Table  
- `id`, `name`, `zone`, `event`, `school_name`, `age`, `gender`, `lane_no`
- `total_score`, `ten_pointers`, `first_series_score`, `last_series_score`
- `created_at`, `updated_at`

### Scores Table
- `id`, `participant_id`, `series_number`, `score`, `ten_pointers`
- `created_at`, `updated_at`
- Foreign key relationship with participants table

## API Endpoints

### Authentication
- `POST /api/participants/login` - User login

### Participants
- `GET /api/participants` - Get all participants (ordered by ranking)
- `POST /api/participants/add` - Add new participant (with validations)
- `PUT /api/participants/update/:id` - Update participant
- `DELETE /api/participants/delete/:id` - Delete participant

### Scores
- `POST /api/scores/save` - Save series scores (with participant validation)
- `GET /api/scores/:participantId` - Get participant scores

## Validation Rules

### Participant Registration
- All fields are required
- Age: 10-25 years
- Lane number: 1-50 (must be unique)
- Event: AP, PS, OS, 10m, 50m

### Score Entry
- Exactly 4 series required
- Score range: 0-100 per series
- Ten pointers: 0-10 per series
- Participant must exist in database

## Error Handling

- Comprehensive backend validation with descriptive error messages
- Frontend form validation with real-time feedback
- Database constraint handling
- Network error handling with user-friendly messages
- Authentication state management

## Security Features

- JWT token-based authentication
- Protected API routes
- Input sanitization and validation
- Secure password storage recommendations
- CORS configuration for cross-origin requests

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please create an issue in the repository or contact the development team.