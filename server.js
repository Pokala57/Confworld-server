const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs/promises'); // Using promises for cleaner async code
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---

// --- NEW CORS CONFIGURATION ---
// This block fixes the CORS error by specifying which domains are allowed
const allowedOrigins = [
  'http://localhost:5173',          // For your local React app
  'https://icaebms-2026.netlify.app',  // Your live Netlify frontend
  "https://confworld-client-1.onrender.com"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Check if the request's origin is in our allowed list
    // !origin allows requests from tools like Postman
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('This origin is not allowed by CORS'));
    }
  }
};

// Use the new corsOptions
app.use(cors(corsOptions));
// ------------------------------

// Parse incoming JSON request bodies (for our form)
app.use(express.json()); 

// --- API Routes ---

const conferenceDataPath = path.join(__dirname, 'data', 'conference.json');
const registrationsDataPath = path.join(__dirname, 'data', 'registrations.json');

// 1. GET API: Send all conference data
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readFile(conferenceDataPath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading conference data:', error);
    res.status(500).json({ message: 'Error fetching conference data' });
  }
});

// 2. POST API: Handle new registrations
app.post('/api/register', async (req, res) => {
  try {
    const newRegistration = req.body;
    
    // Simple validation
    if (!newRegistration.name || !newRegistration.email) {
      return res.status(400).json({ message: 'Name and Email are required' });
    }

    // Read existing registrations
    let registrations = [];
    try {
      const data = await fs.readFile(registrationsDataPath, 'utf-8');
      registrations = JSON.parse(data);
    } catch (readError) {
      // If file doesn't exist or is empty, start with an empty array
      console.log('No existing registrations file, creating new one.');
    }

    // Add new registration (in a real app, add a unique ID)
    registrations.push(newRegistration);

    // Write updated registrations back to the file
    await fs.writeFile(registrationsDataPath, JSON.stringify(registrations, null, 2));

    res.status(201).json({ message: 'Registration successful!', data: newRegistration });

  } catch (error) {
    console.error('Error saving registration:', error);
    res.status(500).json({ message: 'Error saving registration' });
  }
});


// --- Serve React App ---
// These must come AFTER your API routes

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle all other GET requests by sending them the React app's index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});