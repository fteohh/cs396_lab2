/**
 * This test file tests the following endpoints:
 *    /doctors                  GET, POST
 *    /doctors/:id              GET, PATCH, DELETE
 *    /doctors/:id/companions   GET
 *    /doctors/:id/goodparent   GET
 *    /companions               GET, POST
 *    /companions/:id           GET, PATCH, DELETE
 *    /companions/:id/doctors   GET
 *    /companions/:id/friends   GET
 *    /companions/crossover     GET
 */

const data = require("../config/data.json");
const utils = require("./util/testUtil");
const Doctor = require("../src/schema/Doctor");
const Companion = require("../src/schema/Companion");
const {
    simplify, resetDB, fixtures, initFixtures, areArraysEqual, 
    areSameCompanionsInBothArrays, areSameDoctorsInBothArrays,
    expect404
} = utils;

const asserttype = require("chai-asserttype");
const axios = require("axios");
const chai = require("chai");

chai.use(asserttype);
const expect = chai.expect;


describe("/doctors", () => {

    describe("GET", () => {

        beforeEach(done => {
            resetDB(done);
        });

        it("should return a list of all Doctors", done => {
            axios.get(utils.route("/doctors"))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data.length).to.eql(13);
                    expect(areSameDoctorsInBothArrays(response.data, data.doctors)).to.be.true;
                    done();
                })
                .catch(err => done(err));
        });

    });

    describe("POST", () => {

        it("should create a new Doctor object", done => {

            // 1. create new doctor:
            axios.post(utils.route("/doctors"), utils.mockDoctor)
                .then(response => {
                    expect(response.status).to.equal(201);
                    const _id = response.data._id;

                    // check that the correct data are returned:
                    expect(simplify(response.data)).to.eql(simplify(utils.mockDoctor));
                    
                    // now delete the doctor you just created from MongoDB:
                    Doctor
                        .findOneAndDelete({ _id: _id })
                        .then(newDoc => {
                            expect(simplify(newDoc)).to.eql(simplify(utils.mockDoctor));
                            done();
                        })
                        .catch(err => done(err));
                    
                })
                .catch(err => done(err));
        });

        it("should create throw an error if missing data", done => {
            axios.post(utils.route("/doctors"), {name: 'Blah'})
                .then(response => {
                    expect(response.status).to.equal(500);
                    done();
                })
                .catch(err => {
                    if (err.response && err.response.status == 500) {
                        done();
                    } else {
                        throw err;
                    }
                })
                .catch(err => done(err));
        });
    });
});

