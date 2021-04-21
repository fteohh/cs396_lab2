"use strict";

const resetDB = require("../config/scripts/populateDB")

const Companion = require("./schema/Companion");
const Doctor = require("./schema/Doctor");

const FavoriteDoctor = require("./schema/FavoriteDoctor");
const FavoriteCompanion = require("./schema/FavoriteCompanion");

const express = require("express");
const router = express.Router();


// completely resets your database.
// really bad idea irl, but useful for testing
router.route("/reset")
    .get((_req, res) => {
        resetDB(() => {
            res.status(200).send({
                message: "Data has been reset."
            });
        });
    });

router.route("/")
    .get((_req, res) => {
        console.log("GET /");
        res.status(200).send({
            data: "App is running."
        });
    });
    
// ---------------------------------------------------
// Edit below this line
// ---------------------------------------------------

// ---------------------------------------------------
// Helper functions
// ---------------------------------------------------

//returns an array of a doctor's companions
// function doctorsCompanions(jsonobject, id) {
//     let companions = [];
//     jsonobject.forEach(function (element) {
//         if(element["doctors"].includes(id) == true){
//             companions.push(element);
//         }
//     })
//     return companions;
// }

//returns an array of companions who have traveled with multiiple doctors
function crossingover(jsonobject){
    let crosses = [];
    jsonobject.forEach(function (element) {
        if(element["doctors"].length >1){
            crosses.push(element);
        }
    })
    //console.log(crosses);
    return crosses;
}


router.route("/doctors")
    .get((req, res) => {
        console.log("GET /doctors");

        // already implemented:
        Doctor.find({})
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    })
    .post((req, res) => {
        console.log("POST /doctors");
        if (!req.body.name || !req.body.seasons){
            res.status(500).send({message: "name and seasons are required"});
            return; 
        }
        Doctor.create(req.body).save()
            .then(data => {
                res.status(201).send(data);
            }) 
            .catch(err => {
                res.status(404).send();
            });
    });

// optional:
router.route("/doctors/favorites")
    .get((req, res) => {
        console.log(`GET /doctors/favorites`);
        FavoriteDoctor.find({})
            .then(data => {
                FavoriteDoctor.getDoctors(data)
                .then(data=>{
                    res.status(200).send(data);
                })
            })
            .catch(err => {
                res.status(500).send(err);
            });
       
    })
    .post((req, res) => {
        console.log(`POST /doctors/favorites`);
        //console.log(req.body.doctor);
        if (!req.body.doctor_id){
            res.status(500).send({message: "doctor id is required"});
            return; 
        }
        FavoriteDoctor.getFavorite(req.body.doctor_id)
            .then(data => {
                if (!data){
                    FavoriteDoctor.create(req.body.doctor_id).save()
                        .then(data => {
                            //console.log(data);
                            FavoriteDoctor.getDoctor(data)
                                .then(data => {
                                    res.status(201).send(data);
                                })
                            //res.status(201).send(data);
                        })
                        .catch(err => {
                            res.status(500).send(err);
                        })
                }
                else{
                    res.status(500).send(err);
                }
            })
            .catch(err => {
                res.status(500).send(err);
            })

    });
    
router.route("/doctors/:id")
    .get((req, res) => {
        console.log(`GET /doctors/${req.params.id}`);
        //console.log(req.params.id);
        Doctor.findById({"_id": req.params.id})
            .then(data => {
                if(data){
                    res.status(200).send(data);
                } 
                else{
                    res.status(404).send({message: "Doctor with id \"" + req.params.id+ "\" does not exist.",  err: err});
                }
            })
            .catch(err => {
                res.status(404).send({message: "Doctor with id \"" + req.params.id+ "\" does not exist.",  err: err});
            })
    })
    .patch((req, res) => {
        console.log(`PATCH /doctors/${req.params.id}`);
        Doctor.findOneAndUpdate({_id: req.params.id}, req.body, {new: true})
            .then(data => {
                res.status(200).send(data); 
            })
            .catch(err => {
                res.status(404).send({message: "Doctor with id \"" + req.params.id+ "\" does not exist.",  err: err});
            });
    })
    .delete((req, res) => {
        console.log(`DELETE /doctors/${req.params.id}`);
        Doctor.findOneAndDelete({"_id": req.params.id})
            .then(data => {
                if(data){
                    res.status(200).send(null);
                }
                else{
                    res.status(404).send({message: "Doctor with id \"" + req.params.id+ "\" does not exist.",  err: err});
                }
            })
            .catch(err => {
                res.status(404).send({message: "Doctor with id \"" + req.params.id+ "\" does not exist.",  err: err});
            });
    });
    
