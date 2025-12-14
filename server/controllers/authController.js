import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTP } from "../utils/sendMail.js";

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// REGISTER (Step 1: Send OTP)
export const register = async (req, res) => {
  try {
    const { name, lastname, email, password } = req.body;
    // Normalize and trim incoming values safely
    const nameTrim = name ? String(name).trim() : "";
    const lastnameTrim = lastname ? String(lastname).trim() : "";
    const emailTrim = email ? String(email).trim().toLowerCase() : "";
    const passwordTrim = password ? String(password) : "";

    // Log minimal request body for debugging (avoid logging passwords)
    console.log('Register request body:', {
      name: nameTrim || null,
      lastname: lastnameTrim || null,
      email: emailTrim || null,
    });

    // Validate required fields using trimmed values
    const missing = [];
    if (!nameTrim) missing.push('name');
    if (!lastnameTrim) missing.push('lastname');
    if (!emailTrim) missing.push('email');
    if (!passwordTrim) missing.push('password');
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Missing or empty fields: ${missing.join(', ')}` });
    }

    const hashedPassword = await bcrypt.hash(passwordTrim, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let isNewUser = false;
    let user = await User.findOne({ email: emailTrim });

    if (user) {
      // If user exists but is not verified
      if (!user.isVerified) {
        // keep a snapshot to revert if OTP send fails
        user.__prev = {
          name: user.name,
          lastname: user.lastname,
          password: user.password,
          otp: user.otp,
          otpExpires: user.otpExpires,
        };

        user.name = nameTrim;
        user.lastname = lastnameTrim;
        user.password = hashedPassword;
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();
      } else {
        // If user is already verified, block registration
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
    } else {
      // If user does not exist, create a new one
      isNewUser = true;
      user = await User.create({
        name: nameTrim,
        lastname: lastnameTrim,
        email: emailTrim,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false,
      });
    }

    try {
      await sendOTP(emailTrim, otp);
      res.status(201).json({ success: true, message: "OTP sent to your email.", userId: user._id });
    } catch (mailErr) {
      // If email sending fails, roll back changes for new users
      if (isNewUser) {
        await User.findByIdAndDelete(user._id);
      } else if (user.__prev) {
        // revert fields for existing unverified user
        user.name = user.__prev.name;
        user.lastname = user.__prev.lastname;
        user.password = user.__prev.password;
        user.otp = user.__prev.otp;
        user.otpExpires = user.__prev.otpExpires;
        delete user.__prev;
        await user.save();
      }

      console.error('sendOTP failed, changes rolled back:', mailErr && mailErr.message ? mailErr.message : mailErr);
      // Provide a helpful message if this appears to be SMTP auth error
      const isAuthError = /Invalid login|BadCredentials|Invalid user|EAUTH/.test(mailErr && mailErr.message ? mailErr.message : '');
      const clientMsg = isAuthError
        ? 'Could not send OTP: mail service authentication failed. Please check MAIL_USER and MAIL_PASS (use App Password or OAuth2 for Gmail).'
        : 'Could not send OTP. Please try again later.';

      return res.status(500).json({ success: false, message: clientMsg });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// VERIFY OTP (Step 2)
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: "User ID and OTP are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });

    if (user.otpExpires < new Date()) {
      // If OTP is expired, the user should be deleted so they can register again.
      await User.findByIdAndDelete(userId);
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = "";
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: "Account verified successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailNormalized = String(email).trim().toLowerCase();

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ email: emailNormalized });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.isVerified)
      return res.status(401).json({ success: false, message: "Please verify your email first" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass)
      return res.status(401).json({ success: false, message: "Incorrect password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        isAdmin: process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REFRESH TOKEN
export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: "User not found or not verified" });
    }

    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      token: newToken,
      user: {
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        isAdmin: process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL,
      },
    });
  } catch (err) {
    res.status(401).json({ success: false, message: "Token refresh failed" });
  }
};
