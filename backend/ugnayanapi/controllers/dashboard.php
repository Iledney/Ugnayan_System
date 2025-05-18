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
                // Ensure quick_stats is properly decoded
                if (isset($result['quick_stats']) && is_string($result['quick_stats'])) {
                    $result['quick_stats'] = json_decode($result['quick_stats'], true);
                } else {
                    $result['quick_stats'] = [
                        'total_attendance' => 0,
                        'contributions_this_month' => 0,
                        'upcoming_events' => 0
                    ];
                }
                
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
            $quick_stats = isset($data->quick_stats) ? json_encode($data->quick_stats) : json_encode([
                'total_attendance' => 0,
                'contributions_this_month' => 0,
                'upcoming_events' => 0
            ]);
    
            if ($exists) {
                // Update existing record
                $sql = "UPDATE dashboard 
                       SET daily_verse = ?, 
                           announcement = ?, 
                           reminders = ?,
                           quick_stats = ?,
                           updated_at = CURRENT_TIMESTAMP
                       WHERE id = ?";
                
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $data->daily_verse,
                    $announcement,
                    $reminders,
                    $quick_stats,
                    $exists['id']
                ]);
            } else {
                // Insert new record if none exists
                $sql = "INSERT INTO dashboard (daily_verse, announcement, reminders, quick_stats) 
                       VALUES (?, ?, ?, ?)";
                
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $data->daily_verse,
                    $announcement,
                    $reminders,
                    $quick_stats
                ]);
            }
            
            return $this->sendResponse(['message' => 'Dashboard updated successfully'], 200);
        } catch (\PDOException $e) {
            return $this->sendErrorResponse("Failed to update dashboard: " . $e->getMessage(), 400);
        }
    }
}