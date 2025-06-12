# MongoDB Authentication Setup

This project uses MongoDB for authentication instead of Clerk. Follow these steps to set up MongoDB authentication:

## Setup Steps

1. Create a `.env.local` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string
```

2. For the `JWT_SECRET`, generate a secure random string. You can use a tool like:
   ```
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. For `MONGODB_URI`, create a MongoDB database (either locally or using MongoDB Atlas) and get the connection string.

## MongoDB Atlas Setup (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create an account or sign in.
2. Create a new cluster (the free tier is sufficient for development).
3. Under "Security" > "Database Access", create a new database user with read/write permissions.
4. Under "Security" > "Network Access", add your IP address or allow access from anywhere (for development only).
5. Once your cluster is ready, click "Connect" > "Connect your application" and copy the connection string.
6. Replace `<password>` in the connection string with your database user's password.
7. Add this connection string as `MONGODB_URI` in your `.env.local` file.

## Database Structure

The authentication system uses the following MongoDB collection:

- `users`: Stores user information including:
  - `_id`: MongoDB ObjectId (automatically generated)
  - `username`: User's username
  - `email`: User's email address
  - `password`: Hashed password
  - `createdAt`: Account creation timestamp
  - `updatedAt`: Last update timestamp

## Authentication Flow

1. **Registration**: User registers with email, username, and password
2. **Login**: User logs in with email/username and password
3. **Session**: Authentication state is maintained using JWT tokens stored in HTTP-only cookies
4. **Protected Routes**: Routes under `/dashboard` are protected and require authentication

## API Endpoints

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Log in an existing user
- `POST /api/auth/logout`: Log out the current user
- `GET /api/auth/me`: Get the current authenticated user's information 