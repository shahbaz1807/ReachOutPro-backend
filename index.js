import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';

dotenv.config();

mongoose.connect(process.env.MONGOURL).then(() => {
    console.log('mongoDB connect successfully!');
}).catch((err) => {
    console.log(err);
});

const app = express();
const port = process.env.PORT || 9000;

app.use(bodyParser.json());
app.use(cors())

// Mongoose Schema & Model
const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    messages: [
        {
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

const Category = mongoose.model('Category', CategorySchema);

// API to add new category with messages
app.post('/add-Categories', async (req, res) => {
    const { category, messages = [] } = req.body;

    if (!category || typeof category !== 'string') {
        return res.status(400).json({ error: 'Invalid category' });
    }

    try {
        const existing = await Category.findOne({ name: category });
        if (existing) {
            return res.status(400).json({ error: 'Category already exists' });
        }

        const formattedMessages = messages.map(msg => ({ text: msg }));
        const newCategory = new Category({ name: category, messages: formattedMessages });
        await newCategory.save();

        res.status(201).json({ success: true, message: `${category} category added.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// API to add message to existing category
app.post('/add-message', async (req, res) => {
    const { category, message } = req.body;

    if (!category || !message) {
        return res.status(400).json({ error: 'Category and message are required' });
    }

    try {
        const updated = await Category.findOneAndUpdate(
            { name: category },
            { $push: { messages: { text: message } } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json({ success: true, message: 'Message added', data: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// API to get all categories with messages
app.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: categories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// API to get specific category messages
app.get('/categories/:name', async (req, res) => {
    const categoryName = req.params.name;

    try {
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ success: true, data: category });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`server is running on port http://localhost:${port}/`);
});
