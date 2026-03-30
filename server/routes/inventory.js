import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM inventory_items ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { name, unit, stock_quantity } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE inventory_items
       SET name = COALESCE($1, name),
           unit = COALESCE($2, unit),
           stock_quantity = COALESCE($3, stock_quantity)
       WHERE inventory_item_id = $4 RETURNING *`,
      [name, unit, stock_quantity, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, unit, stock_quantity } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO inventory_items (name, unit, stock_quantity) VALUES ($1, $2, $3) RETURNING *",
      [name, unit, stock_quantity || 10000]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
