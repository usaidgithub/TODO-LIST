const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const app = express();
const cors = require('cors');

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',  // Allow requests from this origin
    methods: 'GET,POST,PUT,DELETE,OPTIONS',  // Allow these HTTP methods
    allowedHeaders: 'Content-Type,Authorization',  // Allow these request headers
}));

// Set up session management
app.use(session({
    secret: 'shahin124',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 } // Set a reasonable max age for the cookie
}));

const port = 3000;

// Establish MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'todolist_application',
});

connection.connect((err) => {
    if (err) {
        console.log("Connection with MySQL failed", err);
    } else {
        console.log("Connection established successfully");
    }
});

const noCacheMiddleware = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
    next();
};

const isAuthenticated = (req, res, next) => {
    console.log("Checking authentication");
    console.log("Session data:", req.session);
    if (req.session.userId) {
        console.log("User is authenticated");
        next();
    } else {
        console.log("User is not authenticated");
        res.redirect('/login.html');
    }
};

app.use(noCacheMiddleware);
app.use('/home.html', isAuthenticated);
app.use(express.static(path.join(__dirname, '..')));

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const sql = 'INSERT INTO authentication (username, email, password) VALUES (?, ?, ?)';
    connection.query(sql, [username, email, hashedPassword], (err, result) => {
        if (err) {
            throw err;
        }
        console.log("Registration successful");
        res.redirect('/login');
    });
});

app.post('/login', (req, res) => {
    console.log("Handling user login");
    const { username, password } = req.body;
    connection.query('SELECT id, password FROM authentication WHERE username = ?', [username], async (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                req.session.userId = user.id;
                console.log("Login successful", "session data:", req.session);
                res.redirect('/home.html');
            } else {
                console.log("Invalid credentials - password mismatch");
                res.send("Invalid Credentials");
            }
        } else {
            console.log("Invalid credentials - username not found");
            res.send("Invalid credentials");
        }
    });
});

app.post('/add_task', (req, res) => {
    const { task } = req.body;  // Get task from the body
    console.log(`The task which will be added to the database is ${task}`);
    const userId = req.session.userId;
    const sql = 'INSERT INTO todolist (user_id, description) VALUES (?, ?)';
    connection.query(sql, [userId, task], (err, results) => {
        if (err) {
            throw err;
        }
        console.log("Record added successfully");
        res.json(results);
    });
});

app.get('/get_records', (req, res) => {
    const userId = req.session.userId;
    console.log(`User id is ${userId}`);
    const sql = 'SELECT * FROM todolist WHERE user_id = ?';
    connection.query(sql, [userId], (err, results) => {
        if (err) {
            throw err;
        }
        console.log("Data fetched successfully");
        res.json(results);
    });
});

app.delete('/delete_record/:id', (req, res) => {
    const recordId = req.params.id;
    const userId = req.session.userId;
    const sql = 'DELETE FROM todolist WHERE user_id = ? AND id = ?';
    connection.query(sql, [userId, recordId], (err, results) => {
        if (err) {
            throw err;
        }
        console.log("Data deleted successfully");
        res.status(200).send("Record deleted successfully");
    });
});

app.post('/update_record', (req, res) => {
    const { id, update_value } = req.body;
    const userId = req.session.userId;
    const sql = 'UPDATE todolist SET description = ? WHERE user_id = ? AND id = ?';
    connection.query(sql, [update_value, userId, id], (err, results) => {
        if (err) {
            throw err;
        }
        console.log("Data updated successfully");
        res.redirect('/home.html');
    });
});

app.get('/logout', (req, res) => {
    console.log("Handling user logout");
    req.session.destroy((err) => {
        if (err) {
            console.log("Error logging out");
            return res.send("Error logging out");
        }
        res.clearCookie('connect.sid'); // Clear the cookie
        console.log("User logged out session destroyed");
        res.redirect('/login.html');
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});