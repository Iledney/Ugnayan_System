<?php

require_once(__DIR__ . '/../utils/response.php');

class Violations extends GlobalUtil{

    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getViolations()
    {
        try {
            $tableName = 'violations';

            $sql = "SELECT * FROM $tableName";
            $stmt = $this->pdo->query($sql);

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->sendResponse($result, 200);
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to retrieve" . $errmsg, 400);
        }
    }

    public function addViolation($data)
    {
        try {
            
            $tableName = 'violations';
            $userId = $data->userId;
            $violation = $data->violation;
            $date = $data->date;

            $query = "INSERT INTO " . $tableName . "
            SET userId = :userId,
                violation = :violation,
                date = :date";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                'userId' => $userId,
                'violation' => $violation,
                'date' => $date
            ]);

            return $this->sendResponse("Violation added successfully", 200);
            
            
        }catch(\PDOException $e){
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to add violation" . $errmsg, 400);
        }
    }

    public function getUsers()
    {
        try {
            $tableName = 'users';
            $sql = "SELECT id, CONCAT(firstName, ' ', middleName, ' ', lastName) AS fullName FROM $tableName";
            $stmt = $this->pdo->query($sql);

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->sendResponse($result, 200);
            
        }catch(\PDOException $e){
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to get users" . $errmsg, 400);
        }
    }

    

}


?>