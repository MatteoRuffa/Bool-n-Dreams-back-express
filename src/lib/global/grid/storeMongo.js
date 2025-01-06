/* eslint-disable quotes */
'use strict';

/*
 * obj:
 * fields = [name column,type]
 *   name column = nome della colonna
 *   type = tipo campo (string,number,boolean,date,datetime...
 *   filter = se cercare su colonne
 *   search = se cercare su ricerca pattern
 */

function GenerateSql(_req) {
  let me = this;
  this.req = _req;
  this.pipeline = [];
  this.pipelineCount = [];

  // this.addFields = { //TODO non utilizzato
  //   $addFields: {}
  // };

  this.pipelineTotal = null;
  this.totalCount = 0;

  this.mdb = global.MDB.client.db(this.req.locals.obj.db);
  this.db = this.mdb.collection(this.req.locals.obj.collection);

  this.req.locals.obj.pattern = this.req.query.pattern || '';
  this.req.locals.obj.filter = this.req.query.filter || null;

  this.start = async function () {
    //genero stringa ordinamento
    makeSort.call(me);

    if (this.req.locals.obj.select.length > 0) {
      makeSelect.call(me);
    }
    if (this.req.locals.obj.selectOther && this.req.locals.obj.selectOther.length > 0) {
      makeSelectOther.call(me);
    }
    this.req.locals.pattern = this.req.query.pattern || '';
    if (this.req.locals.pattern && this.req.locals.pattern !== '') {
      makeSearch.call(me);
    }

    //gestione filtri colonne
    if (this.req.locals.obj.filter !== null) {
      makeFilter.call(me);
    }

    //genero stringa range
    if (this.req.locals.obj.buffer === true) {
      makeRange.call(me);
    }

    makeProject.call(me);
  };

  this.executeSql = async function () {
    // let o = this.addFields.$addFields; //TODO non utilizzato
    // if (Object.keys(o).length > 0 && o.constructor === Object) {
    //   this.pipeline.push(this.addFields);
    // }
    try {
      let start = this.db.aggregate(this.pipeline);
      let data = await start.toArray();

      if (this.req.locals.obj.buffer === true) {
        await getTotalCount.call(me);
      } else {
        this.totalCount = data['length'];
      }
      return [this.totalCount, data];
    } catch (err) {
      this.req.logger.error(this.req, err);
    }
  };
}

async function getTotalCount() {
  try {
    this.pipelineCount.push({
      $group: {
        _id: null,
        totalCount: {
          $sum: 1,
        },
      },
    });
    let start = this.db.aggregate(this.pipelineCount);
    let data = await start.toArray();
    if (data.length !== 0) this.totalCount = data[0].totalCount;
    else this.totalCount = 0;
  } catch (err) {
    this.req.logger.error(this.req, err);
  }
}

function makeRange() {
  let start = parseInt(this.req.query.start) || 0;
  let limit = parseInt(this.req.query.limit) || null;

  this.pipeline.push({ $skip: start });
  if (limit) {
    this.pipeline.push({ $limit: limit });
  }
}

function makeSort() {
  try {
    let $sort = {};
    let obj;
    let dir;
    let field;
    let ordine = 1;
    //multi sort array (vedi dettLog form job NSM
    if (typeof this.req.locals.obj.dir === 'object') {
      for (let x = 0; x < this.req.locals.obj.dir.length; x++) {
        if (this.req.locals.obj.dir[x] && (this.req.locals.obj.dir[x] === -1 || this.req.locals.obj.dir[x] === 'DESC')) {
          ordine = -1;
        }
        //dir = this.req.locals.obj.dir[x];
        dir = ordine;
        field = this.req.locals.obj.sort[x];
        $sort[field] = dir;
      }
      obj = { $sort };
      this.pipeline.push(obj);
      return;
    } else {
      if (this.req.locals.obj.dir && (this.req.locals.obj.dir === -1 || this.req.locals.obj.dir === 'DESC')) {
        ordine = -1;
      }
    }
    field = this.req.locals.obj.sort;
    obj = {
      $sort: {
        //[field]: this.req.locals.obj.dir,
        [field]: ordine,
      },
    };
    if (this.req.locals.obj.sort) {
      this.pipeline.push(obj);
    }
  } catch (err) {
    this.req.logger.error(this.req, err);
  }
}

