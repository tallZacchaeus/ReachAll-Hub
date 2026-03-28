# Tech Staff Evaluation Platform - Project Guide

Welcome to the **Tech Staff Evaluation Platform** project guide. This document is designed to be a comprehensive, educational resource for anyone looking to understand, install, or develop this application. We have broken down complex technical concepts into basic terms to make it easy to follow.

---

## 1. What is Tech Staff Evaluation Platform?
**Tech Staff Evaluation Platform** is a professional ecosystem designed for technology companies to manage their staff. It combines performance evaluation, team communication (Chat), and administrative workflows (like profile updates and attendance) into one single, beautiful interface.

### The Big Picture:
- **For Staff**: A place to track their work, chat with teammates, and manage their professional profile.
- **For HR/Admins**: A powerful dashboard to monitor company health, approve requests, and evaluate performance.

---

## 2. The Technology Stack (How it's built)
Think of a web application like a house. Different materials are used for different parts:

*   **Laravel (The Skeleton & Brain - Backend)**: Written in PHP, Laravel handles the "behind the scenes" logic. It manages the database, handles security, and processes data before sending it to the screen.
*   **React (The Interior Design & Interaction - Frontend)**: React is a JavaScript library used to build the user interface. It makes the app feel fast and "alive" with smooth buttons and real-time updates.
*   **Inertia.js (The Bridge)**: Usually, Laravel and React are hard to connect. Inertia.js acts as a "glue" that lets them work together seamlessly without needing a complex API system.
*   **Tailwind CSS (The Paint & Style)**: This is used to make the app look modern and beautiful without writing thousands of lines of custom CSS.
*   **SQLite (The Filing Cabinet - Database)**: A lightweight database that stores all your information (users, messages, tasks) in a single file on the server.

---

## 3. Every Feature Explained

### 🔐 Authentication & Security
- **Employee ID Login**: Users don't use usernames; they use a unique ID (like EMP001).
- **Role-Based Access**: The app changes based on who you are. A "Staff" member sees their tasks, while a "Super Admin" sees everything.
- **Email Verification**: A safety feature that ensures every user has a valid email before they can fully access the platform.

### 💬 Advanced Chat System
- **Direct Messages & Groups**: Staff can talk 1-on-1 or in department groups.
- **Rich Interaction**: Includes message reactions (emojis), editing sent messages, and deleting them.
- **File Sharing**: Users can upload images, PDFs, and videos directly into the chat.
- **Typing Indicators**: See when someone is writing to you in real-time.

### 👤 Profile Management (Approval Workflow)
This is an educational example of a "Secure Workflow":
1.  A user wants to change their name or email.
2.  They submit the change, but it **doesn't** update the database yet.
3.  The request goes to a "Pending" list.
4.  An **HR Manager** reviews it and clicks "Approve."
5.  **Only then** does the user's profile actually change.

### 📈 Performance & Analytics
- **Leaderboards**: Visualizes top-performing staff based on points or evaluations.
- **Tasks & Projects**: A system to track what everyone is working on.
- **Reports**: Generates charts and figures to show company progress.

---

## 4. Understanding the Folder Structure
If you open the project folder, here is where the important things live:

-   `app/Models/`: These files define the "Objects" in our app (User, Message, Project).
-   `app/Http/Controllers/`: The "Command Center" where the logic for each feature is written.
-   `routes/web.php`: The "Map" of the application that tells the server which URL leads to which feature.
-   `resources/js/Pages/`: This is where the React screens live. Each file is a different page (Chat, Dashboard, Profile).
-   `resources/js/components/`: Smaller, reusable parts of the UI (buttons, sidebars, charts).
-   `database/migrations/`: The "Blueprints" for our database tables.

---

## 5. Database Architecture (The Schema)
Our data is organized into several "Tables":
-   **Users**: Stores names, IDs, roles, and encrypted passwords.
-   **Conversations**: Links users together for chatting.
-   **Messages**: Stores every text sent, including timestamps and file paths.
-   **Profile Change Requests**: A temporary storage for profile updates waiting for approval.

---

## 6. Local Installation (For Developers)

To run this project on your own computer, follow these basic steps:

### Prerequisites:
1.  **PHP** (v8.2 or higher)
2.  **Node.js & NPM** (For the frontend)
3.  **Composer** (The PHP package manager)

### Installation Steps:
1.  **Download the project** to your computer.
2.  **Install PHP libraries**:
    ```bash
    composer install
    ```
3.  **Install JavaScript libraries**:
    ```bash
    npm install
    ```
4.  **Setup Environment**:
    - Build a `.env` file (copy from `.env.example`).
    - Generate a security key: `php artisan key:generate`.
5.  **Setup Database**:
    ```bash
    php artisan migrate --seed
    ```
    *(This creates the tables and adds test users like admin@example.com)*
6.  **Run the Servers**:
    - Open one terminal and run: `php artisan serve`
    - Open another terminal and run: `npm run dev`
7.  **Access the App**: Open your browser to `http://localhost:8000`.

---

## 7. Deployment (Taking it Live)
When you are ready to show this to the world, we have provided three tools:
-   `DEPLOYMENT_GUIDE.md`: Detailed instructions for cPanel, VPS, or Cloud.
-   `QUICK_DEPLOY.md`: A fast comparison of hosting options.
-   `deploy.sh`: A script that automatically packages your app for production.

---

*This document is a living resource. As new features (like upcoming AI integrations or advanced reporting) are added, this guide will be updated to reflect those changes.*
