import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

export const registerSeller = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    console.log("headers:", req.headers["content-type"]);

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
      gst_vat_number,
      bank_account_holder_name,
      bank_account_number,
      bank_name,
      branch_name,
      swift_iban_code,
      paypal_id_or_payoneer,
      business_description,
      plant_types_sold,
      years_of_experience,
      preferred_language,
      referral_code,
    } = req.body;

    const agree = req.body.agree_terms_and_policy === "true";
    if (!agree)
      return res.status(400).json({ msg: "Must agree to terms and policy" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
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
        hashedPassword,
        business_name,
        business_type,
        business_registration_no,
        country,
        state,
        city,
        address,
        website_or_social_links,
        req.files.govt_id_proof?.[0]?.path,
        req.files.business_license?.[0]?.path || null,
        gst_vat_number,
        bank_account_holder_name,
        bank_account_number,
        bank_name,
        branch_name,
        swift_iban_code,
        paypal_id_or_payoneer,
        req.files.profile_photo?.[0]?.path,
        business_description,
        plant_types_sold.split(","),
        years_of_experience,
        preferred_language,
        referral_code,
        agree,
      ]
    );

    res.status(201).json({
      msg: "Seller registered successfully",
      sellerId: result.rows[0].id,
    });
  } catch (err) {
    res.status(500).json({ msg: "Registration failed", error: err.message });
  }
};

export const loginSeller = async (req, res) => {
  try {
    const { email_or_phone, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM sellers WHERE email = $1 OR phone_number = $1`,
      [email_or_phone]
    );

    const seller = result.rows[0];
    if (!seller) return res.status(404).json({ msg: "Seller not found" });

    const match = await bcrypt.compare(password, seller.password);
    if (!match) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, sellerId: seller.id });
  } catch (err) {
    res.status(500).json({ msg: "Login failed", error: err.message });
  }
};
