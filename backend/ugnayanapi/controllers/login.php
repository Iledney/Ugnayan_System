<?php

declare(strict_types=1);

use Firebase\JWT\JWT;

require_once(__DIR__ . '/../config/db.php');
require_once(__DIR__ . '/../utils/secretKey.php');
require_once(__DIR__ . '/../vendor/autoload.php');

class Login {
    private $conn;
    private $secretKey;

    public function __construct() {
        $databaseService = new DatabaseAccess();
        $this->conn = $databaseService->connect();

        $keys = new Secret();
        $this->secretKey = $keys->generateSecretKey();
    }
    
    public function loginUser($username, $password) {
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password'])) {
            return [
                'status' => 401,
                'message' => 'Invalid email or password'
            ];
        }
        $payload = [
            'iss' => 'localhost',
            'aud' => 'localhost',
            'exp' => time() + 3600,
            'data' => [
                'id' => $user['id'],
                'firstname' => $user['firstname'],
                'lastname' => $user['lastname'],
                'username' => $user['username']
            ],
        ];

        $jwt = JWT::encode($payload, $this->secretKey, 'HS256');

        return [
            'status' => 200,
            'jwt' => $jwt,  
            'message' => 'Login Successful'
        ];
    }




    public function logoutUser() {

        setcookie("jwt", "", time() - 3600, '/');


        http_response_code(200);
    }
}
?>
