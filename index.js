require('dotenv').config()
import express from "express";
import startup from "./lib/startup";
import api from "./api/index";
import middleware from "./middleware/index";
import logger from "./lib/logger";
const mongodb = require("mongodb")
const MC = mongodb.MongoClient;
const Promise = require("bluebird")
const mongouri = process.env.MONGOURI;
//console.log('mongouri: ' + mongouri)
const db = {
  client: {

  }
};
let app;

startup()
  .then(async () => {
    app = express();
    app.Promise = Promise;
    try {
      db.client = await MC.connect(mongouri, {useUnifiedTopology: true});
      app.mydb = db.client.db("college_db")
      app.colls = {
        chords: app.mydb.collection("chords"),
        schools: app.mydb.collection("schools")
      }
    }
    catch(err){
      console.error(err)
    }

    return;
  })
  .then(async () => {

    const port = process.env.PORT || 5001;

    middleware(app);
    api(app);

    app.listen(port, () => {
      if (process.send) {
        process.send(`Server running at http://localhost:${port}\n\n`);
      }
    });

    process.on("message", (message) => {
      console.log(message);
    });
  })
  .catch((error) => {
    logger.error(error);
  });
