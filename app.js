const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'tasksdb'
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database!');

    app.get('/api/tasks', (req, res) => {
        const sql = "SELECT *, DATE_FORMAT(dueDate, '%Y-%m-%d') AS formattedDueDate FROM tasks ORDER BY dueDate";
        connection.query(sql, (err, results) => {
            if (err) {
                console.error("Error fetching tasks:", err);
                return res.status(500).json({ error: "Failed to fetch tasks" });
            }
            res.json(results);
        });
    });

    app.get('/api/tasks/:group', (req, res) => {
        const group = req.params.group;
        let sql = "SELECT *, DATE_FORMAT(dueDate, '%Y-%m-%d') AS formattedDueDate FROM tasks";
        let values = []; 

        if (group !== "ALL") {
            sql += " WHERE task_group = ?";
            values.push(group);
        }
        sql += " ORDER BY dueDate";
        connection.query(sql, values, (err, results) => {
            if (err) {
                console.error("Error fetching tasks:", err);
                return res.status(500).json({ error: "Failed to fetch tasks" });
            }
            res.json(results);
        });
    });


    app.post('/api/tasks', (req, res) => {
        const { description, dueDate, group } = req.body;
        const sql = "INSERT INTO tasks (description, dueDate, task_group, completed) VALUES (?, ?, ?, 0)";
        connection.query(sql, [description, dueDate, group], (err, results) => {
            if (err) {
                console.error("Error adding task:", err);
                return res.status(500).json({ error: "Failed to add task" });
            }
            res.status(201).json({ id: results.insertId, description, dueDate, group, completed: false });
        });
    });

    app.put('/api/tasks/:id', (req, res) => {
        const taskId = req.params.id;
        const { description, dueDate, group, completed, task_group } = req.body;
        const sql = "UPDATE tasks SET description = ?, dueDate = ?, task_group = ?, completed = ? WHERE id = ?";
        connection.query(sql, [description, dueDate, task_group || group, completed, taskId], (err, results) => {
            if (err) {
                console.error("Error updating task:", err);
                return res.status(500).json({ error: "Failed to update task" });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "Task not found" });
            }
            res.json({ message: "Task updated successfully", id: taskId, description, dueDate, group, completed });
        });
    });


    app.delete('/api/tasks/:id', (req, res) => {
        const taskId = req.params.id;
        const sql = "DELETE FROM tasks WHERE id = ?";
        connection.query(sql, [taskId], (err, results) => {
            if (err) {
                console.error("Error deleting task:", err);
                return res.status(500).json({ error: "Failed to delete task" });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "Task not found" });
            }
            res.json({ message: "Task deleted successfully" });
        });
    });

    app.get("/", (req, res) => {
        res.sendFile(__dirname + "/public/index.html");
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});