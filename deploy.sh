#!/bin/bash
# ============================================================
#  Moni's Munchies — VPS Deploy Script
#  Place this file on your SERVER at /var/www/monismunchies/
#  Run it on the server after pushing changes to GitHub:
#
#    ssh root@YOUR_VPS_IP
#    cd /var/www/monismunchies
#    bash deploy.sh
# ============================================================

set -e  # Stop if any command fails

echo ""
echo "🍪 Moni's Munchies — Deploying..."
echo "=================================="

# Pull latest changes from GitHub
git pull origin main

# Fix permissions (in case new files were added)
chown -R www-data:www-data /var/www/monismunchies
chmod -R 755 /var/www/monismunchies

# Reload Nginx (no downtime)
systemctl reload nginx

echo ""
echo "✅ Deploy complete! Live at https://monismunchies.com"
echo ""
