import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { initialWardInfo, initialHouseholds, initialAlerts } from "./src/initialData";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const USERS_DB_PATH = path.join(process.cwd(), "users_database.json");
const WARD_INFO_DB_PATH = path.join(process.cwd(), "ward_info_database.json");
const HOUSEHOLDS_DB_PATH = path.join(process.cwd(), "households_database.json");
const ALERTS_DB_PATH = path.join(process.cwd(), "alerts_database.json");

// Load Firebase configuration
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Security constants
const PASSWORD_SALT = "ward_health_secure_salt_2026";
const JWT_SECRET = process.env.JWT_SECRET || "ward_system_secret_key_2026_salt";

function hashPassword(password: string): string {
  if (/^[a-f0-9]{64}$/i.test(password)) {
    return password;
  }
  return crypto.createHmac("sha256", PASSWORD_SALT).update(password).digest("hex");
}

function verifyPass(input: string, stored: string): boolean {
  const inputHash = hashPassword(input);
  return stored === inputHash || stored === input;
}

function generateAuthToken(user: { email: string; role: string; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      email: user.email.toLowerCase(),
      role: user.role,
      name: user.name,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function verifyAuthToken(token: string): { email: string; role: string; name: string } | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64url");
    if (signature !== expectedSignature) return null;
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (decodedPayload.exp < Date.now()) {
      return null;
    }
    return decodedPayload;
  } catch (err) {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  user?: { email: string; role: string; name: string };
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }
  return res.status(401).json({ error: "Yêu cầu xác thực không hợp lệ hoặc đã hết hạn." });
}

function adminOnlyMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (req.user && req.user.role === "admin") {
      return next();
    }
    return res.status(403).json({ error: "Quyền truy cập bị từ chối. Chỉ dành cho Quản trị viên." });
  });
}

const defaultUsers = [
  { name: 'BS. Nguyễn Văn An', email: 'nvan@moh.gov.vn', password: hashPassword('canbo123'), role: 'officer', title: 'Trưởng Trạm Y Tế Phường', status: 'approved', phone: '0901234567', cccd: '079012345678', vneidPassword: 'vneid123An' },
  { name: 'CN. Lê Thị Bình', email: 'ltbinh@moh.gov.vn', password: hashPassword('canbo123'), role: 'officer', title: 'Cán bộ dịch tễ trạm', status: 'approved', phone: '0912112233', cccd: '079087654321', vneidPassword: 'vneid123Binh' },
  { name: 'Quản trị viên Hệ thống', email: 'admin@moh.gov.vn', password: hashPassword('admin123'), role: 'admin', title: 'Admin Cấp Cao', status: 'approved', phone: '0988888888', cccd: '079000000000', vneidPassword: 'adminVneid' }
];

