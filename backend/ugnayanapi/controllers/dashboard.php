<?php

require_once(__DIR__ . '/../utils/response.php');
require_once(__DIR__ . '/../vendor/autoload.php');

class Dashboard extends GlobalUtil
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function getDashboard()
    {
        try {
            $sql = "SELECT * FROM dashboard LIMIT 1";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                // Decode JSON fields
                $result['announcement'] = json_decode($result['announcement']);
                $result['reminders'] = json_decode($result['reminders']);
            }
            
            return $this->sendResponse($result, 200);
        } catch (\PDOException $e) {
            return $this->sendErrorResponse("Failed to retrieve dashboard: " . $e->getMessage(), 400);
        }
    }

    public function updateDashboard($data)
    {
        try {
            // First, check if a dashboard record exists
            $checkSql = "SELECT id FROM dashboard LIMIT 1";
            $checkStmt = $this->pdo->query($checkSql);
            $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
            // Encode JSON data
            $announcement = json_encode($data->announcement);
            $reminders = isset($data->reminders) ? json_encode($data->reminders) : null;
    
            if ($exists) {
                // Update existing record
                $sql = "UPDATE dashboard 
                       SET daily_verse = ?, 
                           announcement = ?, 
                           reminders = ?,
                           updated_at = CURRENT_TIMESTAMP
                       WHERE id = ?";
                
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $data->daily_verse,
                    $announcement,
                    $reminders,
                    $exists['id']
                ]);
            } else {
                // Insert new record if none exists
                $sql = "INSERT INTO dashboard (daily_verse, announcement, reminders) 
                       VALUES (?, ?, ?)";
                
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $data->daily_verse,
                    $announcement,
                    $reminders
                ]);
            }
            
            return $this->sendResponse(['message' => 'Dashboard updated successfully'], 200);
        } catch (\PDOException $e) {
            return $this->sendErrorResponse("Failed to update dashboard: " . $e->getMessage(), 400);
        }
    }
}