router.route("/doctors/:id/companions")
    .get((req, res) => {
        console.log(`GET /doctors/${req.params.id}/companions`);
        //console.log("_id:", req.params.id); 
        Doctor.findById({"_id": req.params.id})
            .then(data => {
                Companion.find({ doctors: { $eq: req.params.id } })
                    .then(data => {
                    //let companions = doctorsCompanions(data, req.params.id);
                    //res.status(200).send(doctorsCompanions(data, req.params.id));
                        res.status(200).send(data)
                    })
            })
            .catch(err => {
                res.status(404).send({message: "Doctor with id \"" + req.params.id+ "\" does not exist.",  err: err});
            })
    });
    

router.route("/doctors/:id/goodparent")
    .get((req, res) => {
        console.log(`GET /doctors/${req.params.id}/goodparent`);
        Doctor.findById({"_id": req.params.id})
            .then(doctor => {
                //console.log("we've got a doctor");
                Companion.find({ doctors: { $eq: req.params.id } })
                    .then(data => {
                        let good = true;
                        let companions = data
                        //console.log(companions);
                        companions.forEach(function (element) {
                            if(element["alive"] == false){
                                good= false;
                            }
                        })
                        //console.log(good);
                        res.status(200).send(good);
                })
            })
            .catch(err => {
                res.status(404).send({message: "Doctor with id \"" + req.params.id+ "\" does not exist.",  err: err});
            })
    });

// optional:
router.route("/doctors/favorites/:doctor_id")
    .get((req, res) => {
        console.log(`GET /doctors/favorites/${req.params.doctor_id}`);
        //console.log(req.params.doctor_id);
        FavoriteDoctor.findOne({"doctor": req.params.doctor_id})
            .then(data => {
                console.log(data);
                if(data){
                    FavoriteDoctor.getDoctor({"doctor": data.doctor})
                        .then(data => {
                            console.log(data);
                            res.status(200).send(data);
                        })
                    //res.status(200).send(data);
                } 
                else{
                    res.status(404).send({message: "Doctor with id \"" + req.params.doctor_id+ "\" does not exist in favorites.",  err: err});
                }
            })
            .catch(err => {
                res.status(404).send({message: "Doctor with id \"" + req.params.doctor_id+ "\" does not exist in favorites.",  err: err});
            })
    })
    .delete((req, res) => {
        console.log(`DELETE /doctors/favorites/${req.params.doctor_id}`);
        FavoriteDoctor.findOneAndDelete({doctor: req.params.doctor_id})
        .then(data => {
            if(data){
                res.status(200).send(null);
            }
            else{
                res.status(404).send({message: "Doctor with id \"" + req.params.doctor_id+ "\" does not exist.",  err: err});
            }
        })
        .catch(err => {
            res.status(404).send({message: "Doctor with id \"" + req.params.doctor_id+ "\" does not exist.",  err: err});
        });
    });

router.route("/companions")
    .get((req, res) => {
        console.log("GET /companions");
        // already implemented:
        Companion.find({})
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    })
    .post((req, res) => {
        console.log("POST /companions");
        if (!req.body.name || !req.body.character || (req.body.alive == undefined)){  
            res.status(500).send({message: "name, character, and alive are required"});
            return;
        }
        Companion.create(req.body).save()
            .then(data => {
                //console.log("saved");
                res.status(201).send(data);
            }) 
            .catch(err => {
                res.status(500).send(err);
        });
    });

router.route("/companions/crossover")
    .get((req, res) => {
        console.log(`GET /companions/crossover`);
        Companion.find({})
            .then(data => {
                res.status(200).send(crossingover(data));
            })
            .catch(err => {
                res.status(500).send(err);
            });
    });

// optional:
router.route("/companions/favorites")
    .get((req, res) => {
        console.log(`GET /companions/favorites`);
        FavoriteCompanion.find({})
            .then(data => {
                FavoriteCompanion.getCompanions(data)
                    .then(data=>{
                        res.status(200).send(data);
                    })
            })
            .catch(err => {
                res.status(500).send(err);
            });
    })
    .post((req, res) => {
        console.log(`POST /companions/favorites`);
        console.log(`POST /doctors/favorites`);
        if (!req.body.companion_id){
            res.status(500).send({message: "companion id is required"});
            return; 
        }
        FavoriteCompanion.getFavorite(req.body.companion_id)
            .then(data => {
                if (!data){
                    FavoriteCompanion.create(req.body.companion_id).save()
                        .then(data => {
                            //console.log(data);
                            FavoriteCompanion.getCompanion(data)
                                .then(data => {
                                    res.status(201).send(data);
                                })
                            //res.status(201).send(data);
                        })
                        .catch(err => {
                            res.status(500).send(err);
                        })
                }
                else{
                    res.status(500).send(err);
                }
            })
            .catch(err => {
                res.status(500).send(err);
            })
    })

