# Elevate Music Backend API

A comprehensive Node.js backend API for the Elevate Music application with dynamic subscription pricing management.

## Features

- **Dynamic Subscription Pricing**: Admin can manage subscription plans with real-time pricing updates
- **Stripe Integration**: Automatic payment processing with product and price management
- **User Management**: Complete authentication and authorization system
- **Music Management**: Upload, organize, and serve music files
- **Category Management**: Organize music into categories
- **Notification System**: Email notifications and user alerts
- **Admin API**: Full REST API for admin operations

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Payment Processing**: Stripe API
- **Authentication**: JWT tokens
- **File Upload**: Multer
- **Email**: Nodemailer

## Project Structure

```
backend/
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── categoryController.js # Category management
│   ├── musicController.js    # Music management
│   ├── subscriptionController.js # Subscription handling
│   ├── subscriptionPlanController.js # Dynamic pricing management
│   └── userController.js     # User management
├── middleware/
│   ├── adminMiddleware.js    # Admin authorization
│   ├── authMiddleware.js     # User authentication
│   ├── errorMiddleware.js    # Error handling
│   └── uploadMiddleware.js   # File upload handling
├── models/
│   ├── Category.js           # Category model
│   ├── File.js               # File model
│   ├── Music.js              # Music model
│   ├── SubscriptionPlan.js   # Subscription plan model
│   └── userModel.js          # User model
├── routes/
│   ├── categoryRoutes.js     # Category API routes
│   ├── musicRoutes.js        # Music API routes
│   ├── subscriptionRoutes.js # Subscription API routes
│   ├── subscriptionPlanRoutes.js # Pricing management routes
│   └── userRoutes.js         # User API routes
├── services/
│   ├── emailService.js       # Email service
│   └── notificationScheduler.js # Notification scheduler
├── uploads/                  # File uploads directory
├── utils/
│   └── generateToken.js      # JWT token generation
├── server.js                 # Main server file
└── package.json              # Dependencies
```

## Dynamic Subscription Pricing System

The backend includes a sophisticated subscription pricing system that allows:

- **Real-time Pricing Updates**: Admins can update subscription prices through API
- **Stripe Integration**: Automatic product and price creation in Stripe
- **Version Control**: Track pricing changes over time
- **Customer Protection**: Existing customers retain their original pricing
- **Granular Control**: Manage all subscription plan features and pricing

### Key API Endpoints:

#### Subscription Plans

- `GET /api/subscription-plans/current` - Get current active pricing
- `GET /api/subscription-plans/admin/subscription-plans` - List all plans (admin)
- `POST /api/subscription-plans/admin/subscription-plans` - Create new plan (admin)
- `PUT /api/subscription-plans/admin/subscription-plans/:id` - Update plan (admin)
- `DELETE /api/subscription-plans/admin/subscription-plans/:id` - Deactivate plan (admin)

#### Subscriptions

- `POST /api/subscriptions/create` - Create subscription
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/cancel` - Cancel subscription

#### Users

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

#### Music

- `GET /api/music` - Get all music
- `POST /api/music` - Upload music (admin)
- `DELETE /api/music/:id` - Delete music (admin)

#### Categories

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd elevate-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/elevate
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PRICE_ID=your_stripe_price_id
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   PRODUCTION_URL=https://your-production-server.com
   OLD_BASE_URL=http://192.168.0.100:5000
   NEW_BASE_URL=https://your-production-server.com
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## Environment Variables

| Variable                | Description                          | Required                |
| ----------------------- | ------------------------------------ | ----------------------- |
| `NODE_ENV`              | Environment (development/production) | Yes                     |
| `PORT`                  | Server port                          | Yes                     |
| `MONGODB_URI`           | MongoDB connection string            | Yes                     |
| `STRIPE_SECRET_KEY`     | Stripe secret key                    | Yes                     |
| `STRIPE_PRICE_ID`       | Default Stripe price ID              | Yes                     |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret                | Yes                     |
| `JWT_SECRET`            | JWT signing secret                   | Yes                     |
| `EMAIL_USER`            | Email service username               | No                      |
| `EMAIL_PASS`            | Email service password               | No                      |
| `PRODUCTION_URL`        | Production server URL                | Yes (for URL migration) |
| `OLD_BASE_URL`          | Old server URL for migration         | No                      |
| `NEW_BASE_URL`          | New server URL for migration         | No                      |

## Deployment

### Render.com

1. Connect your GitHub repository
2. Set environment variables
3. Deploy with start command: `node server.js`

### Heroku

1. Create Heroku app
2. Connect GitHub repository
3. Set environment variables in Heroku dashboard
4. Deploy

### AWS/DigitalOcean/Ubuntu VPS

1. Set up server with Node.js
2. Clone repository
3. Install dependencies
4. Set environment variables
5. Use PM2 for process management

#### Updating the Server (Manual Process)

**Step 1: SSH into your Ubuntu server**
```bash
ssh username@your-server-ip
# Example: ssh ubuntu@172.234.201.117
```

**Step 2: Navigate to your project directory**
```bash
cd /path/to/Elevate-Backend/backend
# Adjust the path to where your project is located
```

**Step 3: Pull latest changes from git**
```bash
git pull origin main
# or 'git pull origin master' if that's your branch
```

**Step 4: Install any new dependencies**
```bash
npm install
```

**Step 5: Restart the server**

**If using PM2 (Recommended):**
```bash
pm2 restart elevate-backend
# or if you haven't named it:
pm2 restart server.js
```

**If using systemd:**
```bash
sudo systemctl restart elevate-backend
```

**If running directly with node:**
```bash
# Stop the current process (Ctrl+C or kill the process)
# Then restart:
node server.js
# Or with nodemon:
npm start
```

#### Quick Update Script

You can use the provided `deploy.sh` script for faster updates:

1. Make the script executable:
```bash
chmod +x deploy.sh
```

2. Edit the script and update the project path:
```bash
nano deploy.sh
# Change: cd /path/to/Elevate-Backend/backend
# To your actual path
```

3. Run the script:
```bash
./deploy.sh
```

#### Setting up PM2 (Recommended for Production)

PM2 keeps your application running and automatically restarts it if it crashes:

```bash
# Install PM2 globally
npm install -g pm2

# Start your application
cd /path/to/Elevate-Backend/backend
pm2 start server.js --name elevate-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions it provides
```

**Useful PM2 commands:**
```bash
pm2 list              # List all processes
pm2 restart elevate-backend  # Restart your app
pm2 stop elevate-backend     # Stop your app
pm2 logs elevate-backend     # View logs
pm2 monit              # Monitor resources
```

## API Documentation

### Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Format

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Security Features

- **Authentication & Authorization**: JWT-based authentication with admin role protection
- **Input Validation**: Comprehensive validation and sanitization of all inputs
- **Path Traversal Protection**: Filename sanitization to prevent directory traversal attacks
- **XSS Protection**: Content sanitization and Helmet security headers
- **CORS Protection**: Strict origin validation for cross-origin requests
- **Rate Limiting**: Protection against DoS and brute force attacks
- **Security Headers**: Helmet middleware for additional HTTP security headers
- **File Upload Security**: Strict validation and controlled file operations
- **Cookie Security**: HTTP-only, secure cookies with SameSite protection
- **Environment Variable Protection**: Sensitive data stored in environment variables
- **MongoDB Injection Prevention**: ObjectId validation for all database queries

## Testing

```bash
# Run tests (if available)
npm test

# Test API endpoints
curl -X GET http://localhost:5000/api/subscription-plans/current
```

## License

This project is proprietary software for the Elevate Music application.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support, email admin@elevateintune.com
