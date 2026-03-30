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

router.put("/:id", async (req, res) => {
  const { name, category, base_price } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE menu_items SET name=$1, category=$2, base_price=$3 WHERE menu_item_id=$4 RETURNING *",
      [name, category, base_price, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM menu_item_ingredients WHERE menu_item_id = $1", [req.params.id]);
    const { rowCount } = await client.query("DELETE FROM menu_items WHERE menu_item_id = $1", [req.params.id]);
    await client.query("COMMIT");
    if (rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get("/:id/modifiers", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.modifier_id, m.name AS modifier_name,
              mc.choice_id, mc.label, mc.price_delta
       FROM modifiers m
       JOIN modifier_choices mc ON mc.modifier_id = m.modifier_id
       ORDER BY m.modifier_id, mc.choice_id`
    );

    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.modifier_id]) {
        grouped[r.modifier_id] = { modifier_id: r.modifier_id, name: r.modifier_name, choices: [] };
      }
      grouped[r.modifier_id].choices.push({
        choice_id: r.choice_id,
        label: r.label,
        price_delta: parseFloat(r.price_delta),
      });
    }
    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;