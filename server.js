"use strict";

const express = require('express');
const path = require('path');
const connectDB = require(path.join(__dirname, 'src', 'lib', 'database', 'mongodb', 'db'));
const mongoose = require('mongoose');


const app = express();

// Connetti al database
connectDB();

// Middleware e route
app.use(express.json());

//Schema di esempio per testare la connessione
const TestSchema = new mongoose.Schema({
  name: { type: String, required:true },
  age: { type: Number },
})

const TestModel = mongoose.model('Test', TestSchema);

//proviamo un test di inserimento
app.get('/addTestData', async (req, res) => {
  try {
    const newTestData = new TestModel({
      name: 'Matteo',
      age: 32,
    });

    await newTestData.save();
    res.send('dati inseriti con successo!!!');
  } catch (err) {
    res.status(500).send('Errore nell\'inserimento dei dati:' + err.message);
  }
});

//rotta principale
app.get('/', (req, res) => res.send('API funzionante!'));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server in ascolto su porta ${PORT}`));
