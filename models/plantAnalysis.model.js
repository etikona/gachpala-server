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
    plantType,
    scientificName,
    healthScore,
    analysisMethod,
  } = analysisData;

  // Since care_tips is an ARRAY type, we need to format it properly
  // Convert array to PostgreSQL array format: {"item1", "item2"}
  const careTipsFormatted = `{${careTips
    .map((tip) => `"${tip.replace(/"/g, '\\"')}"`)
    .join(",")}}`;

  const query = `
    INSERT INTO plant_analyses (
      user_id, image_url, status, disease, confidence, description, care_tips,
      fertilizer_type, fertilizer_application, fertilizer_frequency,
      humidity_recommendation, light_recommendation, temp_recommendation,
      nutrient_status, nitrogen_recommendation, phosphorus_recommendation, 
      potassium_recommendation, plant_type, scientific_name, health_score,
      analysis_method
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    RETURNING *
  `;

  const values = [
    userId,
    imageUrl,
    status,
    disease,
    confidence,
    description,
    careTipsFormatted, // Use formatted array
    fertilizer?.type || "General purpose",
    fertilizer?.application || "As directed",
    fertilizer?.frequency || "Monthly",
    measurements?.humidity || "40-60%",
    measurements?.light || "Bright indirect",
    measurements?.temp || "18-24°C",
    measurements?.nutrients?.status || "Good",
    measurements?.nutrients?.nitrogen || "Moderate",
    measurements?.nutrients?.phosphorus || "Moderate",
    measurements?.nutrients?.potassium || "Moderate",
    plantType,
    scientificName,
    healthScore,
    analysisMethod,
  ];

  console.log("Saving to DB with values:", values);

  try {
    const result = await pool.query(query, values);
    console.log("✅ Successfully saved to DB:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Database save error:", error);
    throw error;
  }
};
export const getUserPlantAnalyses = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "created_at",
    sortOrder = "DESC",
    status = null,
    plantType = null,
  } = options;

  const offset = (page - 1) * limit;

  let whereClause = "WHERE user_id = $1";
  let params = [userId];
  let paramCount = 1;

  if (status) {
    paramCount++;
    whereClause += ` AND status = $${paramCount}`;
    params.push(status);
  }

  if (plantType) {
    paramCount++;
    whereClause += ` AND plant_type ILIKE $${paramCount}`;
    params.push(`%${plantType}%`);
  }

  const query = `
    SELECT 
      id, 
      image_url, 
      status, 
      disease, 
      confidence, 
      description, 
      care_tips,
      plant_type,
      scientific_name,
      health_score,
      created_at,
      updated_at
    FROM plant_analyses 
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  params.push(limit, offset);
  const result = await pool.query(query, params);

  // Get total count for pagination
  const countQuery = `SELECT COUNT(*) FROM plant_analyses ${whereClause}`;
  const countResult = await pool.query(countQuery, params.slice(0, paramCount));
  const totalCount = parseInt(countResult.rows[0].count);

  return {
    analyses: result.rows,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1,
    },
  };
};

export const getPlantAnalysisById = async (id, userId) => {
  const query = `
    SELECT * FROM plant_analyses 
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [id, userId]);
  return result.rows[0] || null;
};

export const updatePlantAnalysis = async (id, userId, updateData) => {
  const { status, disease, description, careTips } = updateData;

  const query = `
    UPDATE plant_analyses 
    SET 
      status = COALESCE($3, status),
      disease = COALESCE($4, disease),
      description = COALESCE($5, description),
      care_tips = COALESCE($6, care_tips),
      updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const values = [
    id,
    userId,
    status,
    disease,
    description,
    careTips ? JSON.stringify(careTips) : null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deletePlantAnalysis = async (id, userId) => {
  const query = `
    DELETE FROM plant_analyses 
    WHERE id = $1 AND user_id = $2
    RETURNING image_url
  `;

  const result = await pool.query(query, [id, userId]);
  return result.rows[0] || null;
};

export const getAnalyticsData = async (userId) => {
  const queries = {
    totalAnalyses: `
      SELECT COUNT(*) as count 
      FROM plant_analyses 
      WHERE user_id = $1
    `,
    healthyPlants: `
      SELECT COUNT(*) as count 
      FROM plant_analyses 
      WHERE user_id = $1 AND status = 'Healthy'
    `,
    unhealthyPlants: `
      SELECT COUNT(*) as count 
      FROM plant_analyses 
      WHERE user_id = $1 AND status = 'Unhealthy'
    `,
    topPlantTypes: `
      SELECT plant_type, COUNT(*) as count
      FROM plant_analyses 
      WHERE user_id = $1 AND plant_type IS NOT NULL
      GROUP BY plant_type
      ORDER BY count DESC
      LIMIT 5
    `,
    recentAnalyses: `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM plant_analyses 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
  };

  const results = {};

  for (const [key, query] of Object.entries(queries)) {
    try {
      const result = await pool.query(query, [userId]);
      results[key] = result.rows;
    } catch (error) {
      console.error(`Error executing ${key} query:`, error);
      results[key] = [];
    }
  }

  return {
    totalAnalyses: parseInt(results.totalAnalyses[0]?.count || 0),
    healthyPlants: parseInt(results.healthyPlants[0]?.count || 0),
    unhealthyPlants: parseInt(results.unhealthyPlants[0]?.count || 0),
    topPlantTypes: results.topPlantTypes,
    recentAnalyses: results.recentAnalyses,
  };
};
