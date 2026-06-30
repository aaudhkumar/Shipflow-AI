const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'node_modules', '@pinecone-database', 'pinecone', 'dist', 'data', 'upsert.js');
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(content.substring(content.indexOf('validator('), content.indexOf('validator(') + 1500));
} else {
  console.log("File not found at", file);
}
