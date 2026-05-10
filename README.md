# FlipEarn - Social Account Marketplace

![FlipEarn Banner](./Webpage%20images/Screenshot%202026-05-10%20103144.png)

FlipEarn is a secure, full-stack marketplace application built on the MERN stack that enables users to seamlessly list, sell, and purchase social media accounts (such as YouTube channels, Instagram handles, Twitter accounts, and more). It provides a reliable platform for content creators and entrepreneurs to trade digital assets with confidence.

## 🖼️ Project Screenshots

![Screenshot 1](./Webpage%20images/Screenshot%202026-05-10%20103144.png)

![Screenshot 2](./Webpage%20images/Screenshot%202026-05-10%20103324.png)

![Screenshot 3](./Webpage%20images/Screenshot%202026-05-10%20103350.png)

![Screenshot 4](./Webpage%20images/Screenshot%202026-05-10%20103401.png)

## 🌟 Key Features

*   **Secure Authentication:** Powered by [Clerk](https://clerk.dev/), offering robust and secure user sign-ups, logins, and session management.
*   **Account Marketplace:** Browse, filter, and search through listed social media accounts with detailed analytics and insights.
*   **Listing Management:** Sellers can easily create, manage, and update their social media account listings. Includes image uploads via Cloudinary.
*   **Secure Transactions & Escrow:** Integrated order flow to ensure secure transactions between buyers and sellers.
*   **In-App Messaging:** Real-time chat functionality allowing buyers and sellers to negotiate and communicate safely within the platform.
*   **Financial Dashboard:** Users can track their earnings, manage their funds, and request withdrawals.
*   **Admin Dashboard:** Comprehensive admin controls to monitor listings, manage users, and oversee transactions.

## 🛠️ Technology Stack

### Frontend (Client)
*   **Framework:** React 19 + Vite
*   **Styling:** TailwindCSS v4
*   **State Management:** Redux Toolkit (`@reduxjs/toolkit`)
*   **Authentication:** `@clerk/clerk-react`
*   **Routing:** React Router v7 (`react-router-dom`)
*   **Icons:** Lucide React

### Backend (Server)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB via Mongoose
*   **Authentication:** `@clerk/express` & Svix (for webhooks)
*   **Media Storage:** Cloudinary & Multer
*   **Security:** Helmet, CORS

## 📁 Project Structure

This is a monorepo setup containing both the client and server applications.

```
FLIPEARN/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components & Admin panels
│   │   ├── pages/          # Application views
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express backend application
│   ├── src/
│   │   ├── models/         # Mongoose schemas (User, Listing, Chat, Finance)
│   │   ├── routes/         # API endpoints (user, listing, order, admin, withdrawal)
│   │   └── index.js        # Entry point
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   MongoDB instance (local or Atlas)
*   Clerk Account (for authentication)
*   Cloudinary Account (for image uploads)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/flipearn.git
    cd flipearn
    ```

2.  **Install Client Dependencies:**
    ```bash
    cd client
    npm install
    ```

3.  **Install Server Dependencies:**
    ```bash
    cd ../server
    npm install
    ```

### Environment Variables

You need to set up `.env` files in both the `client` and `server` directories.

**Client (`client/.env`):**
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000/api
```

**Server (`server/.env`):**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
WEBHOOK_SECRET=your_clerk_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Running the Application Locally

You can run both the frontend and backend development servers concurrently.

1.  **Start the Backend Server:**
    ```bash
    cd server
    npm run dev
    ```
    *(The server will typically run on http://localhost:5000)*

2.  **Start the Frontend Client (in a new terminal):**
    ```bash
    cd client
    npm run dev
    ```
    *(The client will typically run on http://localhost:5173)*

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/flipearn/issues).

## 📝 License

This project is licensed under the [MIT License](LICENSE).
