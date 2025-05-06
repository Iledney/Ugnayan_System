<?php

require_once(__DIR__ . '/../utils/response.php');
require_once(__DIR__ . '/../vendor/autoload.php');

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

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

            // Generate QR code (e.g., for user ID or username)
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
                (firstname, middlename, lastname, isAdmin, username, password, qr_code)
                VALUES (:firstname, :middlename, :lastname, :isAdmin, :username, :password, :qr_code)";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                'firstname' => $firstname,
                'middlename' => $middlename,
                'lastname' => $lastname,
                'isAdmin' => $isAdmin,
                'username' => $username,
                'password' => $hashedPassword,
                'qr_code' => $qrCode
            ]);

            return $this->sendResponse([
                'message' => 'User registered successfully',
                'qr_code' => 'http://localhost/ugnayan_sys/backend/ugnayanapi/uploads/qrcodes/' . $qrCode
            ], 200);
        } catch (\PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return $this->sendErrorResponse("Failed to register user: " . $e->getMessage(), 500);
        }
    }
}
