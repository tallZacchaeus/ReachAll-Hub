# Deployment Guide — ReachAll Hub

This guide covers deploying your Laravel + React (Inertia.js) application to production.

> **Note:** for the current Hostinger VPS runbook (with `chat:migrate-attachments`,
> SEC-03 audit-log grants, and SEC-02 chat disk migration steps) see
> `docs/audits/now-deploy-checklist-2026-04-26.md`. This file is the older
> generic guide retained for shared-hosting / Forge users.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Shared Hosting (cPanel)](#shared-hosting-cpanel)
3. [VPS/Cloud Hosting (DigitalOcean, AWS, etc.)](#vpscloud-hosting)
4. [Laravel Forge](#laravel-forge)
5. [Post-Deployment Steps](#post-deployment-steps)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

### 1. Environment Configuration
Create a production `.env` file with:

```env
APP_NAME="Tech Staff Evaluation Platform"
APP_ENV=production
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://yourdomain.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

# Add your production values for these if needed
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### 2. Build Frontend Assets
```bash
npm run build
```

This creates optimized production assets in `public/build/`.

### 3. Optimize Laravel
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Shared Hosting (cPanel)

### Requirements
- PHP 8.1 or higher
- MySQL 5.7+ or MariaDB 10.3+
- Composer
- Node.js & NPM (for building assets)

### Step 1: Prepare Your Files

1. **Build assets locally:**
   ```bash
   npm run build
   ```

2. **Create deployment package:**
   ```bash
   # Remove development files
   rm -rf node_modules
   rm -rf .git
   
   # Create zip
   zip -r project.zip . -x "*.git*" "node_modules/*" "storage/logs/*"
   ```

### Step 2: Upload to cPanel

1. **Login to cPanel**
2. **File Manager** → Navigate to `public_html` (or your domain folder)
3. **Upload** `project.zip`
4. **Extract** the zip file

### Step 3: Configure Directory Structure

cPanel expects files in `public_html`. Laravel's public files are in the `public` folder.

**Option A: Move public contents (Recommended)**
```bash
# Via cPanel Terminal or SSH
cd /home/username/public_html

# Move all files from public/ to public_html/
mv public/* ./
mv public/.htaccess ./

# Update index.php paths
# Edit index.php and change:
# require __DIR__.'/../vendor/autoload.php';
# to:
# require __DIR__.'/vendor/autoload.php';

# And change:
# $app = require_once __DIR__.'/../bootstrap/app.php';
# to:
# $app = require_once __DIR__.'/bootstrap/app.php';
```

**Option B: Use subdomain/addon domain**
- Point domain document root to `/home/username/public_html/your-project/public`

### Step 4: Set Permissions

```bash
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

### Step 5: Create Database

1. **cPanel** → **MySQL Databases**
2. **Create Database**: `username_techstaff`
3. **Create User**: `username_techuser`
4. **Add User to Database** with all privileges

### Step 6: Configure Environment

1. Rename `.env.example` to `.env`
2. Update database credentials:
   ```env
   DB_DATABASE=username_techstaff
   DB_USERNAME=username_techuser
   DB_PASSWORD=your_password
   ```

### Step 7: Install Dependencies & Setup

Via cPanel Terminal or SSH:

```bash
cd /home/username/public_html

# Install Composer dependencies
composer install --optimize-autoloader --no-dev

# Generate app key
php artisan key:generate

# Create storage link
php artisan storage:link

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed --force

# Cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 8: Configure .htaccess

Ensure your `.htaccess` in the root (public_html) has:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Redirect to HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    
    # Redirect Trailing Slashes...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]
    
    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

---

## VPS/Cloud Hosting

### Requirements
- Ubuntu 22.04 LTS (recommended)
- Root or sudo access
- Domain name pointed to server IP

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y software-properties-common

# Add PHP repository
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.2 and extensions
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common \
    php8.2-mysql php8.2-zip php8.2-gd php8.2-mbstring \
    php8.2-curl php8.2-xml php8.2-bcmath php8.2-sqlite3

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx
sudo apt install -y nginx

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Configure MySQL

```bash
# Secure MySQL
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE techstaff_db;
CREATE USER 'techstaff_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON techstaff_db.* TO 'techstaff_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Deploy Application

```bash
# Create directory
sudo mkdir -p /var/www/techstaff
cd /var/www/techstaff

# Clone or upload your project
# Option 1: Git
git clone https://github.com/yourusername/your-repo.git .

# Option 2: Upload via SCP/SFTP
# scp -r /path/to/local/project user@server:/var/www/techstaff

# Set permissions
sudo chown -R www-data:www-data /var/www/techstaff
sudo chmod -R 755 /var/www/techstaff
sudo chmod -R 775 /var/www/techstaff/storage
sudo chmod -R 775 /var/www/techstaff/bootstrap/cache
```

### Step 4: Install Dependencies

```bash
cd /var/www/techstaff

# Install PHP dependencies
composer install --optimize-autoloader --no-dev

# Install Node dependencies and build
npm ci
npm run build

# Remove node_modules (not needed in production)
rm -rf node_modules
```

### Step 5: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env
nano .env
```

Update these values:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_DATABASE=techstaff_db
DB_USERNAME=techstaff_user
DB_PASSWORD=strong_password_here
```

```bash
# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed --force

# Create storage link
php artisan storage:link

# Cache everything
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/techstaff
```

Add this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/techstaff/public;
    index index.php index.html;

    # Logging
    access_log /var/log/nginx/techstaff-access.log;
    error_log /var/log/nginx/techstaff-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/techstaff /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

### Step 8: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Laravel Forge

Laravel Forge is the easiest way to deploy Laravel applications.

### Step 1: Sign Up
1. Go to [forge.laravel.com](https://forge.laravel.com)
2. Connect your server provider (DigitalOcean, AWS, Linode, etc.)

### Step 2: Create Server
1. Click **Create Server**
2. Choose provider and server size
3. Select PHP 8.2
4. Choose database (MySQL)
5. Click **Create**

### Step 3: Create Site
1. Click **New Site**
2. Enter domain: `yourdomain.com`
3. Select project type: **Laravel**
4. Click **Add Site**

### Step 4: Deploy Repository
1. Go to **Apps** tab
2. Connect Git repository
3. Enter branch: `main`
4. Click **Install Repository**

### Step 5: Configure Environment
1. Go to **Environment** tab
2. Update `.env` variables
3. Click **Save**

### Step 6: Enable Quick Deploy
1. Go to **Apps** tab
2. Enable **Quick Deploy**
3. Now every push to `main` auto-deploys

### Step 7: SSL Certificate
1. Go to **SSL** tab
2. Click **Let's Encrypt**
3. Enter email
4. Click **Obtain Certificate**

---

## Post-Deployment Steps

### 1. Test Application
- Visit your domain
- Test login functionality
- Test all major features
- Check file uploads work
- Verify database connections

### 2. Setup Monitoring
- Enable error logging
- Setup uptime monitoring (UptimeRobot, Pingdom)
- Configure email notifications for errors

### 3. Backup Strategy
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u techstaff_user -p techstaff_db > /backups/db_$DATE.sql
```

### 4. Performance Optimization
```bash
# Enable OPcache (already done if using PHP-FPM)
# Configure in /etc/php/8.2/fpm/php.ini

# Queue workers (if using queues)
sudo nano /etc/supervisor/conf.d/laravel-worker.conf
```

### 5. Security Checklist
- ✅ HTTPS enabled
- ✅ `APP_DEBUG=false`
- ✅ Strong database passwords
- ✅ File permissions correct (755 for directories, 644 for files)
- ✅ `.env` file not publicly accessible
- ✅ Firewall configured
- ✅ Regular security updates

---

## Troubleshooting

### 500 Internal Server Error
```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check PHP-FPM logs
sudo tail -f /var/log/php8.2-fpm.log
```

### Permission Issues
```bash
# Fix storage permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Database Connection Failed
- Verify credentials in `.env`
- Check MySQL is running: `sudo systemctl status mysql`
- Test connection: `mysql -u username -p database_name`

### Assets Not Loading
```bash
# Rebuild assets
npm run build

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

---

## Maintenance Mode

```bash
# Enable maintenance mode
php artisan down --message="Upgrading system" --retry=60

# Perform updates
git pull
composer install --no-dev
npm run build
php artisan migrate --force

# Disable maintenance mode
php artisan up
```

---

## Support

For issues specific to this deployment guide, check:
- Laravel Documentation: https://laravel.com/docs
- Inertia.js Documentation: https://inertiajs.com
- Server configuration guides for your hosting provider

---

**Good luck with your deployment! 🚀**
