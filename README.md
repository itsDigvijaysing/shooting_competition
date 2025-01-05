# Shooting Competition Application

This application is designed for managing shooting competitions, specifically for events like Air Pistol (AP), Peep Site (PS), and Open Site (OS). It allows participants to register, manage their scores, and view results.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [Participant Routes](#participant-routes)
  - [Login Route](#login-route)
- [Important Information](#important-information)
- [License](#license)

## Features

- Participant registration with details like name, zone, event, school name, age, gender, and lane number.
- Management of shooting series and scores.
- Filtering and searching participants.
- Ranking participants based on their scores and specific criteria.
- Timing and section management for shooting details.

## Installation

### Backend Setup

1. Navigate to the `backend` directory:
   ```sh
   cd backend
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the 

backend

 directory with the following content:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=shooting_competition
   ```

4. Start the backend server:
   ```sh
   npm start
   ```

### Frontend Setup

1. Navigate to the 

frontend

 directory:
   ```sh
   cd frontend
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Start the frontend development server:
   ```sh
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000` to access the frontend application.
2. Use the login form to log in. Based on the user role, you will be redirected to the appropriate dashboard.
3. Register participants, manage their scores, and view results.

## API Endpoints

### Participant Routes

- `POST /api/participants/add` - Add a new participant.
- `GET /api/participants` - Get all participants.

### Login Route

- `POST /api/login` - Login a user.

## Important Information

- **Ranking Criteria**:
  - When the total scores of participants are the same, the last series score is compared.
  - If the last series scores are also the same, the first series score is compared.
  - If both the last and first series scores are the same, the number of 10-pointers scored is used to rank the participants.

- **Details and Timing**:
  - Participants are divided into details (e.g., Detail 1, Detail 2) based on lane availability.
  - Each detail has specific timing information.

- **Ensure everything is working by running these tests**

- GET /api/participants/: Should return all participants.
- POST /api/participants/add: Add a participant with valid data.
- PUT /api/participants/update/{id}: Update a participant's details.
- DELETE /api/participants/delete/{id}: Delete a participant.
- POST /api/login: Test login with valid credentials.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
