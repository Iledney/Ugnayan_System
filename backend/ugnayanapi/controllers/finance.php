<?php

require_once(__DIR__ . '/../utils/response.php');

class Finance extends GlobalUtil{

    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getUserSurnames(){
        
        try{
            $query = "SELECT DISTINCT lastname FROM users ORDER BY lastname ASC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->sendResponse($result, 200);

        }catch(PDOException $e){
            return $this->sendErrorResponse("Failed to get users: " . $e->getMessage(), 500);
        }

    }

    public function getUsersByLastname($lastname){
        try{
            $query = "SELECT id, firstname, lastname, username FROM users WHERE lastname = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$lastname]);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->sendResponse($result, 200);
        }catch(PDOException $e){
            return $this->sendErrorResponse("Failed to get users: " . $e->getMessage(), 500);
        }
    }
    
    public function getUserContributions($userId) {
        try {
            $query = "SELECT f.*, u.firstname, u.lastname 
                     FROM finance f 
                     JOIN users u ON f.user_id = u.id 
                     WHERE f.user_id = ? 
                     ORDER BY f.contribution_date DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$userId]);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->sendResponse($result, 200);
        } catch(PDOException $e) {
            return $this->sendErrorResponse("Failed to get contributions: " . $e->getMessage(), 500);
        }
    }

    public function addContribution($data) {
        try {
            // Validate required fields
            if (!isset($data->user_id) || !isset($data->amount) || !isset($data->contribution_date)) {
                return $this->sendErrorResponse("Missing required fields", 400);
            }

            // Validate amount is positive
            if ($data->amount <= 0) {
                return $this->sendErrorResponse("Amount must be greater than 0", 400);
            }

            // Validate user exists
            $userQuery = "SELECT id FROM users WHERE id = ?";
            $userStmt = $this->pdo->prepare($userQuery);
            $userStmt->execute([$data->user_id]);
            
            if ($userStmt->rowCount() === 0) {
                return $this->sendErrorResponse("User not found", 404);
            }

            // Insert contribution
            $query = "INSERT INTO finance (user_id, amount, contribution_date) VALUES (?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data->user_id,
                $data->amount,
                $data->contribution_date
            ]);

            return $this->sendResponse([
                'message' => 'Contribution added successfully',
                'contribution_id' => $this->pdo->lastInsertId()
            ], 201);

        } catch(PDOException $e) {
            return $this->sendErrorResponse("Failed to add contribution: " . $e->getMessage(), 500);
        }
    }
}


?>