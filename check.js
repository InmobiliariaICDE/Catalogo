const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const regex = /on[a-z]+="([^"]+)"/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  const code = match[1];
  try {
    new Function(code);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.log('SyntaxError in attribute: ' + code);
      console.log(e.message);
    }
  }
}

