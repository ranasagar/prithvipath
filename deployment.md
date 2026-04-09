# Deployment & Launch Guide

This guide outlines the steps to take the Prithvi Path Webapp live using free, scalable resources and how to upgrade as the site grows.

## 1. Version Control (GitHub)
- **Repo Setup**: Create a new repository on GitHub (Private or Public).
- **Push Code**:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin <your-repo-url>
  git push -u origin main
  ```

## 2. Frontend Deployment (Vercel)
Vercel is the recommended platform for React/Vite applications.
1. **Connect**: Sign in to [Vercel](https://vercel.com) and click "Add New" > "Project".
2. **Import**: Import your GitHub repository.
3. **Configure**:
   - **Framework Preset**: Vite (detected automatically).
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
4. **Environment Variables**: Add any keys from your `.env` file (e.g., Firebase config).
5. **Deploy**: Click "Deploy". Your site is now live on a `.vercel.app` subdomain!

## 3. Backend & Database (Firebase)
For Firestore and Auth:
1. **Production Project**: Go to [Firebase Console](https://console.firebase.google.com).
2. **Setup**: Enable Authentication (Email/Google) and Firestore Database.
3. **Rules**: Ensure `firestore.rules` are deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. **Collections**: Ensure `settings`, `articles`, `categories`, and `youtube_videos` are initialized.

## 4. Scaling & Upgrading
When you need more space, bandwidth, or seats:

### Vercel (Frontend)
- **Free Tier**: 100GB Bandwidth, 6,000 Build Minutes.
- **Pro ($20/mo)**: 1TB Bandwidth, increased concurrency, and team collaboration.

### Firebase (Storage/Database)
- **Spark Plan (Free)**: 1GB Storage, 50k reads/day.
- **Blaze Plan (Pay as you go)**: Highly recommended for production. You only pay for what you use exceeding the free tier. $0.18/GB for Storage is typical.

## 5. Domain Name
- Purchase a domain (e.g., Namecheap, Google Domains).
- Under Vercel project settings, go to "Domains" and add your custom domain.
- Update DNS records at your registrar as instructed by Vercel.

---
> [!TIP]
> Always enable **CORS** and **Authorized Domains** in the Firebase Console to ensure your Vercel deployment can communicate securely with the database.
