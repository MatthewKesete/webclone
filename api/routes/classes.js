const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/classes - List all classes
router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT * FROM ClassProfiles';
    const rows = await db.all(sql);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/classes/:classCode - Get class by ClassCode
router.get('/:classCode', async (req, res) => {
  try {
    const { classCode } = req.params;
    const sql = 'SELECT * FROM ClassProfiles WHERE ClassCode = ? OR Class = ?';
    const row = await db.get(sql, [classCode, classCode]);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error fetching class:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/classes - Create new class profile
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body);
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No class data provided' });
    }

    const columns = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const params = keys.map(k => body[k]);

    const sql = `INSERT INTO ClassProfiles (${columns}) VALUES (${placeholders})`;
    const result = await db.run(sql, params);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating class:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/classes/:classCode - Update class profile
router.put('/:classCode', async (req, res) => {
  try {
    const { classCode } = req.params;
    const body = req.body;
    const keys = Object.keys(body);
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No update data provided' });
    }

    const setClause = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}" = ?`).join(', ');
    const params = keys.map(k => body[k]);
    params.push(classCode, classCode);

    const sql = `UPDATE ClassProfiles SET ${setClause} WHERE ClassCode = ? OR Class = ?`;
    const result = await db.run(sql, params);

    res.json({
      success: true,
      message: 'Class updated successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error updating class:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/classes/:classCode - Delete class profile
router.delete('/:classCode', async (req, res) => {
  try {
    const { classCode } = req.params;
    const sql = 'DELETE FROM ClassProfiles WHERE ClassCode = ? OR Class = ?';
    const result = await db.run(sql, [classCode, classCode]);

    res.json({
      success: true,
      message: 'Class deleted successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error deleting class:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
