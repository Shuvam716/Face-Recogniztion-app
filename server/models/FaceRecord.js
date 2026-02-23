import mongoose from 'mongoose';

const faceRecordSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    descriptor: {
        type: [Number], // Storing the 128-dimensional Float32Array as an array of numbers
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('FaceRecord', faceRecordSchema);
