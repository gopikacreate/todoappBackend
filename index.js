const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json()); 

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER, 
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});



app.get('/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id ASC'); 
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err.message);
    res.status(500).send('Server Error');
  }
});


app.post('/todos', async (req, res) => {
  const { task } = req.body;


  if (!task || task.trim() === '') {
    return res.status(400).send('Task cannot be empty');
  }

  try {
    const result = await pool.query(
      'INSERT INTO todos (task) VALUES ($1) RETURNING *',
      [task.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding todo:', err.message);
    res.status(500).send('Server Error');
  }
});


app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { task, completed } = req.body;


  if (task && task.trim() === '') {
    return res.status(400).send('Task cannot be empty');
  }

  try {
    const result = await pool.query(
      'UPDATE todos SET task = COALESCE($1, task), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *',
      [task ? task.trim() : null, completed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Todo not found');
    }

    res.json(result.rows[0]); 
  } catch (err) {
    console.error('Error updating todo:', err.message);
    res.status(500).send('Server Error');
  }
});


app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Todo not found');
    }

    res.send('Task deleted successfully');
  } catch (err) {
    console.error('Error deleting todo:', err.message);
    res.status(500).send('Server Error');
  }
});


app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
