"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DoctorSchema = new Schema({
    name: {
        type: Schema.Types.String,
        required: true
    },
    seasons: {
        type: [Schema.Types.Number],
        required: true
    },
    doc_id: {
        type: Schema.Types.String
    }
    
});

DoctorSchema.statics.create = function(obj) {
    const doctor = new mongoose.model("Doctor", DoctorSchema)();
    doctor.name = obj.name;
    doctor.seasons = obj.seasons;
    doctor.doc_id = obj.doc_id; // for legacy support of d1, d2, etc.
    return doctor;
}

module.exports = mongoose.model("Doctor", DoctorSchema);
