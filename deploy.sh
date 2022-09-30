# Force sync origin to remote
git checkout master
git reset --hard origin/master
git pull -r

# Build react app
npm install
npm run build

# Copy build files to nginx index directory 
cp -aR ./build/. /var/www/html/

# Restart nginx to apply file changes
systemctl restart nginx

# Clean up
rm -rf build

echo "Done!"