const fs = require('fs');
const folders = ['routes', 'controllers', 'models', 'middleware', 'config'];

folders.forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
    console.log(`Cartella ${folder} creata.`);
  }
});
console.log('Struttura base del progetto Express creata.');
