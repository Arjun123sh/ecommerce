# Technical Decisions

This document outlines the architectural and architectural design choices made while building the Lumina E-Commerce Platform.

## Architecture Pattern

We adopted a standard **Client-Server RESTful Architecture** using the MERN stack (MongoDB, Express, React, Node).

*   **Vite + React (Frontend)**: Chosen for blazingly fast Hot Module Replacement (HMR) and optimized production builds. 
*   **Node.js + Express (Backend)**: Provides a lightweight, unopinionated routing structure that's excellent for building JSON APIs quickly.
*   **MongoDB (Database)**: Selected for its flexible schema modeling via Mongoose, allowing easy modifications to product structures.

## State Management

*   **React Query (TanStack Query)**: Used for all asynchronous state (fetching products, orders, auth data). This eliminates the need for massive Redux boilerplate, provides built-in caching, automatic retries, and loading/error states out of the box.
*   **Context API**: Used for synchronous global UI state, specifically the Shopping Cart (`CartContext`) and local Authorization mapping (`AuthContext`).

## Authentication Strategy

Instead of relying on a BAAS (Backend-as-a-Service) like Supabase for authentication, we built a **Custom JWT-based Authentication** system on the Node server.

*   **Why?**: Full control over user data privacy, custom role claims (Admin vs User) directly within the database schema, and deeper integration with the order fulfillment process.
*   **Security**: Passwords are mathematically hashed using `bcryptjs` before entering the DB. Tokens are transmitted securely via HTTP headers.

## Payment Processing

*   **Stripe**: Integrated using Stripe Elements on the frontend and the Stripe Node SDK on the backend.
*   **Flow**: 
    1. Cart details are sent to the backend.
    2. Backend verifies product prices against the database (preventing client-side tampering) and checks stock availability.
    3. Backend creates an Order record and a Stripe `PaymentIntent`, returning the `clientSecret`.
    4. Frontend uses the `clientSecret` to render Stripe Elements safely.

## Database Optimization

*   **Text Indexing**: The MongoDB `Product` model includes a `$text` index on the `title` field. This allows lightning-fast search queries directly at the database level rather than filtering arrays in memory on Node.js.
*   **Pagination**: Product listing endpoints include `.limit()` and `.skip()` to handle large inventories efficiently.

## UI / UX Brand Driven Design

*   **Tailwind CSS + Shadcn**: Used heavily for constructing a bespoke design system. Instead of generic templates, we adhered to the 'Lumina' brand guidelines (Slate background, Deep Navy text, Ember CTAs).
*   **Animations**: Built-in micro-animations (`animate-fade-in`, `animate-slide-up`, `hover:scale`) provide a premium feel matching enterprise architectures.
