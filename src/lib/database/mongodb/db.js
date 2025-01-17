const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/bool_n_dreams');
    console.log('MongoDB connesso con successo!');
  } catch (err) {
    console.error(`Errore di connessione: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
