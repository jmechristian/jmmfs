#!/bin/bash

echo "🏈 NFL Pick'em Showdown Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please install MongoDB or use a cloud instance."
fi

echo "✅ Node.js found: $(node --version)"

# Setup backend
echo "📦 Setting up backend..."
cd server
npm install

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please update .env with your API keys and database URI"
fi

# Setup frontend
echo "📦 Setting up frontend..."
cd ../web
npm install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update server/.env with your API keys:"
echo "   - API_SPORTS_KEY (from api-sports.io)"
echo "   - THE_ODDS_API_KEY (from the-odds-api.com)"
echo "   - MONGODB_URI (your MongoDB connection string)"
echo "   - JWT_SECRET (a secure random string)"
echo ""
echo "2. Start the backend:"
echo "   cd server && npm run dev"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   cd web && npm run dev"
echo ""
echo "4. Visit http://localhost:5173 to use the app"
echo ""
echo "🏈 Good luck with your picks!"
