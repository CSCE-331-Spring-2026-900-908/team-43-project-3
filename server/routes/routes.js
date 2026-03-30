import { Router } from "express";
import pool from "../db.js";

const router = Router();

// X-Report: hourly sales for today (no side effects)
router.get("/x-report", async (_req, res) => {
  try {
    const zCheck = await pool.query(
      "SELECT COUNT(*) AS cnt FROM z_report_log WHERE report_date = CURRENT_DATE"
    );
    if (parseInt(zCheck.rows[0].cnt) > 0) {
      await pool.query(
        "UPDATE xz_hourly_sales SET order_count=0, total_sales=0, item_count=0"
      );
      return res.json({ closed: true, hours: [], totals: { orders: 0, sales: 0, items: 0 } });
    }

    const { rows } = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM o.order_timestamp)::int AS hour,
        COUNT(*) AS order_count,
        SUM(o.total_amount) AS total_sales,
        COALESCE(SUM(isub.qty), 0) AS item_count
      FROM orders o
      LEFT JOIN (
        SELECT order_id, SUM(quantity) AS qty FROM order_items GROUP BY order_id
      ) isub ON isub.order_id = o.order_id
      WHERE o.order_timestamp::date = CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM o.order_timestamp)::int
      ORDER BY hour
    `);

    const totals = rows.reduce(
      (acc, r) => ({
        orders: acc.orders + parseInt(r.order_count),
        sales: acc.sales + parseFloat(r.total_sales),
        items: acc.items + parseInt(r.item_count),
      }),
      { orders: 0, sales: 0, items: 0 }
    );

    res.json({ closed: false, hours: rows, totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Z-Report: close out day, reset to zero
router.post("/z-report", async (_req, res) => {
  try {
    const zCheck = await pool.query(
      "SELECT COUNT(*) AS cnt FROM z_report_log WHERE report_date = CURRENT_DATE"
    );
    if (parseInt(zCheck.rows[0].cnt) > 0) {
      return res.status(409).json({ error: "Z-Report already generated for today" });
    }

    const { rows } = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM o.order_timestamp)::int AS hour,
        COUNT(*) AS order_count,
        SUM(o.total_amount) AS total_sales,
        COALESCE(SUM(isub.qty), 0) AS item_count
      FROM orders o
      LEFT JOIN (
        SELECT order_id, SUM(quantity) AS qty FROM order_items GROUP BY order_id
      ) isub ON isub.order_id = o.order_id
      WHERE o.order_timestamp::date = CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM o.order_timestamp)::int
      ORDER BY hour
    `);

    const totals = rows.reduce(
      (acc, r) => ({
        orders: acc.orders + parseInt(r.order_count),
        sales: acc.sales + parseFloat(r.total_sales),
        items: acc.items + parseInt(r.item_count),
      }),
      { orders: 0, sales: 0, items: 0 }
    );

    await pool.query(
      "INSERT INTO z_report_log (report_date, generated_at, total_sales, total_orders) VALUES (CURRENT_DATE, NOW(), $1, $2)",
      [totals.sales, totals.orders]
    );
    await pool.query(
      "UPDATE xz_hourly_sales SET order_count=0, total_sales=0, item_count=0"
    );

    res.json({ hours: rows, totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Z-Report (testing only)
router.post("/reset-z-report", async (_req, res) => {
  try {
    await pool.query("DELETE FROM z_report_log WHERE report_date = CURRENT_DATE");
    res.json({ reset: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sales summary
router.get("/sales-summary", async (req, res) => {
  const { start, end } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS order_count,
              COALESCE(SUM(total_amount), 0) AS revenue,
              COALESCE(AVG(total_amount), 0) AS avg_order
       FROM orders
       WHERE order_timestamp::date BETWEEN $1::date AND $2::date`,
      [start, end]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});