const express = require('express');
const app = express();

// Middleware per gestire JSON
app.use(express.json());

// Rotte di esempio
app.get('/', (req, res) => {
    res.send('Benvenuto nel backend con Express!');
});

// Avvio del server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
