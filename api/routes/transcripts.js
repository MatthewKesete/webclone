const express = require('express');
const router = express.Router();
const db = require('../db');

// Map user-friendly type codes or full table names to exact database table names
const TABLE_MAP = {
  default: 'StudentTranscript',
  mtt: 'StudentTranscriptMTT',
  web: 'StudentTranscriptWEB',
  pvs: 'StudentTranscriptPVS',
  acc: 'StudentTranscriptACC',
  bmt: 'StudentTranscriptBMT',
  bmt2: 'StudentTranscriptBMT2',
  dme: 'StudentTranscriptDME',
  dmeii: 'StudentTranscriptDMEII',
  om: 'StudentTranscriptOM',
  mff: 'StudentTranscriptMFF',
  pmt: 'StudentTranscriptPMT'
};

function getTableName(typeParam) {
  const normalized = (typeParam || '').toLowerCase();
  if (TABLE_MAP[normalized]) return TABLE_MAP[normalized];

  // Direct table name match validation
  const directMatch = Object.values(TABLE_MAP).find(t => t.toLowerCase() === normalized);
  if (directMatch) return directMatch;

  return null;
}

// GET /api/transcripts/:type/:fileCode - Fetch transcript by student file code
router.get('/:type/:fileCode', async (req, res) => {
  try {
    const { type, fileCode } = req.params;
    const tableName = getTableName(type);
    if (!tableName) {
      return res.status(400).json({ success: false, message: `Invalid transcript type: ${type}` });
    }

    const sql = `SELECT * FROM "${tableName}" WHERE FileCode LIKE ? OR FileCode = ?`;
    const rows = await db.all(sql, [`${fileCode}%`, fileCode]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching transcript:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transcripts/:type - Save/Create transcript record
router.post('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const tableName = getTableName(type);
    if (!tableName) {
      return res.status(400).json({ success: false, message: `Invalid transcript type: ${type}` });
    }

    const body = req.body;
    const keys = Object.keys(body).filter(k => k !== 'ID');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No transcript data provided' });
    }

    const columns = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const params = keys.map(k => body[k]);

    const sql = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders})`;
    const result = await db.run(sql, params);

    res.status(201).json({
      success: true,
      message: 'Transcript created successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating transcript:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/transcripts/:type/:fileCode - Update transcript record
router.put('/:type/:fileCode', async (req, res) => {
  try {
    const { type, fileCode } = req.params;
    const tableName = getTableName(type);
    if (!tableName) {
      return res.status(400).json({ success: false, message: `Invalid transcript type: ${type}` });
    }

    const body = req.body;
    const keys = Object.keys(body).filter(k => k !== 'ID');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No update data provided' });
    }

    const setClause = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}" = ?`).join(', ');
    const params = keys.map(k => body[k]);
    params.push(fileCode);

    const sql = `UPDATE "${tableName}" SET ${setClause} WHERE FileCode = ?`;
    const result = await db.run(sql, params);

    res.json({
      success: true,
      message: 'Transcript updated successfully',
      changes: result.changes
    });
  } catch (err) {
    console.error('Error updating transcript:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
