-- ================================================
-- DATABASE SETUP: nhom4_baitap
-- Chức năng: Quên mật khẩu + OTP
-- ================================================

CREATE DATABASE IF NOT EXISTS nhom4_baitap 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE nhom4_baitap;

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    department VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng otps (lưu OTP quên mật khẩu + OTP kích hoạt tài khoản)
CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    type ENUM('forgot_password', 'activation') DEFAULT 'forgot_password',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_email_otp (email, otp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- Dữ liệu mẫu để test
-- ================================================

-- Mật khẩu: 'password123' (đã băm bằng bcrypt)
INSERT INTO users (name, email, password, role, department, is_active) VALUES
('Admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHerry', 'admin', 'IT', 1),
('Test User', 'user@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHerry', 'user', 'HR', 1);

-- Ghi chú: Thêm email thật của bạn vào đây để test gửi OTP
-- INSERT INTO users (name, email, password, role, is_active) VALUES
-- ('Tên Bạn', 'email_cua_ban@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHerry', 'user', 1);

-- ================================================
-- Cấu hình tham số thuế và bảo hiểm
-- ================================================
CREATE TABLE IF NOT EXISTS tax_insurance_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    social_insurance_rate FLOAT DEFAULT 8.0,
    health_insurance_rate FLOAT DEFAULT 1.5,
    unemployment_insurance_rate FLOAT DEFAULT 1.0,
    base_salary DECIMAL(15, 2) DEFAULT 2340000.00,
    max_insurance_salary DECIMAL(15, 2) DEFAULT 46800000.00,
    personal_deduction DECIMAL(15, 2) DEFAULT 11000000.00,
    dependent_deduction DECIMAL(15, 2) DEFAULT 4400000.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Thêm dữ liệu mặc định ban đầu (chỉ 1 dòng)
INSERT INTO tax_insurance_configs (id) VALUES (1) ON DUPLICATE KEY UPDATE id=1;
