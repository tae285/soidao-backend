-- ===============================
-- ตารางข่าว (News)
-- ===============================
CREATE TABLE news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  images JSON,             -- เก็บ array ของ path รูป
  pdf VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ตารางบุคลากร (Staff)
-- ===============================
CREATE TABLE staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  department VARCHAR(255),
  photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ตารางดาวน์โหลด (Downloads)
-- ===============================
CREATE TABLE downloads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ตารางจัดซื้อจัดจ้าง (Procurement)
-- ===============================
CREATE TABLE procurement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  files JSON,             -- เก็บ array ของไฟล์
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ตารางกิจกรรม/ประชาสัมพันธ์ (Activities)
-- ===============================
CREATE TABLE activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  images JSON,
  pdf VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ตารางรับสมัครงาน (Jobs)
-- ===============================
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ตารางผู้ใช้งานระบบ (Users)
-- ===============================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','USER') DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ตารางการบริจาค (Donate)
-- ===============================
CREATE TABLE donate (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_name VARCHAR(255),
  amount DECIMAL(12,2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ตาราง ITA (ธรรมาภิบาล)
-- ===============================
CREATE TABLE ita (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
