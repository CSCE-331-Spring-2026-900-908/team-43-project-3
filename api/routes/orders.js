/**
 * Order submission and retrieval routes.
 *
 * The POST handler creates an order, resolves modifier pricing, and updates
 * inventory and hourly sales counters inside a transaction.
 *
 * @type {import("express").Router}
 */
import { Router } from "express";
import pool from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

/**
 * GET / - Retrieve orders with optional date range and limit filters.
 * @param {express.Request} req - HTTP request with query { start?, end?, limit? } (date strings).
 * @param {express.Response} res - HTTP response with array of orders.
 */
router.get("/", requireAuth(["manager"]), async (req, res) => {
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

/**
 * POST / - Submit a new order with items and modifiers.
 * Creates order, updates inventory, and increments hourly sales in a transaction.
 * @param {express.Request} req - HTTP request with { items[], employee_id? }.
 * @param {express.Response} res - HTTP response with { order_id, total }.
 */
router.post("/", async (req, res) => {
  const { items, employee_id } = req.body;
  if (!items?.length) return res.status(400).json({ error: "No items" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let orderTotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      const menuRes = await client.query(
        "SELECT base_price FROM menu_items WHERE menu_item_id = $1",
        [item.menu_item_id]
      );
      if (menuRes.rows.length === 0) throw new Error(`Menu item ${item.menu_item_id} not found`);

      let linePrice = parseFloat(menuRes.rows[0].base_price);

      let modifierAdj = 0;
      if (item.choice_ids?.length) {
        const modRes = await client.query(
          `SELECT COALESCE(SUM(price_delta), 0) AS adj
           FROM modifier_choices WHERE choice_id = ANY($1::int[])`,
          [item.choice_ids]
        );
        modifierAdj = parseFloat(modRes.rows[0].adj);
      }

      const qty = item.quantity || 1;
      const lineTotal = (linePrice + modifierAdj) * qty;
      orderTotal += lineTotal;
      resolvedItems.push({ ...item, quantity: qty, lineTotal });
    }

    const orderRes = await client.query(
      `INSERT INTO orders (order_timestamp, total_amount)
       VALUES (NOW(), $1) RETURNING order_id`,
      [orderTotal]
    );
    const orderId = orderRes.rows[0].order_id;

    for (const item of resolvedItems) {
      const oiRes = await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, line_total)
         VALUES ($1, $2, $3, $4) RETURNING order_item_id`,
        [orderId, item.menu_item_id, item.quantity, item.lineTotal]
      );
      const orderItemId = oiRes.rows[0].order_item_id;

      if (item.choice_ids?.length) {
        for (const cId of item.choice_ids) {
          await client.query(
            "INSERT INTO order_item_modifier_choices (order_item_id, choice_id, quantity) VALUES ($1, $2, 1)",
            [orderItemId, cId]
          );
        }
      }

      // Decrement inventory
      const ingRows = await client.query(
        "SELECT inventory_item_id, quantity_used FROM menu_item_ingredients WHERE menu_item_id = $1",
        [item.menu_item_id]
      );
      for (const ing of ingRows.rows) {
        await client.query(
          "UPDATE inventory_items SET stock_quantity = stock_quantity - $1 WHERE inventory_item_id = $2",
          [parseFloat(ing.quantity_used) * item.quantity, ing.inventory_item_id]
        );
      }
    }

    // Update hourly sales tracker
    await client.query(
      `UPDATE xz_hourly_sales SET
         order_count = order_count + 1,
         total_sales = total_sales + $1,
         item_count  = item_count + $2
       WHERE hour_of_day = EXTRACT(HOUR FROM NOW())::int`,
      [orderTotal, resolvedItems.reduce((s, i) => s + i.quantity, 0)]
    );

    await client.query("COMMIT");
    res.status(201).json({ order_id: orderId, total: orderTotal });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
