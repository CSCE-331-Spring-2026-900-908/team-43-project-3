import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.menu_item_id, m.name, m.category, m.base_price,
              COALESCE(ic.cnt, 0) AS ingredient_count
       FROM menu_items m
       LEFT JOIN (
         SELECT menu_item_id, COUNT(*) AS cnt FROM menu_item_ingredients GROUP BY menu_item_id
       ) ic ON ic.menu_item_id = m.menu_item_id
       ORDER BY m.category, m.name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await pool.query(
      "SELECT * FROM menu_items WHERE menu_item_id = $1",
      [req.params.id]
    );
    if (item.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const ingredients = await pool.query(
      `SELECT mii.*, inv.name AS ingredient_name, inv.unit
       FROM menu_item_ingredients mii
       JOIN inventory_items inv ON inv.inventory_item_id = mii.inventory_item_id
       WHERE mii.menu_item_id = $1`,
      [req.params.id]
    );

    res.json({ ...item.rows[0], ingredients: ingredients.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, category, base_price, ingredients } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "INSERT INTO menu_items (name, category, base_price) VALUES ($1, $2, $3) RETURNING *",
      [name, category, base_price]
    );
    const menuItem = rows[0];

    if (ingredients?.length) {
      for (const ing of ingredients) {
        await client.query(
          "INSERT INTO menu_item_ingredients (menu_item_id, inventory_item_id, quantity_used) VALUES ($1, $2, $3)",
          [menuItem.menu_item_id, ing.inventory_item_id, ing.quantity_used]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json(menuItem);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});