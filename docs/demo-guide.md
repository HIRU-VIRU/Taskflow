# 🚀 TaskFlow - Live Demo Guide

Welcome to TaskFlow! This guide will help you explore our multi-tenant project management SaaS application.

## 🌐 Access the Live Demo

**Visit:** [https://frontend-taskflow-18-three.vercel.app](https://frontend-taskflow-18-three.vercel.app)

## 🔐 Demo Login Credentials

### Admin Account (Full Access)
```
Email: admin@acme-corp.com
Password: Demo@1234
Organization: acme-corp
```



## 📋 Demo Walkthrough

### 1. **Login Process**
- Go to the live demo URL above
- Click "Login" in the top right
- Use either demo account credentials
- Select "demo-corp" as your organization

### 2. **Dashboard Overview**
- View project statistics and recent activity
- See subscription plan and usage metrics (Admin only)
- Check team member count and recent tasks

### 3. **Projects Management**
- Browse existing demo projects
- Create new projects (if you have permissions)
- View project details and team assignments

### 4. **Task Management**
- Create, edit, and manage tasks within projects
- Assign tasks to team members
- Update task status and priorities

### 5. **Team Management** (Admin Only)
- View all team members in the organization
- Invite new users via email
- Manage pending invitations (send/revoke)
- Remove team members

### 6. **Subscription Plans**
- View available plans (Free, Pro, Enterprise)
- See feature comparisons and usage limits
- Upgrade/downgrade subscription plans (Admin only)

### 7. **Settings & Account**
- Update profile information
- Manage organization settings (Admin only)
- View danger zone actions like account deletion

## 🎯 Key Features to Explore

### Multi-Tenancy
- Complete isolation between different organizations
- Users can only see data from their own tenant
- Independent subscription plans per organization

### Feature-Based Access Control
- Different features available based on subscription plan
- Real-time enforcement of usage limits
- Graceful handling of plan restrictions

### Subscription Management
- Database-driven plan configurations
- Usage tracking for projects, users, and tasks
- Dynamic feature enabling/disabling

### User Invitation System
- Email-based user invitations
- Role-based access (Admin/Member)
- Pending invitation management

## 📱 Mobile Responsive
The application is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile devices

## 🔧 Technical Architecture

This demo showcases:
- **Frontend**: React 18 with TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **Authentication**: JWT-based stateless authentication
- **Infrastructure**: Vercel (Frontend) + AWS (Backend + Database)
- **Security**: HTTPS everywhere, proper CORS handling

## 💡 Demo Tips

1. **Try Both Accounts**: Login as both admin and member to see permission differences
2. **Test Invitations**: Use the admin account to invite yourself with a different email
3. **Explore Plans**: Check out different subscription tiers and their features
4. **Create Content**: Add projects and tasks to see the full workflow
5. **Mobile Testing**: Try the demo on your phone to see responsive design

## 🆘 Need Help?

If you encounter any issues or have questions about the demo:
- Check the browser console for any error messages
- Try refreshing the page
- Ensure you're using the correct demo credentials
- Test with a different browser if needed

## 🌟 What's Next?

After exploring the demo, you can:
- Review the [Development Setup Guide](./development-setup.md) to run locally
- Check out the source code structure and implementation
- Learn about the clean architecture and SaaS patterns used

---

**Enjoy exploring TaskFlow!** 🚀