describe("/doctors/:id", () => {

    beforeEach(done => {
        initFixtures(done);
    });

    afterEach(done => {
        // restore original doctor data:
        const _id = fixtures.doctor._id;
        Doctor.findOneAndUpdate({ _id: _id }, 
            { name: fixtures.doctor.name },
            { new: true }
        )
        .then(newDoc => {
            done();
        })
        .catch(err => done(err));
    });

    describe("GET", () => {

        it("should find the Doctor object with the specified id", done => {
            const _id = fixtures.doctor._id;
            axios.get(utils.route(`/doctors/${_id}`))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(simplify(response.data)).to.eql(simplify(fixtures.doctor));
                    done();
                })
                .catch(err => done(err));   
        });
        
        it("should return a 404 error for a non-existent id", done => {
            expect404('/doctors/nonsense', done);
        });
    });

    describe("PATCH", () => {
            
        it("should update only the specified fields of the given doctor", done => {
            
            const _id = "" + fixtures.doctor._id;

            // patch it:
            axios.patch(utils.route(`/doctors/${_id}`), { name: "new_name" })
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data._id).to.equal(_id);
                    expect(response.data.name).to.equal("new_name");
                    expect(areArraysEqual(response.data.seasons, fixtures.doctor.seasons)).to.be.true;

                    // verify that change was made to database:
                    Doctor.findById(_id)
                        .then(updatedDoc => {
                            expect(updatedDoc.name).to.equal("new_name");
                            done();
                        })
                        .catch(err => done(err))
                })
                .catch(err => done(err));
        });

        it("should update the given doctor with the specified information", done => {
            const _id = "" + fixtures.doctor._id;

            // patch it:
            axios.patch(utils.route(`/doctors/${_id}`), utils.mockDoctor)
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data._id).to.equal(_id);
                    expect(response.data.name).to.equal(utils.mockDoctor.name);
                    expect(areArraysEqual(response.data.seasons, utils.mockDoctor.seasons)).to.be.true;

                    // verify that change was made to database:
                    Doctor.findById(_id)
                        .then(updatedDoc => {
                            expect(updatedDoc.name).to.equal(utils.mockDoctor.name);
                            expect(areArraysEqual(updatedDoc.seasons, utils.mockDoctor.seasons)).to.be.true
                            done();
                        })
                        .catch(err => done(err))
                })
                .catch(err => done(err));
        });
    });

    describe("DELETE", () => {
        it("should delete the specified doctor from the database", done => {
            
            // 1. create a brand new doctor:
            Doctor.create(utils.mockDoctor).save()
                .then(data => {
                    _id = data._id;
                    const deleteURL = `/doctors/${_id}`;

                    // 2. then delete it:
                    axios.delete(utils.route(deleteURL))
                        .then(response => {
                            expect(response.data).to.equal('');
                            expect(response.status).to.equal(200);

                            // 3. then make sure that the doctor is no longer in the database:
                            Doctor.findById(_id)
                                .then(data => {
                                    expect(data).to.equal(null);
                                    done();
                                })
                                .catch(err => done(err));
                            
                        })
                        .catch(err => done(err));
                })
                .catch(err => done(err));
        });
    });
});

describe("/doctors/:id/companions", () => {

    describe("GET", () => {

        it("should return a list of all doctors (D4: Tom Baker)", done => {
            const _id = "" + fixtures.doctor._id;
            const expected = [{"_id":"c3_3__4_1","name":"Elisabeth Sladen","character":"Sarah Jane Smith","doctors":["d3","d4"],"seasons":[11,12,13,14],"alive":true},{"_id":"c4_2","name":"Ian Merter","character":"Harry Sullivan","doctors":["d4"],"seasons":[12,13],"alive":true},{"_id":"c4_3","name":"Louise Jameson","character":"Leela","doctors":["d4"],"seasons":[14,15],"alive":true},{"_id":"c4_4","name":"John Leeson","character":"K-9","doctors":["d4"],"seasons":[15,16,17,18],"alive":false},{"_id":"c4_5__5_1","name":"Matthew Waterhouse","character":"Adric","doctors":["d4","d5"],"seasons":[18,19],"alive":false},{"_id":"c4_6__5_2","name":"Sarah Sutton","character":"Nyssa","doctors":["d4","d5"],"seasons":[18,19,20],"alive":true},{"_id":"c4_7__5_3","name":"Janet Fielding","character":"Tegan Jovanka","doctors":["d4","d5"],"seasons":[18,19,20,21],"alive":true}];

            axios.get(utils.route(`/doctors/${_id}/companions`))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data.length).to.equal(expected.length);
                    expect(areSameCompanionsInBothArrays(response.data, expected)).to.be.true;
                    done();
                })
                .catch(err => done(err));
        });
        
        it("should return a list of all doctors (D11: Matt Smith)", done => {
            const _id = "" + fixtures.doctorD11._id;
            const expected = [{"_id":"c11_1","name":"Karen Gillan","character":"Amy Pond","doctors":["d11"],"seasons":[31,32,33],"alive":false},{"_id":"c11_2","name":"Arthur Davill","character":"Rory Williams","doctors":["d11"],"seasons":[31,32,33],"alive":false},{"_id":"c11_3__12_1","name":"Alex Kingston","character":"River Song","doctors":["d11","d12"],"seasons":[32,35],"alive":true},{"_id":"c11_4__12_2","name":"Jenna Coleman","character":"Clara Oswald","doctors":["d11","d12"],"seasons":[33,34,35],"alive":false}];

            axios.get(utils.route(`/doctors/${_id}/companions`))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data.length).to.equal(expected.length);
                    expect(areSameCompanionsInBothArrays(response.data, expected)).to.be.true;
                    done();
                })
                .catch(err => done(err));
        });

        it("Invalid doctor throws 404", done => {
            expect404('/doctors/nonsense/companions', done);
        });
    });
});

