#!/bin/bash

echo "🏃 PhysioAssist Setup Script"
echo "=========================="

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ is required (found $(node -v))"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Platform-specific setup
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🍎 macOS detected - Setting up iOS dependencies..."
    cd ios && pod install && cd ..
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Environment Configuration
NODE_ENV=development

# Feature Flags
ENABLE_DEBUG_MODE=true
ENABLE_PERFORMANCE_MONITOR=false

# API Configuration (if needed)
# API_URL=http://localhost:3000
EOL
fi

# Setup git hooks
echo ""
echo "🪝 Setting up git hooks..."
npx husky install

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. To run on web:     npm run web"
echo "2. To run on iOS:     npm run ios"
echo "3. To run on Android: npm run android"
echo "4. To run tests:      npm test"
echo ""
echo "Happy coding! 🎉"