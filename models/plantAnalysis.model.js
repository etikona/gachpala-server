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

  // Format care_tips as PostgreSQL array
  let careTipsFormatted;
  if (Array.isArray(careTips)) {
    careTipsFormatted = `{${careTips
      .map((tip) => `"${tip.replace(/"/g, '\\"')}"`)
      .join(",")}}`;
  } else if (typeof careTips === "string") {
    careTipsFormatted = `{"${careTips.replace(/"/g, '\\"')}"}`;
  } else {
    careTipsFormatted = "{}";
  }

  const query = `
    INSERT INTO plant_analyses (
      user_id, image_url, status, disease, confidence, description, care_tips,
      fertilizer_type, fertilizer_application, fertilizer_frequency,
      humidity_recommendation, light_recommendation, temp_recommendation,
      nutrient_status, nitrogen_recommendation, phosphorus_recommendation, 
      potassium_recommendation, plant_type, scientific_name, health_score,
      analysis_method, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    userId,
    imageUrl,
    status || "Unknown",
    disease || "None",
    confidence || 0,
    description || "No description available",
    careTipsFormatted,
    fertilizer?.type || "General purpose fertilizer",
    fertilizer?.application || "Apply as directed on package",
    fertilizer?.frequency || "Monthly during growing season",
    measurements?.humidity || "40-60%",
    measurements?.light || "Bright indirect light",
    measurements?.temp || "18-24°C",
    measurements?.nutrients?.status || "Good",
    measurements?.nutrients?.nitrogen || "Moderate",
    measurements?.nutrients?.phosphorus || "Moderate",
    measurements?.nutrients?.potassium || "Moderate",
    plantType || "Unknown Plant",
    scientificName || "Unknown species",
    healthScore || 0,
    analysisMethod || "ai_analysis",
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Database save error:", error);
    throw new Error("Failed to save plant analysis to database");
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
      id, image_url, status, disease, confidence, description, care_tips,
      plant_type, scientific_name, health_score, fertilizer_type,
      fertilizer_application, fertilizer_frequency, humidity_recommendation,
      light_recommendation, temp_recommendation, nutrient_status,
      nitrogen_recommendation, phosphorus_recommendation, potassium_recommendation,
      analysis_method, created_at, updated_at
    FROM plant_analyses 
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  params.push(limit, offset);

  try {
    const result = await pool.query(query, params);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM plant_analyses ${whereClause}`;
    const countResult = await pool.query(
      countQuery,
      params.slice(0, paramCount)
    );
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
  } catch (error) {
    console.error("Error fetching user plant analyses:", error);
    throw new Error("Failed to fetch plant analyses");
  }
};

export const getPlantAnalysisById = async (id, userId) => {
  const query = `SELECT * FROM plant_analyses WHERE id = $1 AND user_id = $2`;

  try {
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching plant analysis by ID:", error);
    throw new Error("Failed to fetch plant analysis");
  }
};

export const updatePlantAnalysis = async (id, userId, updateData) => {
  const { status, disease, description, careTips } = updateData;

  let careTipsFormatted = null;
  if (careTips) {
    if (Array.isArray(careTips)) {
      careTipsFormatted = `{${careTips
        .map((tip) => `"${tip.replace(/"/g, '\\"')}"`)
        .join(",")}}`;
    } else if (typeof careTips === "string") {
      careTipsFormatted = `{"${careTips.replace(/"/g, '\\"')}"}`;
    }
  }

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

  const values = [id, userId, status, disease, description, careTipsFormatted];

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error updating plant analysis:", error);
    throw new Error("Failed to update plant analysis");
  }
};

export const deletePlantAnalysis = async (id, userId) => {
  const query = `DELETE FROM plant_analyses WHERE id = $1 AND user_id = $2 RETURNING image_url`;

  try {
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error deleting plant analysis:", error);
    throw new Error("Failed to delete plant analysis");
  }
};

export const getUserAnalyticsData = async (userId) => {
  const queries = {
    overview: `
      SELECT 
        COUNT(*) as total_scans,
        AVG(health_score) as avg_health_score,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN status = 'Healthy' THEN 1 END) as healthy_count,
        COUNT(CASE WHEN status IN ('Unhealthy', 'Diseased', 'Sick') THEN 1 END) as unhealthy_count,
        COUNT(DISTINCT plant_type) as unique_plant_types
      FROM plant_analyses 
      WHERE user_id = $1
    `,
    plantTypes: `
      SELECT plant_type, COUNT(*) as count, AVG(health_score) as avg_health
      FROM plant_analyses 
      WHERE user_id = $1 AND plant_type IS NOT NULL AND plant_type != 'Unknown Plant'
      GROUP BY plant_type
      ORDER BY count DESC
      LIMIT 10
    `,
    monthlyTrends: `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as scan_count,
        AVG(health_score) as avg_health_score
      FROM plant_analyses 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `,
    recentScans: `
      SELECT id, plant_type, status, health_score, created_at, image_url
      FROM plant_analyses 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `,
    healthDistribution: `
      SELECT status, COUNT(*) as count
      FROM plant_analyses 
      WHERE user_id = $1
      GROUP BY status
      ORDER BY count DESC
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
    overview: results.overview[0] || {
      total_scans: 0,
      avg_health_score: 0,
      avg_confidence: 0,
      healthy_count: 0,
      unhealthy_count: 0,
      unique_plant_types: 0,
    },
    plantTypes: results.plantTypes,
    monthlyTrends: results.monthlyTrends,
    recentScans: results.recentScans,
    healthDistribution: results.healthDistribution,
  };
};