describe("/doctors/:id/goodparent", () => {

    describe("GET", () => {

        it("Bad parent detected (D4: Tom Baker)", done => {
            _id = '' + fixtures.doctorD4._id;
            axios.get(utils.route(`/doctors/${_id}/goodparent`))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data).to.eql(false);
                    done();
                })
                .catch(err => done(err));
        });

        it("Bad parent detected (D11: Matt Smith)", done => {
            _id = '' + fixtures.doctorD11._id;
            axios.get(utils.route(`/doctors/${_id}/goodparent`))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data).to.eql(false);
                    done();
                })
                .catch(err => done(err));
        });

        it("Good parent detected (D9: Christopher Eccelson)", done => {
            _id = '' + fixtures.doctorD9._id;
            axios.get(utils.route(`/doctors/${_id}/goodparent`))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data).to.eql(true);
                    done();
                })
                .catch(err => done(err));
        });

        it("Invalid parent throws 404", done => {
            expect404('/doctors/nonsense/goodparent', done);
        });

    });
});


describe("/companions", () => {

    describe("GET", () => {

        beforeEach(done => {
            resetDB(done);
        });

        it("should return a list of all Companions", done => {
            axios.get(utils.route("/companions"))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data.length).to.eql(35);
                    expect(response.data.length).to.equal(data.companions.length);
                    expect(areSameCompanionsInBothArrays(response.data, data.companions)).to.be.true;
                    done();
                })
                .catch(err => done(err));
        });

    });

    describe("POST", () => {

        it("should create a new Companion object", done => {

            // 1. create new companion:
            axios.post(utils.route("/companions"), utils.mockCompanion)
                .then(response => {
                    expect(response.status).to.equal(201);
                    const _id = response.data._id;

                    // check that the correct data are returned:
                    expect(simplify(response.data)).to.eql(simplify(utils.mockCompanion));
                    
                    // now delete the companion you just created from MongoDB:
                    Companion
                        .findOneAndDelete({ _id: _id })
                        .then(newCompanion => {
                            expect(simplify(newCompanion)).to.eql(simplify(utils.mockCompanion));
                            done();
                        })
                        .catch(err => done(err));
                    
                })
                .catch(err => done(err));
        });

        it("should create throw an error if missing data", done => {
            axios.post(utils.route("/companions"), {name: 'Blah'})
                .then(response => {
                    expect(response.status).to.equal(500);
                    done();
                })
                .catch(err => {
                    if (err.response && err.response.status == 500) {
                        done();
                    } else {
                        throw err;
                    }
                })
                .catch(err => done(err));
        });
    });
});

