import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import FaceRecord from './models/FaceRecord.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visionid';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✓ Biometric Vault: CONNECTED'))
    .catch((err) => console.error('✗ Biometric Vault Error:', err));

// API Endpoints
app.get('/api/faces', async (req, res) => {
    try {
        const faces = await FaceRecord.find({});
        res.json(faces);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve biometrics' });
    }
});

app.post('/api/faces/register', async (req, res) => {
    try {
        const { name, descriptor } = req.body;
        console.log(`[AUTH] Registration Protocol Initiated: ${name}`);

        if (!name || !descriptor) {
            console.warn('✗ Registration Failed: Missing required biometric fields');
            return res.status(400).json({ error: 'Missing name or descriptor' });
        }

        // Convert descriptor array to Float32Array on front-end if needed, 
        // but here we just store it as a number array.
        const newFace = new FaceRecord({
            name,
            descriptor: Array.from(descriptor)
        });

        await newFace.save();
        console.log(`✓ Identity Committed: ${name} (Descriptor Vectors: ${descriptor.length})`);
        res.status(201).json({ message: 'Identity Committed to Vault', name });
    } catch (err) {
        console.error('✗ Biometric Encryption Failed:', err);
        res.status(500).json({ error: 'Biometric Encryption Failed' });
    }
});

app.delete('/api/faces/purge', async (req, res) => {
    try {
        await FaceRecord.deleteMany({});
        res.json({ message: 'Vault Purged Successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Purge Protocol Failed' });
    }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`✓ VisionID Kernel active on port ${PORT}`);
});
