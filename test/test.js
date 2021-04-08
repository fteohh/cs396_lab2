const asserttype = require("chai-asserttype");
const axios = require("axios");
const chai = require("chai");

const data = require("../config/data.json");
const utils = require("./util/testUtil");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');


chai.use(asserttype);
chai.use(deepEqualInAnyOrder);
const expect = chai.expect;


const simplify = item => {
    delete item._id;
    delete item.__v;
    delete item.doctors;
    delete item.doc_id;
    return item;
};

describe("/doctors", () => {

    describe("GET", () => {

        it("should return a list of all Doctors", done => {
            axios.get(utils.route("/doctors"))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(
                        response.data.map(item => simplify(item))
                        ).to.deep.equalInAnyOrder(
                            data.doctors.map(item => simplify(item))
                        );
                    expect(response.data.length).to.eql(13);
                    expect(simplify(response.data[0])).to.eql(simplify(data.doctors[0]));
                    done();
                })
                .catch(err => done(err));
        });
    });

});

describe("/companions", () => {

    describe("GET", () => {

        it("should return a list of all Companions", done => {
            axios.get(utils.route("/companions"))
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(
                        response.data.map(item => simplify(item))
                        ).to.deep.equalInAnyOrder(
                            data.companions.map(item => simplify(item))
                        );
                    expect(response.data.length).to.eql(35);
                    expect(simplify(response.data[0])).to.eql(simplify(data.companions[0]));
                    done();
                })
                .catch(err => done(err));
        });
    });

});



