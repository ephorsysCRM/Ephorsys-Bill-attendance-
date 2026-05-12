# Ephorsys Billing Software - Setup Guide

## WHERE TO ADD ENVIRONMENT VARIABLES

### In v0 Interface:
1. Click **Settings** button (top right corner)
2. Click **Vars** tab
3. Add the variable below:

### Required Environment Variable:

**Key:** `MONGODB_URI`

**Value:** Get from MongoDB Atlas
```
mongodb+srv://username:password@cluster.mongodb.net/ephorsys?retryWrites=true&w=majority
```

### How to get MongoDB URI:
1. Go to https://www.mongodb.com/cloud/atlas (free tier available)
2. Create account and sign in
3. Create a new cluster (select Free tier)
4. Click "Connect"
5. Choose "Drivers" 
6. Select Node.js
7. Copy the connection string
8. Replace `<username>`, `<password>`, `<password>` with your actual credentials
9. Paste into v0 Vars section

## After Adding MongoDB URI:

1. Wait 30 seconds for v0 to reload
2. Go to `/login` page
3. Login with admin credentials (set up manually)
4. You're done! Use the dashboard

## Features

- **Authentication**: User login with JWT tokens
- **Dashboard**: Analytics overview with revenue and invoice charts
- **Invoices**: Create, edit, and manage invoices with PDF export
- **Quotations**: Create quotations and track their status
- **Clients**: Manage your client database
- **Settings**: Configure default tax rates, currency, language, and theme
- **PDF Generation**: Automatically generate professional PDF documents

## Project Structure

```
├── app/
│   ├── (auth)/           # Authentication pages (login)
│   ├── (dashboard)/      # Protected dashboard layout
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── invoices/     # Invoice CRUD + PDF
│   │   ├── quotations/   # Quotation CRUD
│   │   ├── clients/      # Client CRUD
│   │   └── settings/     # Settings management
│   ├── globals.css       # Global styles with glassmorphism
│   └── page.tsx          # Home page
├── components/
│   ├── dashboard/        # Dashboard components (sidebar, header)
│   ├── forms/            # Reusable forms (invoices, quotations)
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── mongodb.ts        # MongoDB connection
│   ├── jwt.ts            # JWT utilities
│   ├── models.ts         # Mongoose schemas
│   ├── auth.ts           # Auth middleware
│   └── pdf-generator.ts  # PDF generation utility
```

## Technology Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **PDF Generation**: Puppeteer
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **Styling**: Glassmorphism design with custom CSS variables

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `GET /api/invoices/[id]/pdf` - Download invoice as PDF

### Quotations
- `GET /api/quotations` - List quotations
- `POST /api/quotations` - Create quotation
- `GET /api/quotations/[id]` - Get quotation
- `PUT /api/quotations/[id]` - Update quotation
- `DELETE /api/quotations/[id]` - Delete quotation

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## Security Notes

- All API routes are protected with JWT authentication
- Passwords are hashed with bcryptjs
- Environment variables are required for production
- Change the JWT_SECRET in production
- Use HTTPS in production
- Enable CORS appropriately for your domain

## Next Steps

1. Set up your MongoDB database
2. Create a `.env.local` file with your MongoDB URI and JWT secret
3. Install dependencies with `npm install`
4. Run `npm run dev` to start the development server
5. Create an account and start using Ephorsys!

## Support

For issues or questions, check the documentation or contact support.
