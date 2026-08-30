const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/students - List/search students
router.get('/', async (req, res) => {
  try {
    const { search, column, classCode } = req.query;
    let sql = 'SELECT * FROM StudentProfiles';
    const params = [];
    const conditions = [];

    if (search && column) {
      // Standard parameterized search matching C# logic: WHERE column LIKE ?
      // Sanitize column name to allow alphanumeric field names
      const safeColumn = column.replace(/[^a-zA-Z0-9_]/g, '');
      conditions.push(`${safeColumn} LIKE ?`);
      params.push(`${search}%`);
    } else if (search) {
      conditions.push('(SName LIKE ? OR FileCode LIKE ? OR StudentASCNo LIKE ? OR PhoneNumber LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (classCode) {
      conditions.push('FileCode LIKE ?');
      params.push(`${classCode}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const rows = await db.all(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/students/:id - Get student by ID or FileCode
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT * FROM StudentProfiles WHERE ID = ? OR FileCode = ?';
    const row = await db.get(sql, [id, id]);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/students - Create new student profile
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body).filter(k => k !== 'ID');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No student data provided' });
    }

    const columns = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const params = keys.map(k => body[k]);

    const sql = `INSERT INTO StudentProfiles (${columns}) VALUES (${placeholders})`;
    const result = await db.run(sql, params);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id - Update student profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const keys = Object.keys(body).filter(k => k !== 'ID');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No update data provided' });
    }

    const setClause = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}" = ?`).join(', ');
    const params = keys.map(k => body[k]);
    params.push(id, id);

    const sql = `UPDATE StudentProfiles SET ${setClause} WHERE ID = ? OR FileCode = ?`;
    const result = await db.run(sql, params);

    res.json({
      success: true,
      message: 'Student updated successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/students/:id - Delete student profile
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM StudentProfiles WHERE ID = ? OR FileCode = ?';
    const result = await db.run(sql, [id, id]);

    res.json({
      success: true,
      message: 'Student deleted successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
