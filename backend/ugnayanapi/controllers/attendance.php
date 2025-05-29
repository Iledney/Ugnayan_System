<?php

require_once(__DIR__ . '/../utils/response.php');

class Attendance extends GlobalUtil{

    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAttendance($eventId)
    {
        try {
            $sql = "
                SELECT 
                    a.id AS attendance_id,
                    a.userId AS user_id,
                    a.eventId AS event_id,
                    a.date AS attendance_date,
                    a.created_at AS created_at,
                    a.status AS attendance_status,
                    u.firstname AS user_firstname,
                    u.lastname AS user_lastname,
                    u.username AS user_username
                FROM attendance a
                LEFT JOIN users u ON a.userId = u.id
                WHERE a.eventId = :eventId
                ORDER BY a.created_at DESC
            ";
    
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['eventId' => $eventId]);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            return $this->sendResponse($result, 200);
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to retrieve attendance: " . $errmsg, 400);
        }
    }

    public function addAttendance($data)
    {
        try {
            error_log(print_r($data, true));
            
            $eventId = $data->eventId;
            $username = $data->username;
            
            // Fetch the userId based on username
            $query = "SELECT id FROM users WHERE username = :username";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute(['username' => $username]);
            
            $user = $stmt->fetch();
            
            if (!$user) {
                return $this->sendErrorResponse("User with this username not found.", 404);
            }
            
            $userId = $user['id']; // Fetch the userId from the users table
            
            $date = $data->date; // Date when the attendance is being added
            
            // Check if attendance record already exists for this user and event
            $checkQuery = "SELECT id FROM attendance WHERE userId = :userId AND eventId = :eventId";
            $checkStmt = $this->pdo->prepare($checkQuery);
            $checkStmt->execute([
                'userId' => $userId,
                'eventId' => $eventId
            ]);
            
            if ($checkStmt->rowCount() > 0) {
                return $this->sendErrorResponse("Attendance record already exists for this user and event.", 400);
            }
            
            // Add attendance to the attendance table
            $query = "INSERT INTO attendance (userId, eventId, date, created_at, status) 
                      VALUES (:userId, :eventId, :date, NOW(), 'Present')";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                'userId' => $userId,
                'eventId' => $eventId,
                'date' => $date
            ]);
    
            return $this->sendResponse("Attendance added successfully.", 200);
    
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to add attendance: " . $errmsg, 400);
        }
    }
    
}


?>