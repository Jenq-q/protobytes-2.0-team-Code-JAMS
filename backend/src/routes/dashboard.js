const express = require('express');
const pool = require('../db/db');
const router = express.Router();

router.get("/", async(req, res)=>{
    result = await pool.query(`SELECT 
    c.complain_id,
    c.complain_msg,
    c.img_url,
    c.created_at,

    COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
    COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0) AS downvotes,

    STRING_AGG(DISTINCT m.ministry_name, ', ') AS ministries,
    STRING_AGG(DISTINCT d.department_name, ', ') AS departments

FROM complaints c

LEFT JOIN votes v 
    ON c.complain_id = v.complain_id

LEFT JOIN complaint_ministries cm 
    ON c.complain_id = cm.complain_id
LEFT JOIN ministries m 
    ON cm.ministry_id = m.ministry_id

LEFT JOIN complaint_departments cd 
    ON c.complain_id = cd.complain_id
LEFT JOIN departments d 
    ON cd.department_id = d.department_id

GROUP BY c.complain_id

ORDER BY upvotes DESC, c.created_at DESC;
`)

res.json(result.rows)
})

module.exports = router;