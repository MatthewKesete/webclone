const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/schedules - List all schedules (optionally filter by ClassFileCode or ScheduleFileCode)
router.get('/', async (req, res) => {
  try {
    const { classCode, scheduleCode } = req.query;
    let sql = 'SELECT * FROM ScheduleProfiles';
    const params = [];

    if (classCode) {
      sql += ' WHERE ClassFileCode = ?';
      params.push(classCode);
    } else if (scheduleCode) {
      sql += ' WHERE ScheduleFileCode = ?';
      params.push(scheduleCode);
    }

    const rows = await db.all(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schedules/:scheduleFileCode - Get a single schedule
// ScheduleProfiles columns: ScheduleFileCode (PK), Class, ClassFileCode,
//   DayOne, DayTwo, DayThree, TimeOne, TimeTwo, TimeThree, Room,
//   InstructorName, InstructorFileCode
router.get('/:scheduleFileCode', async (req, res) => {
  try {
    const { scheduleFileCode } = req.params;
    const sql = 'SELECT * FROM ScheduleProfiles WHERE ScheduleFileCode = ?';
    const row = await db.get(sql, [scheduleFileCode]);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedules - Create schedule
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body);
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No schedule data provided' });
    }

    const columns = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const params = keys.map(k => body[k]);

    const sql = `INSERT INTO ScheduleProfiles (${columns}) VALUES (${placeholders})`;
    const result = await db.run(sql, params);

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating schedule:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/schedules/:scheduleFileCode - Update schedule by ScheduleFileCode (PK)
router.put('/:scheduleFileCode', async (req, res) => {
  try {
    const { scheduleFileCode } = req.params;
    const body = req.body;
    const keys = Object.keys(body).filter(k => k !== 'ScheduleFileCode');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No update data provided' });
    }

    const setClause = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}" = ?`).join(', ');
    const params = keys.map(k => body[k]);
    params.push(scheduleFileCode);

    const sql = `UPDATE ScheduleProfiles SET ${setClause} WHERE ScheduleFileCode = ?`;
    const result = await db.run(sql, params);

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error updating schedule:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/schedules/:scheduleFileCode - Delete schedule by ScheduleFileCode (PK)
router.delete('/:scheduleFileCode', async (req, res) => {
  try {
    const { scheduleFileCode } = req.params;
    const sql = 'DELETE FROM ScheduleProfiles WHERE ScheduleFileCode = ?';
    const result = await db.run(sql, [scheduleFileCode]);

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error deleting schedule:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


