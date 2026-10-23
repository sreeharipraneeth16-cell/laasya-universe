const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'source');

let html = fs.readFileSync(path.join(sourceDir, 'index.html'), 'utf8');

const css = fs.readFileSync(path.join(sourceDir, 'styles.css'), 'utf8');
if (!html.includes('<link rel="stylesheet" href="styles.css" />')) throw new Error('CSS link not found');
html = html.replace('<link rel="stylesheet" href="styles.css" />', () => '<style>\n' + css + '\n</style>');

const js = fs.readFileSync(path.join(sourceDir, 'script.js'), 'utf8');
if (!html.includes('<script src="script.js"></script>')) throw new Error('script tag not found');
html = html.replace('<script src="script.js"></script>', () => '<script>\n' + js + '\n</script>');

const imgTag = 'src="../assets/best-moment.jpg"';
const photo = path.join(rootDir, 'assets', 'best-moment.jpg');
if (!fs.existsSync(photo)) throw new Error('photo missing: assets/best-moment.jpg');
const b64 = fs.readFileSync(photo).toString('base64');
const count = html.split(imgTag).length - 1;
if (!count) throw new Error('photo tag not found in source');
html = html.split(imgTag).join('src="data:image/jpeg;base64,' + b64 + '"');

fs.writeFileSync(path.join(rootDir, 'index.html'), html);
console.log('photo: embedded (' + count + ' place(s), ' + Math.round(fs.statSync(photo).size / 1024) + ' KB)');
console.log('built: index.html (' + Math.round(Buffer.byteLength(html) / 1024) + ' KB)');
