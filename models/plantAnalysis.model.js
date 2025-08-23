// backend/models/plantAnalysis.model.js
import pool from "../db.js";

export const savePlantAnalysis = async (analysisData) => {
  const {
    userId,
    imageUrl,
    status,
    disease,
    confidence,
    description,
    careTips,
    fertilizer,
    measurements,
  } = analysisData;

  const query = `
    INSERT INTO plant_analyses (
      user_id, image_url, status, disease, confidence, description, care_tips,
      fertilizer_type, fertilizer_application, fertilizer_frequency,
      humidity_recommendation, light_recommendation, temp_recommendation,
      nutrient_status, nitrogen_recommendation, phosphorus_recommendation, potassium_recommendation
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;

  const values = [
    userId,
    imageUrl,
    status,
    disease,
    confidence,
    description,
    careTips,
    fertilizer.type,
    fertilizer.application,
    fertilizer.frequency,
    measurements.humidity,
    measurements.light,
    measurements.temp,
    measurements.nutrients.status,
    measurements.nutrients.nitrogen,
    measurements.nutrients.phosphorus,
    measurements.nutrients.potassium,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getUserPlantAnalyses = async (userId) => {
  const query = `
    SELECT * FROM plant_analyses 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
};
