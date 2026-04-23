# ReachAll Hub

ReachAll Hub is a Laravel-based platform for managing technology staff, featuring performance evaluations, team communication, and administrative workflows.

## 📖 Project Documentation
For a deep-dive into how this project works, including educational explanations of every feature and installation guides, please see our master guide:

👉 **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)**

## 🚀 Quick Start (Local Development)

1. **Install Dependencies**:
   ```bash
   composer install
   npm install
   ```

2. **Setup Environment**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Database Setup**:
   ```bash
   touch database/database.sqlite
   php artisan migrate --seed
   ```

4. **Run Servers**:
   ```bash
   # Terminal 1
   php artisan serve
   
   # Terminal 2
   npm run dev
   ```

## 🏗️ Technical Stack
- **Backend**: Laravel 12.x (PHP)
- **Frontend**: React 19 (TypeScript)
- **Bridge**: Inertia.js
- **Database**: SQLite
- **Styling**: Tailwind CSS / Shadcn UI

## 📄 License
This project is proprietary.
