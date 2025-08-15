// models/adminSellerModel.js
import pool from "../db.js";

// !Get seller statistics for admin dashboard
export const getSellerStatistics = async () => {
  try {
    // Using only columns we know exist from your schema
    const totalSellers = await pool.query("SELECT COUNT(*) FROM sellers");
    const activeSellers = await pool.query(
      "SELECT COUNT(*) FROM sellers WHERE status = 'active'"
    );
    const approvedSellers = await pool.query(
      "SELECT COUNT(*) FROM sellers WHERE approved = true" // Changed from is_approved to approved
    );
    const pendingSellers = await pool.query(
      "SELECT COUNT(*) FROM sellers WHERE status = 'pending'"
    );

    // Handle rating only if column exists (wrap in try-catch)
    let avgRating = 0;
    try {
      const ratingResult = await pool.query(
        "SELECT AVG(rating) FROM sellers WHERE rating > 0"
      );
      avgRating = parseFloat(ratingResult.rows[0].avg) || 0;
    } catch (ratingError) {
      console.log("Rating column not available, using default 0");
    }

    return {
      totalSellers: parseInt(totalSellers.rows[0].count),
      activeSellers: parseInt(activeSellers.rows[0].count),
      verifiedSellers: parseInt(approvedSellers.rows[0].count), // Using approved count as verified
      pendingSellers: parseInt(pendingSellers.rows[0].count),
      avgRating: avgRating, // Will be 0 if rating column doesn't exist
    };
  } catch (err) {
    console.error("Error in getSellerStatistics:", err);
    throw err;
  }
};

//! Get all sellers with pagination and filtering
export const getAllSellers = async (
  page = 1,
  limit = 10,
  status = null,
  search = ""
) => {
  const offset = (page - 1) * limit;
  const debug = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'sellers'
  `);
  console.log("Seller table columns:", debug.rows);
  // Base query using ONLY columns that exist in your schema
  let query = `
    SELECT 
      s.id, 
      s.business_name as store_name, 
      s.full_name as owner_name, 
      s.created_at as joining_date, 
      s.status,
      s.approved as is_approved,  
      COALESCE(s.rating, 0) as rating,
      COUNT(p.id) as products_count
    FROM public.sellers s
    LEFT JOIN public.products p ON s.id = p.seller_id
  `;

  const queryParams = [];
  const whereClauses = [];

  // Status filter (using the confirmed 'status' column)
  if (status) {
    whereClauses.push(`s.status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  // Search filter
  if (search) {
    whereClauses.push(
      `(s.business_name ILIKE $${
        queryParams.length + 1
      } OR s.full_name ILIKE $${queryParams.length + 1})`
    );
    queryParams.push(`%${search}%`);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  query += `
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `;
  queryParams.push(limit, offset);

  try {
    const sellers = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM public.sellers s`;
    if (whereClauses.length > 0) {
      countQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    const totalCount = await pool.query(countQuery, queryParams.slice(0, -2));

    return {
      sellers: sellers.rows,
      pagination: {
        total: parseInt(totalCount.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount.rows[0].count / limit),
      },
    };
  } catch (err) {
    console.error("Database Error:", {
      query,
      params: queryParams,
      error: err.message,
    });
    throw new Error("Failed to fetch sellers: " + err.message);
  }
};

//! Get seller details by ID
export const getSellerById = async (id) => {
  const seller = await pool.query(
    `
    SELECT 
      s.*,
      COUNT(p.id) as products_count
    FROM sellers s
    LEFT JOIN products p ON s.id = p.seller_id
    WHERE s.id = $1
    GROUP BY s.id
  `,
    [id]
  );

  return seller.rows[0];
};

//! Update seller details
export const updateSeller = async (id, data = {}) => {
  try {
    // Validate input
    if (!id) throw new Error("Seller ID is required");
    if (typeof data !== "object") throw new Error("Invalid update data");

    // Build dynamic query
    const fields = [];
    const values = [];
    let paramCount = 1;

    // List of all possible fields
    const allowedFields = [
      "full_name",
      "email",
      "phone_number",
      "business_name",
      "business_type",
      "business_registration_no",
      "country",
      "state",
      "city",
      "address",
      "website_or_social_links",
      "gst_vat_number",
      "business_description",
      "status",
      "is_verified",
      "rating",
      "govt_id_proof",
      "business_license",
      "profile_photo_or_logo",
      "bank_account_holder_name",
      "bank_account_number",
      "bank_name",
      "branch_name",
      "swift_iban_code",
      "paypal_id_or_payoneer",
      "plant_types_sold",
      "years_of_experience",
      "preferred_language",
      "referral_code",
      "agree_terms_and_policy",
    ];

    // Process each field
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    });

    // Validate we have fields to update
    if (fields.length === 0) {
      throw new Error("No valid fields provided for update");
    }

    // Add updated_at

    // Execute query
    const query = `
      UPDATE sellers 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Seller not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw error; // Re-throw for controller to handle
  }
};

// Suspend seller account
export const suspendSeller = async (id) => {
  const result = await pool.query(
    `
    UPDATE sellers SET
      status = 'suspended',
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `,
    [id]
  );

  return result.rows[0];
};

// Delete seller account
export const deleteSeller = async (id) => {
  await pool.query("DELETE FROM sellers WHERE id = $1", [id]);
  return true;
};

// Create seller from admin panel
export const createSellerByAdmin = async (data) => {
  const {
    full_name,
    email,
    phone_number,
    password,
    business_name,
    business_type,
    business_registration_no,
    country,
    state,
    city,
    address,
    website_or_social_links,
    govt_id_proof,
    business_license,
    gst_vat_number,
    bank_account_holder_name,
    bank_account_number,
    bank_name,
    branch_name,
    swift_iban_code,
    paypal_id_or_payoneer,
    profile_photo_or_logo,
    business_description,
    plant_types_sold,
    years_of_experience,
    preferred_language,
    referral_code,
    agree_terms_and_policy,
  } = data;

  const res = await pool.query(
    `
    INSERT INTO sellers (
      full_name, email, phone_number, password, business_name, business_type,
      business_registration_no, country, state, city, address,
      website_or_social_links, govt_id_proof, business_license, gst_vat_number,
      bank_account_holder_name, bank_account_number, bank_name, branch_name,
      swift_iban_code, paypal_id_or_payoneer, profile_photo_or_logo,
      business_description, plant_types_sold, years_of_experience,
      preferred_language, referral_code, agree_terms_and_policy
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18, $19,
      $20, $21, $22,
      $23, $24, $25,
      $26, $27, $28
    ) RETURNING id
  `,
    [
      full_name,
      email,
      phone_number,
      password,
      business_name,
      business_type,
      business_registration_no,
      country,
      state,
      city,
      address,
      website_or_social_links,
      govt_id_proof,
      business_license,
      gst_vat_number,
      bank_account_holder_name,
      bank_account_number,
      bank_name,
      branch_name,
      swift_iban_code,
      paypal_id_or_payoneer,
      profile_photo_or_logo,
      business_description,
      plant_types_sold,
      years_of_experience,
      preferred_language,
      referral_code,
      agree_terms_and_policy,
    ]
  );

  return res.rows[0];
};
