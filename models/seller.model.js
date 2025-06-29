import pool from "../db.js";

export const getSellerByEmailOrPhone = async (emailOrPhone) => {
  const res = await pool.query(
    `SELECT * FROM sellers WHERE email = $1 OR phone_number = $1`,
    [emailOrPhone]
  );
  return res.rows[0];
};

export const createSeller = async (data) => {
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