describe("/companions/:id", () => {

    beforeEach(done => {
        initFixtures(done);
    });

    describe("GET", () => {

        it("should find the Companion object with the specified id", done => {
            const _id = fixtures.companion._id;
            axios.get(utils.route(`/companions/${_id}`))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(simplify(response.data)).to.eql(simplify(fixtures.companion));
                    done();
                })
                .catch(err => done(err));   
        });

        it("Should return a 404 error for a non-existent id", done => {
            expect404('/companions/nonsense', done);
        });

    });

    describe("PATCH", () => {

        afterEach(done => {
            // // restore original companion data:
            // const _id = fixtures.companion._id;
            // Companion.findOneAndUpdate({ _id: _id }, 
            //     { 
            //         name: fixtures.companion.name, 
            //         character: fixtures.companion.character,
            //         alive: fixtures.companion.alve 
            //     },
            //     { new: true }
            // )
            // .then(newCompanion => {
            //     done();
            // })
            // .catch(err => done(err));
            resetDB(done);
        });
            
        it("should update only the specified fields of the given companion", done => {
            
            const _id = "" + fixtures.companion._id;

            // patch it:
            axios.patch(utils.route(`/companions/${_id}`), { name: "new_name" })
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data._id).to.equal(_id);
                    expect(response.data.name).to.equal("new_name");
                    expect(response.data.character).to.equal(fixtures.companion.character);
                    expect(response.data.alive).to.equal(fixtures.companion.alive);
                    expect(areArraysEqual(response.data.seasons, fixtures.companion.seasons)).to.be.true;

                    // verify that change was made to database:
                    Companion.findById(_id)
                        .then(updatedCompanion => {
                            expect(updatedCompanion.name).to.equal("new_name");
                            done();
                        })
                        .catch(err => done(err))
                })
                .catch(err => done(err));
        });

        it("should update the given companion with the specified information", done => {
            const _id = "" + fixtures.companion._id;

            // patch it:
            axios.patch(utils.route(`/companions/${_id}`), utils.mockCompanion)
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.data._id).to.equal(_id);
                    expect(response.data.name).to.equal(utils.mockCompanion.name);
                    expect(response.data.character).to.equal(utils.mockCompanion.character);
                    expect(response.data.alive).to.equal(utils.mockCompanion.alive);
                    expect(areArraysEqual(response.data.seasons, utils.mockCompanion.seasons)).to.be.true;

                    // verify that change was made to database:
                    Companion.findById(_id)
                        .then(updatedCompanion => {
                            expect(updatedCompanion.name).to.equal(utils.mockCompanion.name);
                            expect(areArraysEqual(updatedCompanion.seasons, utils.mockCompanion.seasons)).to.be.true
                            done();
                        })
                        .catch(err => done(err))
                })
                .catch(err => done(err));
        });

        it("Should return a 404 error for a non-existent id", done => {
            expect404('/companions/nonsense', done);
        });
    });

    describe("DELETE", () => {
        it("should delete the specified companion from the database", done => {
            
            // 1. create a brand new companion:
            Companion.create(utils.mockCompanion).save()
                .then(data => {
                    _id = data._id;
                    const deleteURL = `/companions/${_id}`;

                    // 2. then delete it:
                    axios.delete(utils.route(deleteURL))
                        .then(response => {
                            expect(response.data).to.equal('');
                            expect(response.status).to.equal(200);

                            // 3. then make sure that the companion is no longer in the database:
                            Companion.findById(_id)
                                .then(data => {
                                    expect(data).to.equal(null);
                                    done();
                                })
                                .catch(err => done(err));
                            
                        })
                        .catch(err => done(err));
                })
                .catch(err => done(err));
        });

        it("Should return a 404 error for a non-existent id", done => {
            expect404('/companions/nonsense', done);
        });

    });
});

describe("/companions/:id/doctors", () => {

    beforeEach(done => {
        initFixtures(done);
    });

    describe("GET", () => {
        it("should return all of the doctors of a particular companion", done => {
            const _id = "" + fixtures.companion._id;
            const expected = [{"_id":"d3","name":"Jon Pertwee","seasons":[7,8,9,10,11]},{"_id":"d4","name":"Tom Baker","seasons":[12,13,14,15,16,17,18]}];
            axios.get(utils.route(`/companions/${_id}/doctors`))
                .then(response => {
                    expect(response.data.length).to.equal(expected.length);
                    expect(areSameDoctorsInBothArrays(response.data, expected)).to.be.true;
                    done();
                })
                .catch(err => done(err));
        });

        it("Should return a 404 error for a non-existent id", done => {
            expect404('/companions/nonsense/doctors', done);
        });
    });
});


