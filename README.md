
# Team Management Application

A full-stack application for team management and task tracking.

## Frontend
- React with TypeScript
- Vite
- Tailwind CSS and shadcn/ui for styling
- React Router for navigation
- React Query for API data fetching

## Backend
- Node.js with Express
- MongoDB with Mongoose for data storage
- JWT for authentication
- RESTful API architecture

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```
   git clone [your-repo-url]
   ```

2. Install frontend dependencies:
   ```
   cd team-management
   npm install
   ```

3. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

4. Create a .env file in the backend directory with:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/team-management
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   ```

5. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

6. Start the frontend development server:
   ```
   cd ..
   npm run dev
   ```

7. Open your browser and go to http://localhost:5173

## Features
- User authentication and authorization
- Role-based access control
- Team hierarchy management
- Task assignment and tracking
- Reporting and analytics

## Deployment

### Backend
1. Set up a MongoDB database (MongoDB Atlas recommended for production)
2. Deploy the Node.js backend to a hosting service (Heroku, DigitalOcean, AWS, etc.)
3. Configure environment variables for the production environment

### Frontend
1. Build the frontend for production:
   ```
   npm run build
   ```
2. Deploy the static files from the dist directory to a static hosting service

## License
[MIT](LICENSE)