async function getWardInfoAsync(): Promise<any> {
  try {
    const docRef = doc(firestoreDb, "ward", "current_ward");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Auto-seed Firebase Firestore on first read
      await setDoc(docRef, initialWardInfo);
      return initialWardInfo;
    }
  } catch (err) {
    console.error("Error reading ward info from Firestore, falling back to disk/default:", err);
  }
  try {
    if (fs.existsSync(WARD_INFO_DB_PATH)) {
      const content = fs.readFileSync(WARD_INFO_DB_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {}
  return initialWardInfo;
}

async function saveWardInfoAsync(data: any): Promise<void> {
  try {
    const docRef = doc(firestoreDb, "ward", "current_ward");
    await setDoc(docRef, data);
  } catch (err) {
    console.error("Error writing ward info to Firestore:", err);
  }
  try {
    fs.writeFileSync(WARD_INFO_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {}
}

async function getHouseholdsAsync(): Promise<any[]> {
  try {
    const docRef = doc(firestoreDb, "households_data", "main_list");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const payload = docSnap.data();
      if (payload && Array.isArray(payload.list)) {
        return payload.list;
      }
    } else {
      // Auto-seed Firebase Firestore on first read
      await setDoc(docRef, { list: initialHouseholds });
      return initialHouseholds;
    }
  } catch (err) {
    console.error("Error reading households from Firestore, falling back to disk/default:", err);
  }
  try {
    if (fs.existsSync(HOUSEHOLDS_DB_PATH)) {
      const content = fs.readFileSync(HOUSEHOLDS_DB_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {}
  return initialHouseholds;
}

async function saveHouseholdsAsync(data: any[]): Promise<void> {
  try {
    const docRef = doc(firestoreDb, "households_data", "main_list");
    await setDoc(docRef, { list: data });
  } catch (err) {
    console.error("Error writing households to Firestore:", err);
  }
  try {
    fs.writeFileSync(HOUSEHOLDS_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {}
}

async function getAlertsAsync(): Promise<any[]> {
  try {
    const docRef = doc(firestoreDb, "alerts_data", "main_list");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const payload = docSnap.data();
      if (payload && Array.isArray(payload.list)) {
        return payload.list;
      }
    } else {
      // Auto-seed Firebase Firestore on first read
      await setDoc(docRef, { list: initialAlerts });
      return initialAlerts;
    }
  } catch (err) {
    console.error("Error reading alerts from Firestore, falling back to disk/default:", err);
  }
  try {
    if (fs.existsSync(ALERTS_DB_PATH)) {
      const content = fs.readFileSync(ALERTS_DB_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {}
  return initialAlerts;
}

async function saveAlertsAsync(data: any[]): Promise<void> {
  try {
    const docRef = doc(firestoreDb, "alerts_data", "main_list");
    await setDoc(docRef, { list: data });
  } catch (err) {
    console.error("Error writing alerts to Firestore:", err);
  }
  try {
    fs.writeFileSync(ALERTS_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {}
}

async function getUsersAsync(): Promise<any[]> {
  let list: any[] = [];
  try {
    const docRef = doc(firestoreDb, "users_data", "main_list");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const payload = docSnap.data();
      if (payload && Array.isArray(payload.list)) {
        list = payload.list;
      }
    } else {
      // Check first if files exist on local fallback to prevent losing previous register data
      let initialDataVal = defaultUsers;
      if (fs.existsSync(USERS_DB_PATH)) {
        try {
          const content = fs.readFileSync(USERS_DB_PATH, "utf-8");
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            initialDataVal = parsed;
          }
        } catch (e) {}
      }
      list = initialDataVal;
    }
  } catch (err) {
    console.error("Error reading users from Firestore, falling back to disk/default:", err);
    if (fs.existsSync(USERS_DB_PATH)) {
      try {
        const content = fs.readFileSync(USERS_DB_PATH, "utf-8");
        list = JSON.parse(content);
      } catch (e) {}
    }
  }

  if (!list || list.length === 0) {
    list = defaultUsers;
  }

  // Auto-hash any legacy plain text passwords in the read payload for database hardening
  let updated = false;
  const migratedList = list.map(u => {
    const hashed = hashPassword(u.password);
    if (u.password !== hashed) {
      updated = true;
      return { ...u, password: hashed };
    }
    return u;
  });

  if (updated) {
    try {
      await saveUsersAsync(migratedList);
    } catch (e) {
      console.error("Migrated accounts silent hashing error:", e);
    }
  }

  return migratedList;
}

async function saveUsersAsync(users: any[]): Promise<void> {
  // Ensure we hash any unhashed passwords in the saved database
  const securedUsers = users.map(u => ({
    ...u,
    password: hashPassword(u.password)
  }));
  try {
    const docRef = doc(firestoreDb, "users_data", "main_list");
    await setDoc(docRef, { list: securedUsers });
  } catch (err) {
    console.error("Error writing users database to Firestore:", err);
  }
  try {
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(securedUsers, null, 2), "utf-8");
  } catch (err) {}
}

// User accounts management APIs (Protected: Admin Only)
app.get("/api/users", adminOnlyMiddleware, async (req, res) => {
  try {
    const users = await getUsersAsync();
    // CRITICAL SECURITY ENFORCEMENT: Never return password hashes over the wire!
    const sanitized = users.map(u => ({
      name: u.name,
      email: u.email,
      role: u.role,
      title: u.title,
      status: u.status,
      phone: u.phone,
      createdAt: u.createdAt,
      cccd: u.cccd || "",
      vneidPassword: u.vneidPassword || ""
    }));
    res.json(sanitized);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users", adminOnlyMiddleware, async (req, res) => {
  try {
    const requestedUsers = req.body;
    if (!Array.isArray(requestedUsers)) {
      return res.status(400).json({ error: "Thành phần dữ liệu tài khoản y tế không hợp lệ." });
    }

    // Merge existing password hashes so we don't overwrite them with undefined or sanitized fields!
    const currentUsersInDb = await getUsersAsync();
    const mergedUsers = requestedUsers.map(ru => {
      const dbMatch = currentUsersInDb.find(cu => cu.email.toLowerCase() === ru.email.toLowerCase().trim());
      return {
        ...ru,
        password: dbMatch ? dbMatch.password : hashPassword('canbo123') // Preserve or fallback securely
      };
    });

    await saveUsersAsync(mergedUsers);
    res.json({ success: true, count: mergedUsers.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/users/:email", adminOnlyMiddleware, async (req, res) => {
  try {
    const emailToDelete = req.params.email.toLowerCase().trim();
    const authReq = req as AuthenticatedRequest;
    if (authReq.user && authReq.user.email.toLowerCase() === emailToDelete) {
      return res.status(400).json({ error: "Không được tự xóa tài khoản Quản trị viên của chính bạn." });
    }

    const currentUsers = await getUsersAsync();
    const userExists = currentUsers.some(u => u.email.toLowerCase() === emailToDelete);
    if (!userExists) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản cán bộ này." });
    }

    const updatedUsers = currentUsers.filter(u => u.email.toLowerCase() !== emailToDelete);
    await saveUsersAsync(updatedUsers);

    res.json({ success: true, message: `Đã xóa thành công tài khoản cán bộ ${emailToDelete} khỏi hệ thống.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Authentication and session creation public endpoints
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ Email và Mật khẩu cán bộ." });
    }

    const users = await getUsersAsync();
    const match = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (match) {
      if (verifyPass(password, match.password)) {
        if (match.status === "pending") {
          return res.status(403).json({
            error: "Tài khoản cán bộ này đang chờ Quản trị viên trạm phê duyệt. Vui lòng liên hệ Admin!"
          });
        }

        const token = generateAuthToken(match);
        return res.json({
          success: true,
          token,
          user: {
            name: match.name,
            email: match.email,
            role: match.role
          }
        });
      }
    }
    return res.status(401).json({ error: "Sai tên đăng nhập hoặc mật khẩu cán bộ. Vui lòng kiểm tra lại!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/vneid-login", async (req, res) => {
  try {
    const { cccd, vneidPassword } = req.body;
    if (!cccd || !vneidPassword) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ Số định danh cá nhân (CCCD) và Mật khẩu VNeID." });
    }

    const cleanedCccd = cccd.replace(/\s+/g, "").trim();
    const users = await getUsersAsync();
    
    // Find matching user with cccd and vneidPassword
    const match = users.find(u => {
      const userCccd = (u.cccd || "").replace(/\s+/g, "").trim();
      const userVneidPass = (u.vneidPassword || "").trim();
      return userCccd === cleanedCccd && userVneidPass === vneidPassword;
    });

    if (match) {
      if (match.status === "pending") {
        return res.status(403).json({
          error: "Tài khoản liên thông định danh này đang chờ Quản trị viên trạm phê duyệt. Vui lòng liên hệ Admin!"
        });
      }

      const token = generateAuthToken(match);
      return res.json({
        success: true,
        token,
        user: {
          name: match.name,
          email: match.email,
          role: match.role
        }
      });
    }

    return res.status(401).json({ error: "Mã định danh cá nhân CCCD hoặc mật khẩu định danh VNeID không chính xác." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone, title, cccd, vneidPassword } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Họ và tên, Email, Mật khẩu cán bộ là bắt buộc." });
    }

    if (!email.toLowerCase().endsWith("@moh.gov.vn")) {
      return res.status(400).json({
        error: "Yêu cầu đăng ký bằng hòm thư điện tử công vụ của Bộ Y tế (@moh.gov.vn) để đảm bảo an toàn bảo mật."
      });
    }

    const users = await getUsersAsync();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      return res.status(400).json({ error: "Email công vụ này đã được đăng ký trên hệ thống." });
    }

    const newUser = {
      name,
      email: email.toLowerCase().trim(),
      password: hashPassword(password),
      role: "officer",
      title: title || "Cán bộ Y tế",
      status: "pending",
      phone: phone || "N/A",
      cccd: cccd || "",
      vneidPassword: vneidPassword || "",
      createdAt: new Date().toISOString()
    };

    const updatedDb = [...users, newUser];
    await saveUsersAsync(updatedDb);

    res.json({ success: true, name: newUser.name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body;
    if (!email || !phone || !newPassword) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ Email công vụ, Số điện thoại và Mật khẩu mới." });
    }

    const users = await getUsersAsync();
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    const userIndex = users.findIndex(u => u.email.toLowerCase() === cleanEmail);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản cán bộ với email này." });
    }

    const user = users[userIndex];

    // Check if phone matches (strip non-digits for resilience)
    const dbPhoneDigits = (user.phone || "").replace(/\D/g, "");
    const paramPhoneDigits = cleanPhone.replace(/\D/g, "");

    if (dbPhoneDigits !== paramPhoneDigits && user.phone !== cleanPhone) {
      return res.status(400).json({ error: "Số điện thoại xác nhận không khớp với số hồ sơ đã đăng ký." });
    }

    // Allow password updates for approved accounts
    users[userIndex].password = hashPassword(newPassword);
    await saveUsersAsync(users);

    res.json({ 
      success: true, 
      message: `Cấp lại mật khẩu thành công cán bộ ${user.name}. Hãy dùng mật khẩu mới này để đăng nhập.` 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ward stats & households data persistence APIs
app.get("/api/ward-info", async (req, res) => {
  try {
    const ward = await getWardInfoAsync();
    res.json(ward);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ward-info", authMiddleware, async (req, res) => {
  try {
    await saveWardInfoAsync(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/households", async (req, res) => {
  try {
    const households = await getHouseholdsAsync();
    res.json(households);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/households", authMiddleware, async (req, res) => {
  try {
    await saveHouseholdsAsync(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await getAlertsAsync();
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/alerts", authMiddleware, async (req, res) => {
  try {
    await saveAlertsAsync(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lazy-initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Zalo Cloud OpenAPI Proxy Endpoint for template OTP messages
app.post("/api/zalo/send-otp", async (req, res) => {
  try {
    const { phone, otp, accessToken, templateId } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ 
        success: false, 
        error: "Thiếu số điện thoại hoặc mã OTP." 
      });
    }

    const finalAccessToken = accessToken || process.env.ZALO_ACCESS_TOKEN || "DEFAULT_DEMO_TOKEN";
    const finalTemplateId = templateId || process.env.ZALO_TEMPLATE_ID || "DEFAULT_DEMO_TEMPLATE_ID";

    // Normalize phone numbers to Zalo format (typically starts with country code 84, strip leading 0)
    let normalizedPhone = phone.trim().replace(/\s+/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "84" + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith("84")) {
      normalizedPhone = "84" + normalizedPhone;
    }

    const payload = {
      phone: normalizedPhone,
      template_id: finalTemplateId,
      template_data: {
        otp: otp
      }
    };

    console.log("Sending Zalo OTP payload:", JSON.stringify(payload, null, 2));

    let responseData = null;
    let isRealSuccess = false;
    let errorDetail = null;

    const isDemoToken = finalAccessToken === "DEFAULT_DEMO_TOKEN" || finalAccessToken.trim() === "" || finalAccessToken.startsWith("YOUR_");
    const isDemoTemplate = finalTemplateId === "DEFAULT_DEMO_TEMPLATE_ID" || finalTemplateId.trim() === "" || finalTemplateId.startsWith("YOUR_");

    if (!isDemoToken && !isDemoTemplate) {
      try {
        const response = await axios.post(
          "https://business.openapi.zalo.me/message/template",
          payload,
          {
            headers: {
              access_token: finalAccessToken
            },
            timeout: 10000 // 10s timeout
          }
        );
        responseData = response.data;
        // Zalo returns error code inside response.data.error. E.g., error 0 indicates success
        if (responseData && (responseData.error === 0 || responseData.error === "0")) {
          isRealSuccess = true;
        } else {
          errorDetail = responseData?.message || `Mã lỗi Zalo: ${responseData?.error}`;
        }
      } catch (err: any) {
        console.error("Zalo API execution failed:", err.message);
        errorDetail = err.response?.data || err.message;
      }
    } else {
      errorDetail = "Hệ thống đang chạy ở chế độ mô phỏng kiểm thử. Vui lòng cập nhật Zalo Access Token và Template ID thực tế để liên thông.";
    }

    res.json({
      success: true,
      isRealZaloSent: isRealSuccess,
      zaloResponse: responseData,
      errorDetail: errorDetail,
      sentData: {
        phone: phone,
        otp: otp,
        normalizedPhone: payload.phone,
        templateId: finalTemplateId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper checking vaccine status & calculating due models
function analyzeVaccinesForAI(patientContext: any) {
  const defaultVaccines = [
    "Lao (BCG)",
    "Bạch hầu - Ho gà - Uốn ván",
    "Sởi - Quai bị - Rubella",
    "Viêm gan B",
    "Viêm não Nhật Bản",
    "Thủy đậu (Varicella)",
    "Phế cầu khuẩn",
    "Cúm mùa (Hàng năm)",
    "COVID-19 (Mũi cơ bản)",
    "COVID-19 (Mũi nhắc lại)"
  ];

  if (!patientContext.dob) return { dueList: [], missingList: [] };

  const dobDate = new Date(patientContext.dob);
  const curDate = new Date("2026-05-22");
  
  let ageInMonths = (curDate.getFullYear() - dobDate.getFullYear()) * 12 + (curDate.getMonth() - dobDate.getMonth());
  if (curDate.getDate() < dobDate.getDate()) {
    ageInMonths--;
  }
  const ageInYears = ageInMonths / 12;

  const dueList: string[] = [];
  const missingList: string[] = [];

  const getStatus = (name: string) => {
    const found = patientContext.vaccines?.find((v: any) => v.name === name);
    return found ? found.status : 'none';
  };

  const getLastDate = (name: string) => {
    const found = patientContext.vaccines?.find((v: any) => v.name === name);
    return found ? found.dateAdministered : undefined;
  };

  defaultVaccines.forEach(vName => {
    const status = getStatus(vName);
    const dateAdministered = getLastDate(vName);

    if (status === 'fully') {
      if (vName === "Cúm mùa (Hàng năm)" && dateAdministered) {
        const lastDate = new Date(dateAdministered);
        const diffYears = (curDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (diffYears >= 1.0) {
          dueList.push(`${vName} (Mũi cuối đã tiêm ngày ${dateAdministered}, quá hạn nhắc hàng năm)`);
        }
      }
      return;
    }

    if (vName === "Lao (BCG)") {
      if (status === 'partial') {
        dueList.push(`${vName} (Cần bổ sung liều nhắc gấp)`);
      } else if (ageInYears <= 1/12) {
        dueList.push(`${vName} (Dưới 1 tháng tuổi đến hạn tiêm chủng Lao cơ bản)`);
      } else {
        missingList.push(vName);
      }
    }
    else if (vName === "Viêm gan B") {
      if (status === 'partial') {
        dueList.push(`${vName} (Đến hạn tiêm nhắc)`);
      } else if (ageInYears <= 1.0) {
        dueList.push(`${vName} (Sơ sinh đến hạn phác đồ 3 mũi cơ bản)`);
      } else {
        missingList.push(vName);
      }
    }
    else if (vName === "Bạch hầu - Ho gà - Uốn ván") {
      if (status === 'partial') {
        dueList.push(`${vName} (Đến hạn tiêm nhắc tiếp theo)`);
      } else if (ageInYears <= 6.0) {
        dueList.push(`${vName} (Đạt tuổi mầm non/học đường cần bảo vệ cấp tính)`);
      } else {
        missingList.push(vName);
      }
    }
    else if (vName === "Sởi - Quai bị - Rubella") {
      if (status === 'partial') {
        dueList.push(`${vName} (Đến hạn mũi 2 sởi kết hợp phòng dịch học đường)`);
      } else if (ageInMonths >= 9 && ageInYears <= 6.0) {
        dueList.push(`${vName} (Trẻ từ 9 tháng đạt mốc tiêm sởi cơ bản đột phá)`);
      } else if (ageInMonths >= 9) {
        missingList.push(vName);
      }
    }
    else if (vName === "Viêm não Nhật Bản") {
      if (status === 'partial') {
        dueList.push(`${vName} (Chưa hoàn thành đủ liều bảo vệ viêm màng não)`);
      } else if (ageInYears >= 1.0 && ageInYears <= 15) {
        dueList.push(`${vName} (Đến tuổi tiêm phòng chủng Nhật Bản)`);
      } else if (ageInYears >= 1.0) {
        missingList.push(vName);
      }
    }
    else if (vName === "Thủy đậu (Varicella)") {
      if (status === 'partial') {
        dueList.push(`${vName} (Đến hạn mũi 2 thủy đậu sau mũi một 3 tháng)`);
      } else if (ageInYears >= 1.0 && ageInYears <= 18) {
        dueList.push(`${vName} (Học sinh/sinh viên nguy cơ bùng phát dịch thủy đậu)`);
      } else if (ageInYears >= 1.0) {
        missingList.push(vName);
      }
    }
    else if (vName === "Phế cầu khuẩn") {
      if (status === 'partial') {
        dueList.push(`${vName} (Chưa tiêm đủ mũi nhắc bảo trì phổi)`);
      } else if ((ageInMonths >= 2 && ageInYears <= 5) || ageInYears >= 60) {
        dueList.push(`${vName} (Đến hạn tiêm phòng phế cầu khuẩn tránh viêm phổi nặng)`);
      } else if (ageInMonths >= 2) {
        missingList.push(vName);
      }
    }
    else if (vName === "Cúm mùa (Hàng năm)") {
      dueList.push(`${vName} (Đến lịch tái chủng ngừa hàng năm bảo vệ đường hô hấp)`);
    }
    else if (vName === "COVID-19 (Mũi cơ bản)") {
      if (status === 'partial') {
        dueList.push(`${vName} (Trễ liều cơ bản 2 chống virus)`);
      } else if (ageInYears >= 5.0) {
        dueList.push(`${vName} (Chưa tiêm mũi cơ bản COVID-19 nào)`);
      }
    }
    else if (vName === "COVID-19 (Mũi nhắc lại)") {
      if (status === 'partial') {
        dueList.push(`${vName} (Đến hạn tiêm mũi nhắc lại tăng cường)`);
      } else if (ageInYears >= 12.0) {
        if (getStatus("COVID-19 (Mũi cơ bản)") === 'fully') {
          dueList.push(`${vName} (Đầy đủ mũi cơ bản, đến hạn tiêm bổ sung tăng cường định kỳ)`);
        } else {
          missingList.push(vName);
        }
      }
    }
  });

  return { dueList, missingList };
}

// AI Chatbot Consultant API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, patientContext, wardContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGenAIClient();

    // Build the system instructions based on y tế phường (community health management)
    let systemInstruction = `Bạn là Trợ lý Y tế Trí tuệ Nhân tạo thuộc Hệ thống Quản lý Sức khỏe Hộ gia đình của Phường (công cụ y tế thông minh cho người dân và cán bộ y tế phường).
Nhiệm vụ của bạn:
1. Cung cấp tư vấn chăm sóc sức khỏe ban đầu, chế độ ăn uống, tập luyện, tiêm chủng, và phòng ngừa dịch bệnh dựa trên thông tin hồ sơ sức khỏe và chỉ số y tế được cung cấp.
2. Đọc hiểu các chỉ số y tế cơ bản của Việt Nam: Huyết áp (mmHg), Đường huyết lúc đói (mmol/L hoặc mg/dL), BMI (Chiều cao/Cân nặng), Nhóm máu. 
   - Đánh giá huyết áp: Bình thường (< 120/80), Tiền cao huyết áp (120-139 / 80-89), Cao huyết áp độ 1 (140-159 / 90-99), Cao huyết áp độ 2 (>= 160/100).
   - Đánh giá đường huyết fasting bình thường là < 5.6 mmol/L. Tiền tiểu đường: 5.6 - 6.9 mmol/L. Tiểu đường: >= 7.0 mmol/L.
   - Đánh giá BMI nam/nữ người Châu Á (chuẩn IDI&WPRO): Gầy (<18.5), Bình thường (18.5 - 22.9), Thừa cân (23.0 - 24.9), Béo phì (>= 25.0).
3. Đưaa ra các khuyến cáo bám sát hướng dẫn y khoa của Bộ Y Tế Việt Nam. Luôn khuyến cáo người dân liên hệ trung tâm y tế phường hoặc bệnh viện quận khi có dấu hiệu nguy kịch hoặc bất thường nghiêm trọng.
4. KHÔNG kê đơn thuốc cụ thể, chỉ nêu hướng điều trị chung và khuyến nghị thay đổi lối sống.
5. Cực kỳ lịch sự, chu đáo, dễ hiểu, sử dụng thuật ngữ y học phổ thông thân thiện với người dân.
6. HỖ TRỢ XÂY DỰNG LỊCH NHẮC NHỞ TIÊM CHỦNG VIỆT NAM THÔNG MINH:
   Khi người dùng/cộng tác viên yêu cầu "lên lịch nhắc tiêm chủng", "lịch hẹn tiêm phòng", "nhắc tiêm vắc-xin", hoặc tư vấn lịch chủng ngừa của thành viên đang chọn, bạn BẮT BUỘC PHẢI:
   - Dựa vào phần "Phân tích vắc-xin tự động dựa trên hồ sơ" bên dưới để liệt kê cực kỳ chi tiết các mũi Đến hạn/Khẩn cấp cần tiêm và các mũi Chưa từng tiêm.
   - Tạo một LỊCH NHẮC NHỞ TIÊM CHỦNG ĐỊNH KỲ dưới dạng BẢNG BIỂU (Markdown Table) gồm các cột: Tên vắc-xin | Trạng thái (Đến hạn / Chưa tiêm) | Khoảng cách tối thiểu/Độ tuổi khuyên dùng | Thời điểm khuyến nghị dự kiến (trong năm 2026 cụ thể theo ngày sinh) | Lưu ý quan trọng & Địa chi phòng tiêm chủng phường.
   - Cung cấp một MẪU TIN NHẮN NHẮC NHỞ (SMS/Zalo/Thông báo) mẫu hoàn chỉnh mà Trạm y tế Phường có thể sao chép để gửi trực tiếp cho hộ gia đình đó. Ví dụ: "[Trạm Y tế Phường Tân Hưng] Nhắc nhở tiêm chủng: Thành viên Nguyễn Lê Minh Trí đến hạn tiêm vắc-xin..."`;

    if (patientContext) {
      const vaccineAnalysis = analyzeVaccinesForAI(patientContext);
      systemInstruction += `\n\nThông tin người dân đang được tham vấn:
- Họ tên: ${patientContext.fullName}
- Quan hệ với chủ hộ: ${patientContext.relationship}
- Giới tính: ${patientContext.gender}
- Ngày sinh: ${patientContext.dob}
- Nhóm máu: ${patientContext.bloodType}
- Chỉ số hiện tại: Chiều cao ${patientContext.height}cm, Cân nặng ${patientContext.weight}kg, Huyết áp ${patientContext.bloodPressureSys}/${patientContext.bloodPressureDia} mmHg, Đường huyết lúc đói ${patientContext.bloodSugar} mmol/L.
- Bệnh lý nền: ${patientContext.chronicConditions.join(", ") || "Không có"}
- Lịch sử tiêm chủng đã có: ${patientContext.vaccines.map((v: any) => `${v.name} (${v.status === 'fully' ? 'Đã tiêm đủ' : v.status === 'partial' ? 'Tiêm một phần' : 'Chưa tiêm'})`).join(", ")}
- Phân tích vắc-xin tự động dựa trên lứa tuổi & hồ sơ hiện có:
  + Mũi khuyến cáo CẦN TIÊM NGAY / ĐẾN HẠN: ${vaccineAnalysis.dueList.join("; ") || "Không có mũi nào quá hạn"}
  + Mũi chưa từng tiêm (CHƯA KHỞI ĐỘNG): ${vaccineAnalysis.missingList.join("; ") || "Không có mũi trống cứu hộ"}
- Ghi chú bệnh sử hiện có: ${patientContext.notes || "Không có"}`;
    }

    if (wardContext) {
      systemInstruction += `\n\nThông tin tình hình dịch tễ của phường hiện tại (${wardContext.wardName}):
- Các ổ dịch hoạt động: ${wardContext.activeAlerts.map(a => `${a.type} tại ${a.location} - mức cảnh báo ${a.riskLevel} (${a.casesCount} ca)`).join("; ") || "An toàn, chưa ghi nhận dịch bệnh"}
- Điện thoại trung tâm y tế phường: ${wardContext.healthCenterPhone}
- Địa chỉ trung tâm y tế phường: ${wardContext.healthCenterAddress}`;
    }

    systemInstruction += `\n\nHãy trả lời câu hỏi của người dùng một cách trực quan, mạch lạc bằng Markdown Tiếng Việt.`;

    // Map history to Google GenAI contents framework if exists
    // Format: [{ role: 'user', parts: [{ text: '...' }] }, { role: 'model', parts: [{ text: '...' }] }]
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Đã xảy ra lỗi khi kết nối với trợ lý AI" });
  }
});

// Start server containing Vite middleware or static server
async function boot() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on http://localhost:${PORT}`);
  });
}

boot();
