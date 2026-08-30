const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/attendance - List all attendance profiles
router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT * FROM AttendanceProfiles';
    const rows = await db.all(sql);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching attendance profiles:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/attendance/class/:classFileCode - Get attendance by ClassFileCode
router.get('/class/:classFileCode', async (req, res) => {
  try {
    const { classFileCode } = req.params;
    const sql = 'SELECT * FROM AttendanceProfiles WHERE ClassFileCode = ? OR Class = ?';
    const rows = await db.all(sql, [classFileCode, classFileCode]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching class attendance:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/attendance - Create attendance record
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body).filter(k => k !== 'ID');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No attendance data provided' });
    }

    const columns = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_/]/g, '')}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const params = keys.map(k => body[k]);

    const sql = `INSERT INTO AttendanceProfiles (${columns}) VALUES (${placeholders})`;
    const result = await db.run(sql, params);

    res.status(201).json({
      success: true,
      message: 'Attendance profile created successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating attendance profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/attendance/:id - Update attendance record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const keys = Object.keys(body).filter(k => k !== 'ID');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No update data provided' });
    }

    const setClause = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_/]/g, '')}" = ?`).join(', ');
    const params = keys.map(k => body[k]);
    params.push(id);

    const sql = `UPDATE AttendanceProfiles SET ${setClause} WHERE ID = ?`;
    const result = await db.run(sql, params);

    res.json({
      success: true,
      message: 'Attendance profile updated successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error updating attendance profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM AttendanceProfiles WHERE ID = ?';
    const result = await db.run(sql, [id]);

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error deleting attendance record:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
