# Ticketing System API

A comprehensive Node.js API for managing company ticketing system with project management, resource allocation, and notification features.

## Features

### Core Functionality
- **User Management**: Registration, authentication, role-based access control
- **Project Management**: Create, update, and track projects with requirements
- **Ticket System**: Create, assign, and track tickets with priorities and status
- **Resource Management**: Allocate and manage resources across projects
- **Notification System**: Real-time notifications for various events
- **File Upload**: Support for document and image uploads

### User Roles
- **Employee**: Create tickets, view assigned projects, request resources
- **Manager**: Manage projects, approve resource requests, oversee department
- **Admin**: Full system access, user management, system announcements

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp env.example .env
   ```

4. Configure environment variables in `.env`

5. Setup database (creates SQLite database with sample data):
   ```bash
   npm run setup
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_PATH=./database.sqlite

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users` - Get all users (admin/manager)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/avatar` - Upload user avatar
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/department/:department` - Get users by department
- `GET /api/users/managers/list` - Get all managers
- `PUT /api/users/:id/status` - Activate/deactivate user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/team` - Add team member
- `DELETE /api/projects/:id/team/:userId` - Remove team member
- `POST /api/projects/:id/requirements` - Add requirement
- `PUT /api/projects/:id/requirements/:index` - Update requirement
- `GET /api/projects/:id/stats` - Get project statistics
- `POST /api/projects/:id/documents` - Upload project document
- `DELETE /api/projects/:id` - Delete project (admin)

### Tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/comments` - Add comment
- `POST /api/tickets/:id/resources` - Request resource
- `PUT /api/tickets/:id/resources/:index` - Approve/deny resource request
- `GET /api/tickets/stats/overview` - Get ticket statistics
- `DELETE /api/tickets/:id` - Delete ticket (admin)

### Resources
- `POST /api/resources` - Create new resource
- `GET /api/resources` - Get all resources
- `GET /api/resources/available` - Get available resources
- `GET /api/resources/:id` - Get resource by ID
- `PUT /api/resources/:id` - Update resource
- `POST /api/resources/:id/allocate` - Allocate resource
- `POST /api/resources/:id/deallocate` - Deallocate resource
- `PUT /api/resources/:id/requests/:index/approve` - Approve request
- `PUT /api/resources/:id/requests/:index/deny` - Deny request
- `POST /api/resources/:id/documents` - Upload resource document
- `GET /api/resources/stats/overview` - Get resource statistics
- `GET /api/resources/type/:type` - Get resources by type
- `DELETE /api/resources/:id` - Delete resource (admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/:id` - Get notification by ID
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/:id/unread` - Mark as unread
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `GET /api/notifications/unread/count` - Get unread count
- `GET /api/notifications/type/:type` - Get by type
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/delete-read` - Delete read notifications
- `PUT /api/notifications/preferences` - Update preferences
- `GET /api/notifications/preferences` - Get preferences
- `POST /api/notifications/announcement` - Create announcement (admin)
- `GET /api/notifications/stats/overview` - Get notification statistics

## Data Models

### User
- Basic info (name, email, password)
- Role (employee, manager, admin)
- Department and position
- Preferences and settings
- Manager relationship

### Project
- Project details (name, description, code)
- Team members and roles
- Requirements with status tracking
- Milestones and documents
- Client information

### Ticket
- Ticket details (title, description, type)
- Priority and status management
- Assignment and tracking
- Comments and history
- Resource requests
- Attachments

### Resource
- Resource details (name, type, category)
- Quantity and availability tracking
- Allocation to projects
- Request approval workflow
- Cost and supplier info

### Notification
- Notification details (title, message, type)
- Recipient and priority
- Read/unread status
- Action URLs and metadata

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## File Upload

The API supports file uploads for:
- User avatars
- Project documents
- Ticket attachments
- Resource documents

Files are stored in the `uploads/` directory with organized subdirectories.

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP
- Configurable via environment variables

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Rate limiting

## Database

The API uses MongoDB with Mongoose ODM. Key features:
- Indexed fields for performance
- Data validation
- Virtual fields and methods
- Population for related data

## Development

### Running in Development
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Production Build
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License 