"use strict";

const express = require('express');
const path = require('path');
const connectDB = require(path.join(__dirname, 'src', 'lib', 'database', 'mongodb', 'db'));


const app = express();

// Connetti al database
connectDB();

// Middleware e route
app.use(express.json());

app.get('/', (req, res) => res.send('API funzionante!'));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server in ascolto su porta ${PORT}`));
