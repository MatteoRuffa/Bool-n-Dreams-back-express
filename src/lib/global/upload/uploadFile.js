'use strict';

/* ------------------------------------------------------
 * salvataggio sfondo utente
 * 1= verifico se esiste la cartella personale dell'utente
 * 2= saveImagePath : salvo file nella cartella
 * 3= renameFile: rinpmino dopo striming
 * 4= saveImageDb : salvo file nella cartella
 * 5= genero thumb
 *
 * ------------------------------------------------------*/

const fs = require('fs');
const path = require('path');
const imageThumbnail = require('image-thumbnail');

const utility = require('src/lib/global/utility');

module.exports = async (req, res) => {
  try {
    let uploadPath = global.envApp.path[global.CLI].files + 'temp/upload/';
    let fields = [];
    //inizializzo variabili di ritorno
    let extention = '',
      extImg = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
      nomefile = '',
      dimensione = req.headers['content-length'];
    let id = utility.makeid(32);

    let saveData = {
      //listen completamenti azioni
      aInternal: 0,
      aListener: function () { },
      set a(val) {
        this.aInternal = val;
        this.aListener(val);
      },
      get a() {
        return this.aInternal;
      },
      registerListener: function (listener) {
        this.aListener = listener;
      },
    };
    saveData.registerListener(function (val) {
      if (val === 2) {
        returnInfo();
      }
    });

    const createThumb = async function () {
      try {
        let options = { width: 100, height: 100, responseType: 'base64' };
        if (extImg.includes(extention.toLowerCase())) {
          await imageThumbnail(path.join(uploadPath, id) + extention, options)
            .then((thumbnail) => {
              fs.writeFile(path.join(uploadPath, 'thumb_' + id) + extention, thumbnail, 'base64', function () { });
            })
            .catch((err) => console.error(err));
        }
      } catch (err) {
        //scrivo log errore
      }
    };
    const returnInfo = async function () {
      try {
        //verifico se devo generare immagine thumb
        if (fields['thumb'] === 'true') {
          await createThumb();
        }

        res.status(200).json({
          success: true,
          valori: {
            estensione: extention,
            titolo: fields['name'],
            rif: fields['rif'],
            thumb: fields['thumb'],
            id: id,
            file: nomefile,
            dimensione: dimensione,
            percorso: uploadPath,
          },
        });
      } catch (err) {
        res.status(200).json({
          success: false,
          valori: {},
          msg: err.message,
        });
      }
    };

    const saveImagePath = function () {
      req.pipe(req.busboy);
      req.busboy.on('file', (fieldname, file, filename) => {
        extention = path.extname(filename['filename']).toLowerCase();
        nomefile = filename['filename'];
        // Create a write stream of the new file
        const fstream = fs.createWriteStream(path.join(uploadPath, id) + extention);
        // Pipe it trough
        file.pipe(fstream);

        // On finish of the upload
        fstream.on('close', () => {
          extention = path.extname(filename['filename']).toLowerCase();
          saveData.a = saveData.a + 1;
        });
      });

      req.busboy.on('field', function (fieldname, val) {
        fields[fieldname] = val;
      });

      req.busboy.on('finish', function () {
        saveData.a = saveData.a + 1;
      });
    };

    //verifico se esiste la cartella personale dell'utente
    fs.access(uploadPath, function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.mkdirSync(uploadPath); //Creo dir se non esiste
        } else {
          res.status(200).json({
            success: false,
            valori: {},
            msg: err.code,
          });
          return;
        }
      }
      saveImagePath();
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      valori: {},
      msg: err.message,
    });
  }
};
