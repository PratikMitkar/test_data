# Ticketing System Frontend

A modern, responsive React-based frontend for the Ticketing System management application.

## Features

- **Role-based Authentication**: Support for Super Admin, Admin, Team Manager, and User roles
- **Ticket Management**: Create, view, update, and manage tickets with full CRUD operations
- **User Management**: Admin interface for managing users and teams
- **Project Management**: Create and manage projects with detailed information
- **Notification System**: Real-time notifications with read/unread status
- **File Attachments**: Support for file uploads in tickets
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI**: Clean, intuitive interface with Lucide React icons

## Tech Stack

- **React 19**: Latest React with hooks and functional components
- **Vite**: Fast build tool and development server
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API communication
- **React Hook Form**: Form handling and validation
- **React Hot Toast**: Toast notifications
- **Lucide React**: Beautiful icons
- **Date-fns**: Date manipulation utilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on `http://localhost:5000`

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd Client/ticketing-system-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.jsx      # Main layout with sidebar
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── pages/              # Page components
│   ├── Login.jsx       # Authentication page
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Tickets.jsx     # Ticket listing
│   ├── CreateTicket.jsx # Ticket creation
│   ├── TicketDetail.jsx # Individual ticket view
│   ├── Users.jsx       # User management
│   ├── Projects.jsx    # Project management
│   └── Notifications.jsx # Notification center
├── App.jsx             # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## Features Overview

### Authentication
- Role-based login (Super Admin, Admin, Team, User)
- JWT token management
- Protected routes based on user roles
- Automatic token refresh

### Dashboard
- Statistics overview (total tickets, pending, completed, my tickets)
- Recent tickets list
- Quick action buttons
- Role-based content display

### Ticket Management
- Create new tickets with file attachments
- View ticket details with comments
- Update ticket status (Pending → In Progress → Completed)
- Filter and search tickets
- Pagination support

### User Management (Admin Only)
- View all users in the system
- Create new users
- Assign users to teams
- Delete users

### Project Management (Admin Only)
- Create and manage projects
- Set project timelines
- Associate tickets with projects

### Notifications
- Real-time notification updates
- Mark as read/unread
- Filter by notification type
- Delete notifications

## API Integration

The frontend communicates with the backend API at `http://localhost:5000`:

- **Authentication**: `/api/auth/*`
- **Tickets**: `/api/tickets/*`
- **Users**: `/api/users/*`
- **Projects**: `/api/projects/*`
- **Notifications**: `/api/notifications/*`

## Styling

The application uses Tailwind CSS with custom components:

- **Cards**: `.card`, `.card-header`, `.card-content`
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`
- **Inputs**: `.input`
- **Badges**: `.badge`, `.badge-success`, `.badge-warning`, `.badge-error`

## Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Collapsible sidebar on mobile
- Responsive tables and grids
- Touch-friendly interface

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000
```

## Contributing

1. Follow the existing code style
2. Use functional components with hooks
3. Implement proper error handling
4. Add loading states for async operations
5. Use TypeScript for better type safety (optional)

## License

This project is part of the Ticketing System application.
