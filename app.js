// app.js

// Core Imports
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const debug = require('debug')('app');
const path = require('path');
const dotenv = require('dotenv');
const YAML = require('yamljs');

// Custom Utils
const connectDB = require('./models/db');

// Load environment variables from .env
dotenv.config();

// Load YAML configuration
const config = YAML.load(path.join(__dirname, './config/config.yaml'));

// Initialize Express App
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
if (config.app.env === 'development') {
    const morgan = require('morgan');
    app.use(morgan('dev'));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
    secret: config.app.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // In production, should be true with HTTPS
}));

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Extract Admin Credentials from Config
const adminUsername = config.admin.username;
const adminPassword = config.admin.password;

// Routes
app.get('/', (req, res) => {
    res.render('index', { isAdmin: req.session.isAdmin || false });
});

app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).send('Unauthorized');
    }
    res.send('Welcome Admin');
});

app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminUsername && password === adminPassword) {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/admin-logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.redirect('/');
    });
});

// Start Server
const PORT = config.app.port || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
