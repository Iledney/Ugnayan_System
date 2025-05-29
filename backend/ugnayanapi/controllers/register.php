<?php

require_once(__DIR__ . '/../utils/response.php');
require_once(__DIR__ . '/../vendor/autoload.php');

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Label\Label;
use Endroid\QrCode\Label\Font\NotoSans;
use Endroid\QrCode\Label\Alignment\LabelAlignmentCenter;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class UserController extends GlobalUtil
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
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

            // Create QR code with modern styling
            $qr = QrCode::create($qrData)
                ->setSize(300)
                ->setMargin(10)
                ->setForegroundColor(new Color(80, 177, 124)) // #50b17c
                ->setBackgroundColor(new Color(255, 255, 255));

            // Generate QR code
            $qrFileName = uniqid() . '.png';
            $qrPath = $qrDir . $qrFileName;
            
            $writer = new PngWriter();
            $result = $writer->write($qr);
            $result->saveToFile($qrPath);
            
            $qrCode = $qrFileName;

            // Insert into database
            $query = "INSERT INTO $tableName
                (firstname, middlename, lastname, isAdmin, username, password, qr_code, verified)
                VALUES (:firstname, :middlename, :lastname, :isAdmin, :username, :password, :qr_code, :verified)";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                'firstname' => $firstname,
                'middlename' => $middlename,
                'lastname' => $lastname,
                'isAdmin' => $isAdmin,
                'username' => $username,
                'password' => $hashedPassword,
                'qr_code' => $qrCode,
                'verified' => true
            ]);

            return $this->sendResponse([
                'message' => 'User registered successfully.',
                'qr_code' => 'http://localhost/ugnayan_system/backend/ugnayanapi/uploads/qrcodes/' . $qrCode
            ], 200);
        } catch (\PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return $this->sendErrorResponse("Failed to register user: " . $e->getMessage(), 500);
        }
    }
} 