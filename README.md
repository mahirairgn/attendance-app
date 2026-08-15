# WFH Attendance App

A full-stack web application for managing employee attendance in a work-from-home settings.

The application allows employees to log in and record their daily attendance by capturing clock-in and clock-out times with photo evidence. It also provides personal attendance history and daily attendance reporting.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Ant Design
- React Router

### Backend
- NestJS
- TypeScript
- TypeORM
- MySQL
- JWT Authentication
- Passport
- bcrypt

## Features

### Authentication
- Employee login using email and password
- JWT-based authentication
- Protected application routes
- Password change for authenticated employees

### Employee Management
- Employee account creation and update by administrators
- Employee information
- System-generated initial password for newly created accounts

### Attendance
- Clock-in and clock-out on each working day
- Automatic timestamp recording
- Photo evidence upload
- Personal attendance history
- Attendance status and work duration calculation based on clock-in and clock-out records

### Reporting
- Attendance report and overview for monitoring attendance records (per day)


## Setup

### 1. Clone the repository

```bash
git clone https://github.com/mahirairgn/attendance-app.git
cd attendance-app
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file based on the required environment variables:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=attendance

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

```

Create the MySQL database before starting the backend.

Then run the application:

```bash
npm run start:dev
```

The backend runs on:

```text
http://localhost:3000
```

### 3. Seed the database

The project includes a seed script for initializing the required data.

```bash
npm run seed
```

### 4. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite development server, typically:

```text
http://localhost:5173
```

## Environment Variables

The `.env` file is intentionally excluded from version control.

For local development, create the required `.env` file in the backend directory using the variables described above.

## Authentication Flow

1. An employee logs in using their credentials.
2. The backend validates the credentials.
3. Upon successful authentication, a JWT is issued.
4. The frontend stores the authentication state and includes the JWT when accessing protected API endpoints.
5. Protected backend routes validate the JWT before processing the request.

## Attendance Flow

1. The authenticated employee opens the home page.
2. The employee submits a clock-in or clock-out request with photo evidence.
3. The backend validates the request and records the attendance timestamp.
4. The uploaded photo is stored and associated with the attendance record.
5. Attendance history and reports can then be viewed through the application.

## Scope & Assumptions

- Employee accounts are managed within the system rather than through public self-registration.
- Newly created employee accounts are assigned an initial password by the backend. Employees can change their password after successfully logging in.
- Attendance is recorded based on clock-in and clock-out actions.
- Photo evidence is required as part of the attendance submission.
- The application is intended for local development and demonstration purposes.
