#!/bin/bash

# Tech Staff Evaluation Platform - Production Deployment Script
# This script prepares your application for production deployment

set -e  # Exit on error

echo "🚀 Starting deployment preparation..."

# 1. Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: artisan file not found. Are you in the project root?"
    exit 1
fi

# 2. Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Please update .env with your production credentials"
fi

# 3. Install/Update Composer dependencies
echo "📦 Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev

# 4. Install/Update NPM dependencies
echo "📦 Installing NPM dependencies..."
npm ci

# 5. Build frontend assets
echo "🏗️  Building production assets..."
npm run build

# 6. Generate application key (if not set)
if grep -q "APP_KEY=$" .env; then
    echo "🔑 Generating application key..."
    php artisan key:generate
fi

# 7. Run database migrations
echo "🗄️  Running database migrations..."
read -p "Do you want to run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan migrate --force
fi

# 8. Seed database
read -p "Do you want to seed the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan db:seed --force
fi

# 9. Create storage link
echo "🔗 Creating storage link..."
php artisan storage:link

# 10. Clear and cache everything
echo "🧹 Clearing caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo "📝 Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 11. Set proper permissions
echo "🔒 Setting permissions..."
chmod -R 755 storage
chmod -R 755 bootstrap/cache

# 12. Remove development files
echo "🗑️  Removing development files..."
rm -rf node_modules
rm -rf tests
rm -rf .git

# 13. Create deployment package
echo "📦 Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="techstaff_deployment_${TIMESTAMP}.zip"

zip -r "$PACKAGE_NAME" . \
    -x "*.git*" \
    -x "node_modules/*" \
    -x "tests/*" \
    -x "storage/logs/*" \
    -x ".env" \
    -x "*.md"

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📦 Deployment package created: $PACKAGE_NAME"
echo ""
echo "Next steps:"
echo "1. Upload $PACKAGE_NAME to your server"
echo "2. Extract the files"
echo "3. Update .env with production credentials"
echo "4. Set proper file permissions"
echo "5. Point your web server to the public/ directory"
echo ""
echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
