const pool = require("../config/database");

exports.getAll = async (req, res) => {
  const result = await pool.query("SELECT * FROM animals");
  res.json(result.rows);
};

exports.create = async (req, res) => {
  const { name, species, owner_id } = req.body;

  const result = await pool.query(
    `INSERT INTO animals (name, species, owner_id)
     VALUES ($1,$2,$3) RETURNING *`,
    [name, species, owner_id]
  );

  res.status(201).json(result.rows[0]);
};