describe("/companions/:id/friends", () => {

    beforeEach(done => {
        initFixtures(done);
    });

    describe("GET", () => {

        it("should return all of the friends of the main companion", done => {
            const _id = "" + fixtures.companion._id;
            const expected = [{"_id":"c4_2","name":"Ian Merter","character":"Harry Sullivan","doctors":["d4"],"seasons":[12,13],"alive":true},{"_id":"c4_3","name":"Louise Jameson","character":"Leela","doctors":["d4"],"seasons":[14,15],"alive":true}];        
            axios.get(utils.route(`/companions/${_id}/friends`))
                .then(response => {
                    expect(response.data.length).to.equal(expected.length);
                    expect(
                        areSameCompanionsInBothArrays(response.data, expected)
                    ).to.be.true;
                    done();
                })
                .catch(err => done(err));
        });

        it("should return all of the friends of companion 'Sarah Sutton'", done => {
            // and one more...
            const _id = "" + fixtures.companion4._id;
            const expected = [{"_id":"c4_4","name":"John Leeson","character":"K-9","doctors":["d4"],"seasons":[15,16,17,18],"alive":false},{"_id":"c4_5__5_1","name":"Matthew Waterhouse","character":"Adric","doctors":["d4","d5"],"seasons":[18,19],"alive":false},{"_id":"c4_7__5_3","name":"Janet Fielding","character":"Tegan Jovanka","doctors":["d4","d5"],"seasons":[18,19,20,21],"alive":true},{"_id":"c5_4","name":"Mark Strickson","character":"Vislor Turlough","doctors":["d5"],"seasons":[20,21],"alive":true}];
            axios.get(utils.route(`/companions/${_id}/friends`))
                .then(response => {
                    expect(response.data.length).to.equal(expected.length);
                    expect(
                        areSameCompanionsInBothArrays(response.data, expected)
                    ).to.be.true;
                    done();
                })
                .catch(err => done(err));
        });

        it("should return a 404 error for a non-existent id", done => {
            expect404('/companions/dummyId/friends', done);
        });

    });

});

describe("/companions/crossover", () => {
    
    describe("GET", () => {

        it("should show all companions that travelled with two or more doctors.", done => {
            const expected = [{"_id":"c3_3__4_1","name":"Elisabeth Sladen","character":"Sarah Jane Smith","doctors":["d3","d4"],"seasons":[11,12,13,14],"alive":true},{"_id":"c4_5__5_1","name":"Matthew Waterhouse","character":"Adric","doctors":["d4","d5"],"seasons":[18,19],"alive":false},{"_id":"c4_6__5_2","name":"Sarah Sutton","character":"Nyssa","doctors":["d4","d5"],"seasons":[18,19,20],"alive":true},{"_id":"c4_7__5_3","name":"Janet Fielding","character":"Tegan Jovanka","doctors":["d4","d5"],"seasons":[18,19,20,21],"alive":true},{"_id":"c5_5__6_1","name":"Nicola Bryant","character":"Peri Brown","doctors":["d5","d6"],"seasons":[21,22,23],"alive":true},{"_id":"c6_2__7_1","name":"Bonnie Langford","character":"Mel Bush","doctors":["d6","d7"],"seasons":[23,24],"alive":true},{"_id":"c9_1__10_1","name":"Billie Piper","character":"Rose Tyler","doctors":["d9","d10"],"seasons":[27,28,30],"alive":true},{"_id":"c9_3__10_5__13_4","name":"John Barrowman","character":"Captain Jack Harkness","doctors":["d9","d10","d13"],"seasons":[27,29,30,38],"alive":true},{"_id":"c11_3__12_1","name":"Alex Kingston","character":"River Song","doctors":["d11","d12"],"seasons":[32,35],"alive":true},{"_id":"c11_4__12_2","name":"Jenna Coleman","character":"Clara Oswald","doctors":["d11","d12"],"seasons":[33,34,35],"alive":false}];
            axios.get(utils.route(`/companions/crossover`))
                .then(response => {
                    expect(
                        areSameCompanionsInBothArrays(response.data, expected)
                    ).to.be.true;
                    expect(response.data.length).to.eql(10);
                    expect(expected.length).to.eql(10);
                    done();
                })
                .catch(err => done(err));
        });

    });

});