router.route("/companions/:id") 
    .get((req, res) => {
        console.log(`GET /companions/${req.params.id}`);
        Companion.findById({"_id": req.params.id})
            .then(data => {
                    if (data){
                        res.status(200).send(data);
                    }
                    else{
                        res.status(404).send({message: "Companion with id \"" + req.params.id+ "\" does not exist.",  err: err});
                    }
            })
            .catch(err => {
                //console.log("error");
                res.status(404).send({message: "Companion with id \"" + req.params.id+ "\" does not exist.",  err: err});
            })
    })
    .patch((req, res) => {
        console.log(`PATCH /companions/${req.params.id}`);
        Companion.findOneAndUpdate({_id: req.params.id}, req.body, {new: true})
        .then(data => {
            res.status(200).send(data); 
        })
        .catch(err => {
            res.status(404).send({message: "Companion with id \"" + req.params.id+ "\" does not exist.",  err: err});
        });
    })
    .delete((req, res) => {
        console.log(`DELETE /companions/${req.params.id}`);
        Companion.findOneAndDelete({"_id": req.params.id})
            .then(data => {
                if(data){
                    res.status(200).send(null);
                }
                else{
                    res.status(404).send({message: "Companion with id \"" + req.params.id+ "\" does not exist.",  err: err});
                }
            })
            .catch(err => {
                res.status(404).send({message: "Companion with id \"" + req.params.id+ "\" does not exist.",  err: err});
            });
    });

router.route("/companions/:id/doctors")
    .get((req, res) => {
        console.log(`GET /companions/${req.params.id}/doctors`);
        Companion.findById({"_id": req.params.id})
            .then(data => {
                //console.log("here we go");
                let doctors = [];
                let companion = data;
                let doctorIds = companion.doctors;
                //console.log(doctorIds);
                Doctor.find({})
                    .then(data => {
                        const docs = item => {
                            //console.log(doctorIds, item._id);
                            if (doctorIds.includes(item._id)== true){
                                 doctors.push(item);
                            }
                        }
                        //console.log(data);
                        data.forEach(docs);
                        return doctors;
                    })
                    .then(data => {
                        res.status(200).send(data);
                    })
            })
            .catch(err => {
                res.status(404).send({message: "Companion with id \"" + req.params.id+ "\" does not exist.",  err: err});
            });
    });

router.route("/companions/:id/friends")
    .get((req, res) => {
        console.log(`GET /companions/${req.params.id}/friends`);
        Companion.findById({"_id": req.params.id})
            .then(data => {
                //console.log("here we go");
                let friends = [];
                let companion = data
                let companionSeasons = companion.seasons;
                //console.log(doctorIds);
                Companion.find({})
                    .then(data => {
                        const compan = item => {
                            for (let i = 0; i < companionSeasons.length; i++){
                                if ((item["seasons"].indexOf(companionSeasons[i]) > -1) && (friends.includes(item) ==false) && (item["_id"] != req.params.id)){
                                    friends.push(item);
                                }
                            }
                        }
                        //console.log(data);
                        data.forEach(compan);
                        return friends;
                    })
                    .then(data => {
                        res.status(200).send(data);
                    })
            })
            .catch(err => {
                res.status(404).send({message: "Companion with id \"" + req.params.id+ "\" does not exist.",  err: err});
            });
    });

// optional:
router.route("/companions/favorites/:companion_id")
    .get((req, res) => {
        console.log(`GET /doctors/favorites/${req.params.companion_id}`);
        //console.log(req.params.doctor_id);
        FavoriteCompanion.findOne({"companion": req.params.companion_id})
            .then(data => {
                //console.log(data);
                if(data){
                    FavoriteCompanion.getCompanion({"companion": data.companion})
                        .then(data => {
                            //console.log(data);
                            res.status(200).send(data);
                        })
                    //res.status(200).send(data);
                } 
                else{
                    res.status(404).send({message: "Companion with id \"" + req.params.doctor_id+ "\" does not exist in favorites.",  err: err});
                }
            })
            .catch(err => {
                res.status(404).send({message: "Companion with id \"" + req.params.doctor_id+ "\" does not exist in favorites.",  err: err});
            })
    })
    .delete((req, res) => {
        console.log(`DELETE /companions/favorites/${req.params.companion_id}`);
        FavoriteCompanion.findOneAndDelete({companion: req.params.companion_id})
        .then(data => {
            if(data){
                res.status(200).send(null);
            }
            else{
                res.status(404).send({message: "Companion with id \"" + req.params.companion_id+ "\" does not exist.",  err: err});
            }
        })
        .catch(err => {
            res.status(404).send({message: "Companion with id \"" + req.params.companion_id+ "\" does not exist.",  err: err});
        });
    });

module.exports = router;