const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/employees - List/search employees
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM EmployeeProfiles';
    const params = [];

    if (search) {
      sql += ' WHERE FullName LIKE ? OR FileCode LIKE ? OR IDNo LIKE ? OR PhoneNo LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const rows = await db.all(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/employees/:fileCode - Get employee by FileCode or ID
router.get('/:fileCode', async (req, res) => {
  try {
    const { fileCode } = req.params;
    const sql = 'SELECT * FROM EmployeeProfiles WHERE FileCode = ? OR ID = ?';
    const row = await db.get(sql, [fileCode, fileCode]);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error fetching employee:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/employees - Create employee profile
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body).filter(k => k !== 'ID');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No employee data provided' });
    }

    const columns = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const params = keys.map(k => body[k]);

    const sql = `INSERT INTO EmployeeProfiles (${columns}) VALUES (${placeholders})`;
    const result = await db.run(sql, params);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/employees/:fileCode - Update employee profile
router.put('/:fileCode', async (req, res) => {
  try {
    const { fileCode } = req.params;
    const body = req.body;
    const keys = Object.keys(body).filter(k => k !== 'ID');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No update data provided' });
    }

    const setClause = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}" = ?`).join(', ');
    const params = keys.map(k => body[k]);
    params.push(fileCode, fileCode);

    const sql = `UPDATE EmployeeProfiles SET ${setClause} WHERE FileCode = ? OR ID = ?`;
    const result = await db.run(sql, params);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/employees/:id - Delete employee profile
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM EmployeeProfiles WHERE ID = ? OR FileCode = ?';
    const result = await db.run(sql, [id, id]);

    res.json({
      success: true,
      message: 'Employee deleted successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
