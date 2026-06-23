const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { Product } = require('./models');
const sequelize = require('./config/database');
require('dotenv').config();

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Paths to scan
const pagesDir = path.resolve(__dirname, '../../frontend/src/Pages');

async function seedData() {
  try {
    // 1. Authenticate DB connection
    await sequelize.authenticate();
    console.log('✅ Connected to database. Starting parsing of static frontend components...');

    // 2. Read all files in the Pages directory
    const files = fs.readdirSync(pagesDir);
    const productFiles = files.filter(file => {
      const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
      // A product page will import the ColorAvailable component
      return content.includes('ColorAvailable');
    });

    console.log(`🔍 Found ${productFiles.length} product page files to migrate.`);

    for (const file of productFiles) {
      const filePath = path.join(pagesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      console.log(`\n📦 Migrating: ${file}...`);

      // Extract Name
      const nameMatch = content.match(/name=["']([^"']+)["']/);
      const name = nameMatch ? nameMatch[1] : path.basename(file, '.jsx');

      // Extract Price
      const priceMatch = content.match(/price=["']\$?([^"']+)["']/);
      let price = 0;
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }

      // Extract Code / SKU
      const codeMatch = content.match(/code=["']([^"']+)["']/);
      const code = codeMatch ? codeMatch[1].trim() : `SKU-${Date.now()}`;

      // Extract Model Info
      const modelMatch = content.match(/model=["']([^"']+)["']/);
      const modelInfo = modelMatch ? modelMatch[1] : '';

      // Extract Description / Instruction
      const descMatch = content.match(/instruction=["']([^"']+)["']/);
      const description = descMatch ? descMatch[1] : '';

      // Extract Color
      const colorMatch = content.match(/color=["']([^"']+)["']/);
      const colors = colorMatch ? [colorMatch[1]] : ['Default'];

      // Sizes are static size choices in standard designs
      const sizes = ['XS', 'S', 'M', 'L', 'XL'];

      // Determine Category by scanning imports for Men or Women folders
      let category = 'Women';
      if (content.includes('/Men/')) {
        category = 'Men';
      }

      // Extract all imported local image paths
      // Example: import img1 from '../assets/Images/Women/Strap Top/ZANDO.jpg'
      const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
      let importMatch;
      const imageImports = {};

      while ((importMatch = importRegex.exec(content)) !== null) {
        const [_, varName, importPath] = importMatch;
        if (importPath.includes('/assets/Images/')) {
          // Resolve relative path to absolute path
          imageImports[varName] = path.resolve(pagesDir, importPath);
        }
      }

      // Collect all images used in the page
      // Find the "images" array defined in the code: const images = [img2, img3...]
      const imagesArrayMatch = content.match(/const\s+images\s*=\s*\[([^\]]+)\]/);
      const imageUrls = [];

      // Add main thumbnail image first
      // Find thumbnail variable: src={img1} in ColorAvailable or similar
      const thumbMatch = content.match(/src={(\w+)}/);
      if (thumbMatch && imageImports[thumbMatch[1]]) {
        const localPath = imageImports[thumbMatch[1]];
        if (fs.existsSync(localPath)) {
          console.log(`📤 Uploading main thumbnail (${thumbMatch[1]}) to Cloudinary...`);
          const result = await cloudinary.uploader.upload(localPath, {
            folder: 'ten11_ecommerce_products'
          });
          imageUrls.push(result.secure_url);
        }
      }

      // Add other images
      if (imagesArrayMatch) {
        const variables = imagesArrayMatch[1].split(',').map(v => v.trim());
        for (const varName of variables) {
          if (imageImports[varName] && !imageUrls.includes(imageImports[varName])) {
            const localPath = imageImports[varName];
            if (fs.existsSync(localPath)) {
              console.log(`📤 Uploading detail image (${varName}) to Cloudinary...`);
              const result = await cloudinary.uploader.upload(localPath, {
                folder: 'ten11_ecommerce_products'
              });
              imageUrls.push(result.secure_url);
            }
          }
        }
      }

      // Save to database
      // Check if product code already exists
      const existingProduct = await Product.findOne({ where: { code } });
      if (!existingProduct) {
        // Initialize default stock mappings (10 units per option)
        const initialSizeStock = {};
        colors.forEach(c => {
          initialSizeStock[c] = {};
          sizes.forEach(s => {
            initialSizeStock[c][s] = 10;
          });
        });

        const initialColorStock = {};
        colors.forEach(c => {
          initialColorStock[c] = sizes.length * 10;
        });

        await Product.create({
          code,
          name,
          price,
          description,
          modelInfo,
          category,
          images: imageUrls,
          colors,
          sizes,
          sizeStock: initialSizeStock,
          colorStock: initialColorStock
        });
        console.log(`✅ Saved product to database: "${name}" (Code: ${code})`);
      } else {
        console.log(`ℹ️ Product with code "${code}" already exists in database. Skipping.`);
      }
    }

    console.log('\n🎉 Seeding finished successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seedData();
