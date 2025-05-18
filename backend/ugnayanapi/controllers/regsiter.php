<?php

require_once(__DIR__ . '/../utils/response.php');
require_once(__DIR__ . '/../vendor/autoload.php');

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class UserController extends GlobalUtil
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    private function sendOTPEmail($username, $otp) {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com'; // Replace with your SMTP host
            $mail->SMTPAuth = true;
            $mail->Username = 'your-email@gmail.com'; // Replace with your email
            $mail->Password = 'your-app-password'; // Replace with your app password
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            // Recipients
            $mail->setFrom('your-email@gmail.com', 'Ugnayan System');
            $mail->addAddress($username); // Using username as email

            // Content
            $mail->isHTML(true);
            $mail->Subject = 'Your Ugnayan Account Verification Code';
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #50b17c;'>Welcome to Ugnayan!</h2>
                    <p>Thank you for registering. Please use the following code to verify your account:</p>
                    <div style='background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;'>
                        <h1 style='color: #2c3e50; margin: 0; letter-spacing: 5px;'>{$otp}</h1>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                    <hr style='border: 1px solid #eee; margin: 20px 0;'>
                    <p style='color: #666; font-size: 12px;'>This is an automated message, please do not reply.</p>
                </div>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Email sending failed: " . $mail->ErrorInfo);
            return false;
        }
    }

    public function registerUser($data)
    {
        try {
            $tableName = 'users';

            // Validate form fields
            $firstname = trim($data->firstname ?? '');
            $middlename = trim($data->middlename ?? '');
            $lastname = trim($data->lastname ?? '');
            $isAdmin = isset($data->isAdmin) ? (int)$data->isAdmin : 0;
            $username = trim($data->username ?? '');
            $password = trim($data->password ?? '');

            if (empty($firstname) || empty($lastname) || empty($username) || empty($password)) {
                return $this->sendErrorResponse("Missing required fields", 400);
            }

            // Generate random 6-digit OTP
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

            // Generate QR code
            $qrCode = '';
            $qrDir = __DIR__ . '/../uploads/qrcodes/';
            if (!file_exists($qrDir)) {
                mkdir($qrDir, 0777, true);
            }

            $qrData = json_encode([
                'username' => $username,
                'firstname' => $firstname,
                'lastname' => $lastname
            ]);

            $qr = QrCode::create($qrData);
            $writer = new PngWriter();
            $qrResult = $writer->write($qr);
            $qrFileName = uniqid() . '.png';
            $qrPath = $qrDir . $qrFileName;
            $qrResult->saveToFile($qrPath);
            $qrCode = $qrFileName;

            // Insert into database
            $query = "INSERT INTO $tableName
                (firstname, middlename, lastname, isAdmin, username, password, qr_code, otp, verified)
                VALUES (:firstname, :middlename, :lastname, :isAdmin, :username, :password, :qr_code, :otp, :verified)";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                'firstname' => $firstname,
                'middlename' => $middlename,
                'lastname' => $lastname,
                'isAdmin' => $isAdmin,
                'username' => $username,
                'password' => $hashedPassword,
                'qr_code' => $qrCode,
                'otp' => $otp,
                'verified' => false
            ]);

            // Send OTP email
            if (!$this->sendOTPEmail($username, $otp)) {
                // If email sending fails, delete the user record
                $this->pdo->exec("DELETE FROM $tableName WHERE username = '$username'");
                return $this->sendErrorResponse("Failed to send verification email", 500);
            }

            return $this->sendResponse([
                'message' => 'User registered successfully. Please check your email for verification code.',
                'qr_code' => 'http://localhost/ugnayan_system/backend/ugnayanapi/uploads/qrcodes/' . $qrCode
            ], 200);
        } catch (\PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return $this->sendErrorResponse("Failed to register user: " . $e->getMessage(), 500);
        }
    }
}
