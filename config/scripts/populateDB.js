"use strict";

const Companion = require("../../src/schema/Companion");
const Doctor = require("../../src/schema/Doctor");

const data = require("../data.json");

require("dotenv").config();
const env = "" + process.env.NODE_ENV;

const configObj = require("../config");
// console.log(configObj);
// console.log(env);
// console.log("development");
const config = configObj[env || "development"];
// console.log(config);
const mongoose = require("mongoose");

const populate = (callback) => {
    console.log("Trying to connect to database...");
    mongoose.connect(config.database, config.mongoConfig, err => {
        if (err) {
            console.log("Could not connect to database.");
        } else {
            console.log(`Connected to ${process.env.DB_NAME}.`);
        }
        console.log("Clearing database...");
        const schemas = [ Companion, Doctor ];
        Promise
            .all(
                // first delete any data that currently exists:
                schemas.map(schema => schema.deleteMany())
            )
            .then(() => {
                console.log("Database cleared.");
                console.log("Populating database...");
                // then create all of the doctors:
                return Promise.all(
                    // Each of these database commits is 
                    // issued asynchronously. The Promise.all
                    // waits 'til all have completed before moving on...
                    data.doctors.map(obj => {
                        obj.doc_id = obj._id; // important to map the relationships between doc and companion
                        return Doctor.create(obj)
                            .save()
                    })
                );
            })
            .then(doctors => {
                // create a lookup table of previous doc ids -> auto-generated ids:
                const docIdLookup = {};
                doctors.forEach(doc => {
                    docIdLookup[doc.doc_id] = doc;
                });
                return docIdLookup;
            })
            .then((docIdLookup) => {
                return Promise.all(
                    // then create all of the companions:
                    data.companions.map(obj => {
                        const docIds = obj.doctors.map(id => {
                            return '' + docIdLookup[id]._id
                            // return docIdLookup[id];
                        });
                        const old_doctor_ids = obj.doctors.map(id => {
                            // return '' + docIdLookup[id]._id
                            return docIdLookup[id].doc_id;
                        })
                        obj.doctors = docIds;
                        obj.old_doctor_ids = old_doctor_ids;
                        // console.log(obj)
                        return Companion.create(obj).save();
                    })
                );
            })
            .catch(err => {
                console.log(err);
                process.exit(1);
            })
            .finally(() => {
                console.log("Database populated successfully.");
                if (callback) {
                    callback();
                } else {
                    console.log('Exiting');
                    process.exit(0);
                }
            });
    });
};

module.exports = populate;
