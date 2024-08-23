npm run build
[ -d .../public/static ] || mkdir ../public/static
[ -d .../public/static/frontend ] || mkdir ../public/static/frontend
[ -d .../public/static/media ] || mkdir ../public/static/media

echo "Remove old\n"
rm ../public/static/frontend/*
rm ../public/static/media/*

echo "Remove additional\n"
rm build/static/css/*.map
rm build/static/js/*.map
rm build/static/js/*.txt

echo "Deploy\n"
cp build/static/media/* ../public/static/media/
cp build/static/js/main*.js ../public/static/frontend/main.js
cp build/static/css/main*.css ../public/static/frontend/main.css

echo "done"