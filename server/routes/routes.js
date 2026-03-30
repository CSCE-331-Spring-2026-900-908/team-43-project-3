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