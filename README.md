# Task Manager API

A RESTful API for managing tasks with user authentication and GitHub OAuth integration.

## Features

- User authentication (email/password and GitHub OAuth)
- Task management (CRUD operations)
- JWT-based authentication
- Swagger API documentation
- MongoDB database integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- GitHub OAuth credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmanager

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd taskmanager-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Copy the `.env.example` file to `.env`
- Update the values with your configuration

4. Start the development server:
```bash
npm run dev
```

## API Documentation

Once the server is running, you can access the Swagger API documentation at:
```
http://localhost:3000/api-docs
```

## API Endpoints

### Authentication
- `POST /api/users/signup` - Register a new user
- `POST /api/users/login` - Login with email/password
- `GET /api/auth/github` - Initiate GitHub OAuth login
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/github/failure` - GitHub OAuth failure

### Users
- `GET /api/users/profile` - Get user profile (requires authentication)

### Tasks
- `GET /api/tasks` - Get all tasks (requires authentication)
- `POST /api/tasks` - Create a new task (requires authentication)
- `GET /api/tasks/:id` - Get a specific task (requires authentication)
- `PUT /api/tasks/:id` - Update a task (requires authentication)
- `DELETE /api/tasks/:id` - Delete a task (requires authentication)

## Testing

Run the test suite:
```bash
npm test
```

## Error Handling

The API uses standard HTTP status codes and returns error messages in the following format:
```json
{
  "error": "Error message"
}
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- CORS is enabled for API access
- Input validation using express-validator

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 