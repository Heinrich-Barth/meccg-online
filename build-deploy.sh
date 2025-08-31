echo "Building frontend component"
cd src-frontend
sh build-deploy.sh

echo "Building server"
cd ..
npm run build
echo "done"