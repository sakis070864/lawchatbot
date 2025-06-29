// server.js
// This is the backend server that connects to MongoDB and saves case data.

// Import necessary packages
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config(); // This line loads the environment variables from the .env file

// --- Configuration ---
const app = express();
const port = 3001; // Port for the server to run on

// MongoDB Connection String - Securely loaded from environment variables
const uri = process.env.MONGO_URI;

// Check if the environment variable is loaded
if (!uri) {
    console.error("Error: MONGO_URI environment variable not set. Please create a .env file.");
    process.exit(1); // Exit the application if the database string is not found
}

// --- Middleware ---
// **FIX:** Added a more explicit CORS configuration to ensure requests are allowed.
app.use(cors({
  origin: '*' // Allows requests from any origin. For production, you might restrict this.
}));
app.use(express.json()); // Allows the server to understand JSON data

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// --- API Endpoint ---
// This endpoint will receive the case summary and save it to the database
app.post('/api/save-case', async (req, res) => {
    try {
        // 1. Connect to the database
        await client.connect();
        console.log("Successfully connected to MongoDB Atlas!");

        // 2. Get the data sent from the frontend
        const caseData = req.body;
        console.log("Received case data:", caseData);

        // 3. Define the database and collection
        const database = client.db("legal_intake_db");
        const collection = database.collection("cases");

        // 4. Create the document to be inserted
        const caseDocument = {
            caseId: caseData.caseId,
            caseSummary: caseData.summary,
            chatHistory: caseData.history,
            attachedFiles: caseData.files,
            createdAt: new Date() // Use server time for accuracy
        };

        // 5. Insert the document into the collection
        const result = await collection.insertOne(caseDocument);
        console.log(`Successfully inserted case with _id: ${result.insertedId}`);

        // 6. Send a success response back to the frontend
        res.status(201).json({ 
            message: 'Case saved successfully!', 
            caseId: caseData.caseId,
            databaseId: result.insertedId 
        });

    } catch (error) {
        console.error("Failed to save case to MongoDB:", error);
        res.status(500).json({ message: 'Error saving case to database' });
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
        console.log("MongoDB connection closed.");
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
