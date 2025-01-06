"use strict";

const express = require('express');
const connectDB = require('./srv/database/mongodb/db');

const app = express();

// Connetti al database
connectDB();

// Middleware e route
app.use(express.json());

app.get('/', (req, res) => res.send('API funzionante!'));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server in ascolto su porta ${PORT}`));
