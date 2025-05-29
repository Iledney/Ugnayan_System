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
            // Start transaction
            $this->pdo->beginTransaction();

            // Basic validation
            if (!isset($data->user_id) || !isset($data->amount) || !isset($data->contribution_date)) {
                return $this->sendErrorResponse("Missing required fields", 400);
            }

            // Validate amount
            if (!is_numeric($data->amount) || $data->amount <= 0) {
                return $this->sendErrorResponse("Invalid contribution amount", 400);
            }

            // Validate date
            if (!strtotime($data->contribution_date)) {
                return $this->sendErrorResponse("Invalid contribution date", 400);
            }

            // Check if user exists
            $checkUserQuery = "SELECT id FROM users WHERE id = ?";
            $checkUserStmt = $this->pdo->prepare($checkUserQuery);
            $checkUserStmt->execute([$data->user_id]);
            if (!$checkUserStmt->fetch()) {
                return $this->sendErrorResponse("User not found", 404);
            }

            // Insert contribution
            $query = "INSERT INTO finance (user_id, amount, contribution_date) VALUES (?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $success = $stmt->execute([
                $data->user_id,
                $data->amount,
                $data->contribution_date
            ]);

            if (!$success) {
                $this->pdo->rollBack();
                return $this->sendErrorResponse("Failed to insert contribution", 500);
            }

            $contributionId = $this->pdo->lastInsertId();

            try {
                // Update dashboard with new total
                $monthlyTotal = $this->updateDashboardTotal();
            } catch (PDOException $e) {
                // Log the error but don't fail the transaction
                error_log("Failed to update dashboard total: " . $e->getMessage());
                $monthlyTotal = 0;
            }

            // Get the newly added contribution
            $query = "SELECT f.*, u.firstname, u.lastname 
                     FROM finance f 
                     JOIN users u ON f.user_id = u.id 
                     WHERE f.id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$contributionId]);
            $contribution = $stmt->fetch(PDO::FETCH_ASSOC);

            $this->pdo->commit();

            return $this->sendResponse([
                'status' => 'success',
                'message' => 'Contribution added successfully',
                'contribution' => $contribution,
                'monthly_total' => $monthlyTotal
            ], 201);

        } catch(PDOException $e) {
            $this->pdo->rollBack();
            error_log("Database error in addContribution: " . $e->getMessage());
            return $this->sendErrorResponse("Database error: " . $e->getMessage(), 500);
        } catch(Exception $e) {
            $this->pdo->rollBack();
            error_log("Error in addContribution: " . $e->getMessage());
            return $this->sendErrorResponse("Error: " . $e->getMessage(), 500);
        }
    }

    private function updateDashboardTotal() {
        try {
            // Calculate total contributions for current month
            $query = "SELECT COALESCE(SUM(amount), 0) as total 
                     FROM finance 
                     WHERE MONTH(contribution_date) = MONTH(CURRENT_DATE()) 
                     AND YEAR(contribution_date) = YEAR(CURRENT_DATE())";
            $stmt = $this->pdo->query($query);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $monthlyTotal = floatval($result['total']);

            // Update dashboard
            $checkQuery = "SELECT id FROM dashboard LIMIT 1";
            $checkStmt = $this->pdo->query($checkQuery);
            $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($exists) {
                $updateQuery = "UPDATE dashboard 
                              SET quick_stats = JSON_SET(
                                  COALESCE(quick_stats, '{}'),
                                  '$.contributions_this_month',
                                  ?
                              )
                              WHERE id = ?";
                $updateStmt = $this->pdo->prepare($updateQuery);
                $updateStmt->execute([$monthlyTotal, $exists['id']]);
            } else {
                $insertQuery = "INSERT INTO dashboard (quick_stats) 
                              VALUES (?)";
                $insertStmt = $this->pdo->prepare($insertQuery);
                $insertStmt->execute([
                    json_encode(['contributions_this_month' => $monthlyTotal])
                ]);
            }

            return $monthlyTotal;
        } catch(PDOException $e) {
            throw new PDOException("Failed to update dashboard total: " . $e->getMessage());
        }
    }

    private function getContributionById($id) {
        $query = "SELECT f.*, u.firstname, u.lastname 
                 FROM finance f 
                 JOIN users u ON f.user_id = u.id 
                 WHERE f.id = ?";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function calculateMonthlyContributions() {
        $query = "SELECT COALESCE(SUM(amount), 0) as total 
                 FROM finance 
                 WHERE MONTH(contribution_date) = MONTH(CURRENT_DATE()) 
                 AND YEAR(contribution_date) = YEAR(CURRENT_DATE())";
        $stmt = $this->pdo->query($query);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return floatval($result['total']);
    }

    private function updateDashboardStats($monthlyTotal) {
        // Check if dashboard record exists
        $checkQuery = "SELECT id FROM dashboard LIMIT 1";
        $checkStmt = $this->pdo->query($checkQuery);
        $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($exists) {
            // Update existing record
            $sql = "UPDATE dashboard 
                   SET quick_stats = JSON_SET(
                       COALESCE(quick_stats, '{}'),
                       '$.contributions_this_month',
                       ?
                   )
                   WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$monthlyTotal, $exists['id']]);
        } else {
            // Create new dashboard record
            $sql = "INSERT INTO dashboard (quick_stats) 
                   VALUES (?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                json_encode(['contributions_this_month' => $monthlyTotal])
            ]);
        }
    }
}


?>