function makeProject() {
  try {
    let project = {},
      tz;
    project.$project = {};

    for (const [key, value] of Object.entries(this.req.locals.obj.fields)) {
      switch (value[0]) {
        case 'string':
        case 'number':
        case 'array':
          project.$project[key] = `$${key}`;
          break;
        case 'datetime':
          tz = this.req.get('tz');
          project.$project[key] = {
            $dateToString: {
              format: '%Y-%m-%d %H:%M:%S',
              date: `$${key}`,
              timezone: tz,
            },
          };
          break;
      }
    }
    this.pipeline.push(project);
  } catch (err) {
    this.req.logger.error(this.req, err);
  }
}

function makeFilter() {
  try {
    let f = JSON.parse(this.req.locals.obj.filter),
      a,
      match = {};
    let key, d, d1;
    match.$and = [];
    f.forEach(function (j) {
      if (j['value'].trim() !== '') {
        a = {};
        switch (j['type']) {
          case 'string':
            a[j['property']] = {
              //$regex: new RegExp(j['value'], 'g'),
              $regex: new RegExp(j['value'].toLowerCase(), 'i'),
            };
            match.$and.push(a);
            break;
          case 'number':
            a = {
              [j['property']]: {
                ['$' + j['operator']]: j['value'],
              },
            };
            match.$and.push(a);
            break;
          case 'date':
            key = j['property'];
            d = new Date(j['value']);
            d1 = new Date(j['value']);
            switch (j['operator']) {
              case 'lt':
                a = {
                  [key]: {
                    $lt: new Date(d.toISOString()),
                  },
                };
                match.$and.push(a);
                break;
              case 'gt':
                a = {
                  [key]: {
                    $gte: new Date(d.toISOString()),
                  },
                };
                match.$and.push(a);
                break;
              case 'eq':
                d1.setDate(d1.getDate() + 1);
                a = {
                  [key]: {
                    $gte: new Date(d.toISOString()),
                    $lt: new Date(d1.toISOString()),
                  },
                };
                match.$and.push(a);
                break;
            }
            break;
          default:
            break;
        }
      }
    });

    if (match.$and.length > 0) {
      this.pipeline.push({ $match: match });
      this.pipelineCount.push({ $match: match });
    }
  } catch (err) {
    this.req.logger.error(this.req, err);
  }
}

/*
 * tipo filtro :
 *  "Fabrizio Ponzio" = cerco frase esatta
 *  #fabrizio = cerca parola esatta
 *  fab = cerca testo che inizia con
 *  @fab = cerca testo all'interno delle parole
 */
