import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { start, end, limit } = req.query;
  try {
    let sql = "SELECT * FROM orders WHERE 1=1";
    const params = [];
    if (start) { params.push(start); sql += ` AND order_timestamp::date >= $${params.length}::date`; }
    if (end)   { params.push(end);   sql += ` AND order_timestamp::date <= $${params.length}::date`; }
    sql += " ORDER BY order_timestamp DESC";
    if (limit) { params.push(parseInt(limit)); sql += ` LIMIT $${params.length}`; }

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});