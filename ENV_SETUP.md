# Ephorsys Billing Software - Environment Setup Guide

## Where to Add Environment Variables

You need to add your MongoDB URI to the project settings. Follow these steps:

### Step 1: Click Settings (Top Right)
In the v0 interface, click the **Settings** button in the top right corner of the screen.

### Step 2: Go to Vars Section
In the settings menu, click on **Vars** to access environment variables.

### Step 3: Add MONGODB_URI
Click **Add** and add the following:

**Key:** `MONGODB_URI`
**Value:** Your MongoDB connection string

### Step 4: Get Your MongoDB URI

If you don't have MongoDB set up:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account (if you don't have one)
3. Create a new cluster
4. Go to Database > Clusters > Connect
5. Choose "Drivers" 
6. Select Node.js and copy the connection string
7. Replace `<username>`, `<password>`, and `<database>` with your actual values
8. Make sure it looks like: `mongodb+srv://username:password@cluster.mongodb.net/ephorsys?retryWrites=true&w=majority`

### Example MongoDB URI Format
```
mongodb+srv://myusername:mypassword@cluster0.abc123.mongodb.net/ephorsys?retryWrites=true&w=majority
```

## Optional: JWT Secret

If you want to use a custom JWT secret instead of the default:

**Key:** `JWT_SECRET`
**Value:** Any random string you choose (recommended: at least 32 characters)

Example:
```
your-super-secret-jwt-key-2024-change-this-in-production
```

If you don't add this, the app will use a default secret (fine for development, should be changed for production).

## After Adding Environment Variables

1. The v0 preview will automatically reload
2. Go to the login page at `/login`
3. Login with admin credentials (set up manually)
4. You'll be logged in and can access the dashboard!

## Troubleshooting

**"Database not configured" Error:**
- Make sure you've added `MONGODB_URI` to the Vars section
- Check that the URI is formatted correctly
- Wait a few seconds after adding the variable for it to take effect

**"Invalid credentials" on Login:**
- Make sure admin credentials are set up correctly
- Check that the email/password combination is correct

**Can't see Vars option:**
- Make sure you're logged into v0
- Click the Settings button in the top right corner
- You should see: Design | Rules | Vars | Settings tabs

## What the App Does

Once set up, Ephorsys provides:

- ✅ User authentication with login
- ✅ Dashboard with analytics and statistics  
- ✅ Invoice management (create, edit, delete, PDF export)
- ✅ Quotation management (create, edit, delete)
- ✅ Client database management
- ✅ Settings for tax rates, currency, language
- ✅ Professional PDF generation for invoices

Enjoy using Ephorsys!