function makeSearch() {
  try {
    let me = this;
    let filter = this.req.locals.pattern.match(/(?:[^\s"]+|"[^"]*")+/g);
    let matchAnd = [];

    filter.forEach(function (word) {
      let w = word.trim();
      let or = [];
      me.req.locals.obj.search.forEach(function (f) {
        if (w.charAt(0) === '#') {
          or.push({
            [f]: { $regex: new RegExp(`^${w.substring(1)}$`, 'i') },
          });
        } else if (w.charAt(0) === '@') {
          or.push({
            [f]: { $regex: new RegExp(`${w.substring(1)}`, 'i') },
          });
        } else if (w.charAt(0) === '"') {
          let c = w.substring(1);
          c = c.slice(-1) === '"' ? c.slice(0, -1) : c;
          or.push({
            [f]: { $regex: new RegExp(`^${c}$`, 'i') },
          });
        } else {
          or.push({
            [f]: { $regex: new RegExp(`^${w}`, 'i') },
          });
        }
      });

      matchAnd.push({ $or: or });
      matchAnd = {
        $match: {
          $and: matchAnd,
        },
      };
    });
    this.pipeline.push(matchAnd);
    this.pipelineCount.push(matchAnd);
  } catch (err) {
    this.req.logger.error(this.req, err);
  }
}

function makeSelect() {
  try {
    let matchAnd = [], //array oggetti
      campoRicerca, //temporanea che tiene il valore del campo su cui devo effettuare il filtro
      operatore, //temporanea che tiene l'operatore da utilizzare nel filtro convertito per mongodb query
      valore; //temporanea che valore del controllo

    /*
     * riga -> array di length 4:
     * es. Cognome (string) =       "Ponzio"
     *     riga[0] riga[1]  riga[2] riga[3]
     * riga[0] -> campoRicerca: campo su cui effettuare il filtro
     * riga[1] -> tipo di valore del campo (es. string o number etc)
     * riga[2] -> operatore di controllo (es. = o >)
     * riga[3] -> valore del controllo
     */

    /* non so se potrebbe servire nel futuro
            case "string":
          campoRicerca = riga[0];
          matchAnd.push({
            [campoRicerca]: { $regex: new RegExp(`^${riga[3]}$`, "i") }
          });
          break;
     */

    this.req.locals.obj.select.forEach(function (riga) {
      campoRicerca = riga[0];
      valore = riga[3];

      if (riga[1] !== 'boolean') {
        switch (riga[2]) {
          case '=':
            operatore = '$eq';
            break;
          case '>':
            operatore = '$gt';
            break;
          case '>=':
            operatore = '$gte';
            break;
          case '<':
            operatore = '$lt';
            break;
          case '<=':
            operatore = '$lte';
            break;
          case '!=':
            operatore = '$ne';
            break;
          default:
            break;
        }
      } else {
        if (riga[2] !== '=') operatore = '$ne';
        else operatore = '$eq';
      }

      switch (riga[1]) {
        case 'string':
        case 'number':
        case 'boolean':
          matchAnd.push({
            [campoRicerca]: {
              [operatore]: valore,
            },
          });
          break;
        case 'date':
          let d = new Date(valore);
          if (operatore === '$eq' || operatore === '$ne') {
            //* esempio data 10/01/2023 operatore = $eq
            //* esempio data 10/01/2023 operatore = $ne
            // d = new Date(valore); //10/01/2023
            let d1 = new Date(valore); //10/01/2023

            if (operatore === '$ne') d.setDate(d.getDate() + 1); //caso ne: d -> 11/01/2023
            else d1.setDate(d1.getDate() + 1); //caso eq: d1 -> 11/01/2023

            matchAnd.push({
              [campoRicerca]: {
                $gte: new Date(d.toISOString()), //data>=d | caso eq: data>=10/01/2023 | caso ne: data>=11/01/2023
                $lt: new Date(d1.toISOString()), //data<d1 | caso eq: data<11/01/2023 | caso ne: data<10/01/2023
              },
            });
          } else {
            if (operatore === '$gt' || operatore === '$lte') d.setDate(d.getDate() + 1);

            matchAnd.push({
              [campoRicerca]: {
                [operatore]: new Date(d.toISOString()),
              },
            });
          }
          break;
        case 'datetime':
          //* Considero solo l'ora del datetime
          let dt = new Date(valore);
          dt.setMinutes(0);
          dt.setSeconds(0);
          dt.setMilliseconds(0);

          if (operatore === '$eq' || operatore === '$ne') {
            let dt1 = new Date(dt);

            if (operatore === '$ne') dt.setDate(dt.getTime() + 3600000);
            else dt1.setDate(dt1.getTime() + 3600000);

            matchAnd.push({
              [campoRicerca]: {
                $gte: new Date(dt.toISOString()),
                $lt: new Date(dt1.toISOString()),
              },
            });
          } else {
            if (operatore === '$gt' || operatore === '$lte') dt.setDate(dt.getTime() + 3600000);

            matchAnd.push({
              [campoRicerca]: {
                [operatore]: new Date(dt.toISOString()),
              },
            });
          }
          break;
      }
    });

    matchAnd = {
      $match: {
        $and: matchAnd,
      },
    };

    this.pipeline.push(matchAnd);
    this.pipelineCount.push(matchAnd);
  } catch (err) {
    this.req.logger.error(this.req, err);
  }
}

function makeSelectOther() {
  try {
    if (!this.pipeline.$match) {
      this.pipeline.push({ $match: {} });
      this.pipelineCount.push({ $match: {} });
    }

    for (let i = 0; i < this.req.locals.obj.selectOther.length; i++) {
      for (const [key, value] of Object.entries(this.req.locals.obj.selectOther[i])) {
        if (this.pipeline[1].$match[key] && this.pipeline[1].$match[key].length > 0) {
          this.pipeline[1].$match[key].push(value);
          this.pipelineCount[0].$match[key].push(value);
        } else {
          this.pipeline[1].$match[key] = value;
          this.pipelineCount[0].$match[key] = value;
        }
      }
    }
  } catch (err) {
    this.req.logger.error(this.req, err);
  }
}

module.exports = {
  GenerateSql,
};
