// models/adminSellerModel.js
import pool from "../db.js";

// Get seller statistics for admin dashboard
export const getSellerStatistics = async () => {
  const totalSellers = await pool.query("SELECT COUNT(*) FROM sellers");
  const activeSellers = await pool.query(
    "SELECT COUNT(*) FROM sellers WHERE status = 'active'"
  );
  const verifiedSellers = await pool.query(
    "SELECT COUNT(*) FROM sellers WHERE is_verified = true"
  );
  const pendingSellers = await pool.query(
    "SELECT COUNT(*) FROM sellers WHERE status = 'pending'"
  );
  const avgRating = await pool.query(
    "SELECT AVG(rating) FROM sellers WHERE rating > 0"
  );

  return {
    totalSellers: parseInt(totalSellers.rows[0].count),
    activeSellers: parseInt(activeSellers.rows[0].count),
    verifiedSellers: parseInt(verifiedSellers.rows[0].count),
    pendingSellers: parseInt(pendingSellers.rows[0].count),
    avgRating: parseFloat(avgRating.rows[0].avg) || 0,
  };
};

//! Get all sellers with pagination and filtering
export const getAllSellers = async (
  page = 1,
  limit = 10,
  status = null,
  search = ""
) => {
  const offset = (page - 1) * limit;

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

// Update seller details
export const updateSeller = async (id, data) => {
  const {
    full_name,
    business_name,
    email,
    phone_number,
    status,
    is_verified,
    rating,
    // Add other fields as needed
  } = data;

  const result = await pool.query(
    `
    UPDATE sellers SET
      full_name = $1,
      business_name = $2,
      email = $3,
      phone_number = $4,
      status = $5,
      is_verified = $6,
      rating = $7,
      updated_at = NOW()
    WHERE id = $8
    RETURNING *
  `,
    [
      full_name,
      business_name,
      email,
      phone_number,
      status,
      is_verified,
      rating,
      id,
    ]
  );

  return result.rows[0];
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
