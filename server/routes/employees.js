/**
 * Employee management routes.
 *
 * These endpoints provide the manager dashboard with the data needed to
 * list, create, and update employee records.
 *
 * @type {import("express").Router}
 */
import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM employees ORDER BY employee_id"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, role } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO employees (name, role, is_active) VALUES ($1, $2, TRUE) RETURNING *",
      [name, role || "Cashier"]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { name, role, is_active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE employees
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           is_active = COALESCE($3, is_active)
       WHERE employee_id = $4 RETURNING *`,
      [name, role, is_active, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
