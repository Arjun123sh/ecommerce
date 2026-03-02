# Lumina - Premium E-Commerce Platform

Lumina is a production-ready, brand-driven MERN stack e-commerce startup focused on premium desk accessories and workspace organization tools.

## Features

- **Storefront**: Browse products by category, search by title, sort by price.
- **Cart & Checkout**: Stripe integration for secure payments.
- **User Dashboard**: Track order history and delivery status.
- **Admin Dashboard**: Manage inventory, create products, fulfill orders, and track revenue.
- **Authentication**: Custom JWT-based authentication with role-based access control (Admin/User).

## Tech Stack

### Frontend (User & Admin Portals)
- **Framework**: React + Vite
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI Primitives
- **State Management**: React Query (Server State), React Context (Client State)
- **Routing**: React Router
- **Payments**: Stripe Elements (`@stripe/react-stripe-js`)

### Backend (REST API)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT & bcryptjs
- **Security**: Helmet, CORS, custom error handling middlewares
- **Payments**: Stripe Node SDK

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas URI or local instance
- Stripe Account (Test mode API keys)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables locally in `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=sk_test_...
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the root directory (frontend):
   ```bash
   cd ..
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables locally in `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Frontend (Vercel)
1. Import the root repository to Vercel.
2. The Build Command is automatically detected as `npm run build` and the Output Directory as `dist`.
3. Add the `VITE_API_URL` environment variable pointing to your deployed backend URL.

### Backend (Render / Railway)
1. Deploy the `/backend` subdirectory.
2. Set the Build Command to `npm install`.
3. Set the Start Command to `npm start`.
4. Configure all required Environment Variables (`MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `FRONTEND_URL`).

## License
MIT
