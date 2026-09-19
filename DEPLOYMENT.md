# Finance Tracker - Deployment Guide

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- A hosting provider (Vercel, Netlify, Railway, Render, etc.)
- A database (PostgreSQL for production)

## Deployment Options

### Option 1: Vercel (Recommended for Full Stack)

#### Backend Deployment (Vercel)

1. **Prepare your project for Vercel:**
   ```bash
   npm install -g vercel
   ```

2. **Create a `vercel.json` file in the project root:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/src/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/src/index.js"
       },
       {
         "src": "/(.*)",
         "dest": "/client/$1"
       }
     ]
   }
   ```

3. **Update server for serverless:**
   - Modify `server/src/index.js` to export the app:
   ```javascript
   import 'dotenv/config';
   import app from './app.js';

   const PORT = process.env.PORT || 3000;

   // For local development
   if (process.env.NODE_ENV !== 'production') {
     app.listen(PORT, () => {
       console.log(`🚀 Finance Tracker API running on http://localhost:${PORT}`);
     });
   }

   // For Vercel/serverless
   export default app;
   ```

4. **Deploy to Vercel:**
   ```bash
   vercel
   ```

5. **Add environment variables in Vercel dashboard:**
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET` (generate a secure random string)
   - `CLIENT_URL` (your Vercel domain)
   - `NODE_ENV=production`

#### Frontend Deployment (Vercel)

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy the `dist` folder to Vercel:**
   - Connect your GitHub repository to Vercel
   - Set root directory to `client`
   - Configure build settings:
     - Build command: `npm run build`
     - Output directory: `dist`

### Option 2: Railway (Simple Full Stack)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Railway project:**
   ```bash
   railway init
   railway up
   ```

3. **Add PostgreSQL database:**
   ```bash
   railway add postgresql
   ```

4. **Configure environment variables:**
   ```bash
   railway variables set PORT=3000
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-secure-secret
   ```

5. **Set up database:**
   ```bash
   railway run npx prisma migrate dev
   railway run npx prisma generate
   ```

### Option 3: Render (Backend) + Netlify (Frontend)

#### Backend on Render

1. **Create a `render.yaml` file:**
   ```yaml
   services:
     - type: web
       name: finance-tracker-api
       env: node
       buildCommand: cd server && npm install
       startCommand: cd server && npm start
       envVars:
         - key: PORT
           value: 3000
         - key: DATABASE_URL
           fromDatabase:
             name: finance-tracker-db
             property: connectionString
   ```

2. **Connect your GitHub repository to Render**
3. **Add PostgreSQL database**
4. **Deploy**

#### Frontend on Netlify

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Create `netlify.toml` in client folder:**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Deploy to Netlify:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

### Option 4: Self-Hosted (VPS/DigitalOcean)

1. **Get a VPS (DigitalOcean, Linode, etc.)**
2. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

3. **Install dependencies:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo apt-get install -y postgresql
   sudo apt-get install -y nginx
   ```

4. **Clone your repository:**
   ```bash
   git clone your-repo-url
   cd odoo-practice-2
   ```

5. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

6. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

7. **Set up database:**
   ```bash
   cd server
   npx prisma migrate deploy
   npx prisma generate
   ```

8. **Build frontend:**
   ```bash
   cd ../client
   npm run build
   ```

9. **Set up PM2 for process management:**
   ```bash
   sudo npm install -g pm2
   cd ../server
   pm2 start src/index.js --name finance-tracker-api
   pm2 save
   pm2 startup
   ```

10. **Configure Nginx:**
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;

        # Frontend
        location / {
            root /path/to/client/dist;
            try_files $uri $uri/ /index.html;
        }

        # Backend API
        location /api {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

11. **Set up SSL with Let's Encrypt:**
    ```bash
    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

## Environment Variables Checklist

For production deployment, ensure these environment variables are set:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure random string for JWT tokens
- `NODE_ENV=production`
- `CLIENT_URL` - Your production frontend URL

### Optional (for email features)
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

## Database Setup

### PostgreSQL Setup (Recommended for Production)

1. **Create a PostgreSQL database:**
   ```sql
   CREATE DATABASE finance_tracker;
   ```

2. **Update your `.env` file:**
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/finance_tracker
   ```

3. **Run migrations:**
   ```bash
   cd server
   npx prisma migrate deploy
   npx prisma generate
   ```

## Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Use PostgreSQL instead of SQLite for production
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set up proper CORS for your domain
- [ ] Configure rate limiting
- [ ] Enable helmet security headers
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Review and update environment variables

## Post-Deployment Steps

1. **Test all functionality:**
   - User registration and login
   - Expense CRUD operations
   - Category management
   - Analytics and reports

2. **Set up monitoring:**
   - Error tracking (Sentry, LogRocket)
   - Performance monitoring
   - Uptime monitoring

3. **Configure backups:**
   - Database backups
   - File system backups
   - Disaster recovery plan

4. **Set up analytics:**
   - User analytics
   - Error tracking
   - Performance metrics

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed
- Check Node.js version compatibility
- Verify environment variables are set

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check database server is running
- Ensure database credentials are valid

### API Errors
- Check server logs
- Verify CORS configuration
- Ensure backend is running and accessible

### Frontend Issues
- Clear browser cache
- Check browser console for errors
- Verify API endpoints are correct

## Cost Estimates

### Free Tier Options
- **Vercel**: Free tier available (limited bandwidth)
- **Railway**: $5 free credit, then pay-as-you-go
- **Render**: Free tier available (spins down after inactivity)
- **Netlify**: Free tier available

### Recommended Production Setup
- **Vercel Pro**: $20/month (includes better performance)
- **Railway**: $5-20/month depending on usage
- **Database**: $5-15/month (PostgreSQL on Railway/Render)

## Support

For deployment issues:
- Check the deployment platform's documentation
- Review server logs
- Test locally with production environment variables
- Check community forums for platform-specific issues
