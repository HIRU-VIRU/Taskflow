# TaskFlow Frontend - Installation & Running Guide

## Overview

This is the React + TypeScript frontend for the TaskFlow multi-tenant project management SaaS application. It consumes the TaskFlow backend API and provides a complete user interface for managing projects, tasks, teams, and subscriptions.

## Prerequisites

- Node.js 18+ and npm (or yarn)
- Backend API running on `http://localhost:3000` (or configured in `.env`)

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React 19+ with TypeScript
- React Router v7 for routing
- Axios for HTTP calls
- Tailwind CSS for styling
- Lucide React for icons
- Zod for validation

### 2. Environment Configuration

Copy the `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update `.env` with your backend API URL:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Running the Development Server

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

## Building for Production

Build the TypeScript and bundle for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── api/                    # API client and service methods
│   ├── client.ts          # Axios instance with interceptors
│   ├── auth.ts            # Authentication API
│   ├── projects.ts        # Project management API
│   ├── tasks.ts           # Task management API
│   ├── users.ts           # User management API
│   └── subscriptions.ts   # Subscription/plan API
│
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # Authentication state & user info
│   ├── TenantContext.tsx  # Tenant/subscription state
│   └── NotificationContext.tsx # Toast notifications
│
├── pages/                 # Page components
│   ├── LoginPage.tsx      # User login
│   ├── RegisterPage.tsx   # New tenant registration
│   ├── DashboardPage.tsx  # Main dashboard
│   ├── ProjectsPage.tsx   # Projects list & create
│   ├── TasksPage.tsx      # All tasks view
│   ├── UsersPage.tsx      # Team members management
│   ├── SettingsPage.tsx   # User & tenant settings
│   ├── PlansPage.tsx      # Subscription plans
│   └── ProjectDetailPage.tsx # Project details
│
├── components/
│   ├── common/            # Reusable UI components
│   │   ├── Header.tsx     # Top navigation
│   │   ├── Sidebar.tsx    # Left navigation
│   │   ├── StatusMessages.tsx # Error/success messages
│   │   └── NotificationCenter.tsx # Toast notification display
│   ├── forms/             # Form components (if needed)
│   └── features/          # Feature-specific components (if needed)
│
├── hooks/                 # Custom React hooks
│   └── useAuth.ts, useTenant.ts, etc.
│
├── utils/                 # Utility functions
│   ├── token.ts          # JWT token storage/retrieval
│   └── formatting.ts     # Date/currency formatting
│
├── types/
│   └── index.ts          # TypeScript interfaces matching backend
│
├── App.tsx               # Main app component with routing
├── main.tsx              # Entry point
└── index.css             # Tailwind CSS setup
```

## Key Features

### 1. Authentication
- User registration (create new tenant)
- Login with email, password, and tenant slug
- JWT token management with automatic persistence
- Auto-logout on token expiration

### 2. Multi-Tenancy
- Tenant context provides current organization info
- All API calls automatically include tenant context
- Complete tenant isolation at frontend level

### 3. Subscription Management
- View available plans with features and limits
- Upgrade/downgrade subscription (admin only)
- Real-time display of current plan status
- Feature availability checking

### 4. Project & Task Management
- Create, read, update, delete projects
- Create, read, update tasks within projects
- Task filtering by status and priority
- Project status tracking (active/archived)

### 5. Team Management
- Invite users to tenant (admin only)
- Assign roles (admin/member)
- Remove users (admin only)
- Display team member list

### 6. Notifications
- Toast-style notifications for success/error messages
- Auto-dismiss after configurable duration
- Real-time feedback on operations

## State Management

### AuthContext
Manages:
- Current user information
- Authentication token
- Login/register/logout flows
- Admin role checking

### TenantContext
Manages:
- Current tenant/organization information
- Subscription details and status
- Feature availability checking
- Usage limit tracking

### NotificationContext
Manages:
- Toast notification queue
- Show/hide notifications
- Auto-dismiss functionality

## API Integration

The frontend uses an Axios instance with interceptors for:
- Automatic JWT token injection in headers
- Response transformation (API returns `{ success, data }` which is auto-unwrapped)
- Error handling with specific error codes
- Auto-logout on 401 Unauthorized

## Error Handling

- API errors display as toast notifications with user-friendly messages
- Feature access denied shows specific error explaining the limit
- Usage limit exceeded displays remaining resources
- Network errors are caught and displayed

## Usage Limits & Feature Checking

Pages check feature availability using `useTenant()`:

```typescript
const { hasFeature, checkUsage } = useTenant();

if (hasFeature('CREATE_PROJECT')) {
  // Show create project button
}

const { allowed, remaining } = checkUsage('max_projects', currentCount);
if (!allowed) {
  // Show upgrade prompt
}
```

## Testing the Application

### 1. Register a New Tenant
- Click "Register here" on login page
- Fill in company name, slug, admin name, email, password
- You'll be logged in and redirected to dashboard

### 2. Test Projects
- Create multiple projects (limited to 3 on Free plan)
- Try to create 4th project (should show usage limit error)
- View project list

### 3. Test Subscriptions
- Go to Settings → Plans
- See current Free plan details
- View Pro and Enterprise plans
- Admin can upgrade (create in backend to test)

### 4. Test User Invitations
- On Free plan: Try to invite user (should show feature not allowed)
- Upgrade to Pro plan (in backend)
- Then invite user should work

### 5. Test Tasks
- Create tasks in projects
- Filter tasks by status
- View all tasks across projects

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000/api` | Backend API base URL |

## Tailwind CSS

Tailwind is configured for the project. To customize:
1. See `tailwind.config.js` for theme settings
2. Update `postcss.config.js` for PostCSS plugins
3. All styles use Tailwind utility classes - see `index.css`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses CSS Grid/Flexbox (ES2015+)

## Deployment

### Vercel / Netlify
```bash
# Build
npm run build

# Output is in dist/
# Deploy the dist/ folder
```

### Docker
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

## Troubleshooting

### "Cannot find module" errors
Ensure all imports use correct relative paths and named/default exports match component definitions.

### API calls failing with CORS errors
Ensure backend is running and CORS is configured. Check `VITE_API_BASE_URL` in `.env`.

### Styles not appearing
Run `npm install` again to ensure Tailwind is installed. Check that `src/index.css` is imported in `main.tsx`.

### Token not persisting
Check browser's localStorage is enabled. Token is stored in `taskflow_token` key.

## Development Tips

- Use React DevTools browser extension for debugging state
- Check browser console for API errors
- Use Tailwind's JIT mode - styles are generated on-the-fly
- All API calls auto-include Authorization header

## Support

For issues with the backend, see the main [TaskFlow README](../README.md).

---

**Built with React 19, TypeScript, Tailwind CSS, and Axios** 🚀
