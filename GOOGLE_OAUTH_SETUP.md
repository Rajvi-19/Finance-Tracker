# Google OAuth Setup Guide

## Issue
The Google OAuth button is not working because the Google Client credentials are not configured.

## Current Error
**Error 401: invalid_client** - This means the Google Client ID you're using is not properly configured in Google Cloud Console.

## Solution - Step by Step

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Finance Tracker")
5. Click **"Create"**
6. Wait for the project to be created, then select it from the dropdown

### Step 2: Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (since you're developing for public use)
3. Click **Create**
4. Fill in the required information:
   - **App name**: Finance Tracker
   - **User support email**: rajvi192007@gmail.com
   - **Developer contact information**: rajvi192007@gmail.com
5. Click **Save and Continue** (you can skip the optional sections for now)
6. Continue through the remaining sections (Scopes, Test Users) by clicking **Save and Continue**
7. Finally, click **Back to Dashboard**

### Step 3: Enable Google+ API

1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click on it and click **Enable**

### Step 4: Create OAuth Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click **"Create Credentials"** > **OAuth client ID**
3. Select **Web application** as the application type
4. Name it something like "Finance Tracker Web Client"
5. **Important - Add Authorized JavaScript origins**:
   - For development: `http://localhost:5173`
   - For production: `https://your-domain.com` (add when deploying)
6. **Important - Add Authorized redirect URIs**:
   - For development: `http://localhost:5173`
   - For production: `https://your-domain.com` (add when deploying)
7. Click **Create**
8. **Copy the Client ID** (it looks like: `123456789-abcdef.apps.googleusercontent.com`)
9. **Copy the Client Secret** (click the eye icon to reveal it)

### Step 5: Add Test Users (Required for External Apps)

1. Go back to **OAuth consent screen**
2. Click on **Test users**
3. Click **Add users**
4. Add your email: `rajvi192007@gmail.com`
5. Click **Add**

### Step 6: Update Environment Variables

Update the `.env` file in your project root with your actual Google credentials:

```env
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdef123456
VITE_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
```

Replace the placeholder values with the actual Client ID and Secret you copied from Google Cloud Console.

Also update `server/.env`:
```env
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdef123456
```

### Step 7: Restart Development Server

After updating the environment variables, restart your development server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 8: Test Google Sign-In

1. Navigate to `http://localhost:5174/login`
2. Click the Google Sign-In button
3. You might see a warning about the app being in testing mode - this is normal
4. Sign in with your Google account (rajvi192007@gmail.com)
5. Complete the Google authentication flow
6. You should be successfully logged in and redirected to the dashboard

## Troubleshooting

### "Error 401: invalid_client"
- **Most common**: The Client ID doesn't exist or is incorrectly copied
- Make sure you created the OAuth client in the correct Google Cloud project
- Double-check that you copied the entire Client ID (it's quite long)
- Ensure you're using the Client ID, not the Project ID

### "Error 400: redirect_uri_mismatch"
- The redirect URI in your Google Cloud Console must match exactly
- Make sure `http://localhost:5173` is added to Authorized redirect URIs
- Check for trailing slashes or protocol differences (http vs https)

### "Access blocked: Authorization error"
- Your email needs to be added as a test user in the OAuth consent screen
- Go to OAuth consent screen > Test users and add your email
- Wait a few minutes for the changes to take effect

### "Google Client ID is missing" error
- Make sure `VITE_GOOGLE_CLIENT_ID` is set in your `.env` file
- Restart the development server after changing environment variables
- Check that the `.env` file is in the project root directory

### Button not showing
- Ensure the Google OAuth provider is properly configured in App.jsx
- Check browser console for any errors (F12 > Console)
- Verify that `@react-oauth/google` package is installed

### "The OAuth client was not found"
- This means the Client ID you're using doesn't exist in Google Cloud Console
- Go to Credentials and verify the client exists
- If not, create a new OAuth client following the steps above

## Important Notes

### Development vs Production
- For development, use `http://localhost:5173` (or 5174 if that's your port)
- When deploying, you'll need to add your production domain to both Authorized JavaScript origins and redirect URIs
- You'll also need to publish your app from testing mode to production

### Security
- Never commit your `.env` file to version control
- Never share your Client Secret publicly
- Use different Client IDs for development and production if possible

### Publishing Your App
- When ready for production, go to OAuth consent screen
- Click "Publish App"
- Complete the verification process (Google may require additional information)
- This removes the "testing mode" limitation