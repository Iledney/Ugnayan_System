<?php

require_once(__DIR__ . '/../utils/response.php');
require_once(__DIR__ . '/../vendor/autoload.php');

class Sermon extends GlobalUtil
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function getSermons()
    {
        try {
            $tableName = 'sermons';
            $sql = "SELECT * FROM $tableName";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process the results to ensure image URLs are complete
            foreach ($result as &$sermon) {
                if (!empty($sermon['audioFile'])) {
                    $sermon['audioFile'] = 'http://localhost/ugnayan_sys/backend/ugnayanapi/uploads/sermons/' . $sermon['audioFile'];
                }
            }
            
            return $this->sendResponse($result, 200);
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to retrieve events: " . $errmsg, 400);
        }
    }

    public function createSermon($data)
    {
        try {
            $audioFile = '';
            if (isset($data->audioFile)) {
                $uploadDir = __DIR__ . '/../uploads/sermons/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $fileName = uniqid() . '_' . $data->audioFile->fileName;
                $targetFile = $uploadDir . $fileName;
                
                // Decode base64 and save file
                $fileContent = base64_decode($data->audioFile->content);
                if (file_put_contents($targetFile, $fileContent)) {
                    $audioFile = $fileName;
                } else {
                    throw new \Exception("Failed to save file");
                }
            }
    
            $stmt = $this->pdo->prepare("INSERT INTO sermons (title, date, audioFile) VALUES (?, ?, ?)");
            $stmt->execute([$data->title, $data->date, $audioFile]);
            
            return $this->sendResponse(['message' => 'Sermon created successfully'], 200);
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to create sermon: " . $e->getMessage(), 400);
        }
    }

    public function deleteSermon($id)
    {
        try {
            $tableName = 'sermons';
            $sql = "DELETE FROM $tableName WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id->id]);
    
            if ($stmt->rowCount() > 0) {
                return $this->sendResponse(['message' => 'Event deleted successfully'], 200);
            } else {
                return $this->sendErrorResponse("Event not found or already deleted", 404);
            }
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to delete event: " . $errmsg, 400);
        }
    }
}
