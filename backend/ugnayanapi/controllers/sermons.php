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
            $sql = "SELECT * FROM $tableName ORDER BY date DESC";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process the results to ensure audio file URLs are complete
            foreach ($result as &$sermon) {
                if (!empty($sermon['audioFile'])) {
                    // Check if file exists
                    $audioFilePath = __DIR__ . '/../uploads/sermons/' . $sermon['audioFile'];
                    if (file_exists($audioFilePath)) {
                        // Use a direct URL path that matches your server configuration
                        $sermon['audioFile'] = '/ugnayan_system/backend/ugnayanapi/uploads/sermons/' . $sermon['audioFile'];
                    } else {
                        $sermon['audioFile'] = null;
                    }
                }
            }
            
            return $this->sendResponse($result, 200);
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to retrieve sermons: " . $errmsg, 400);
        }
    }

    public function createSermon($data)
    {
        try {
            if (!isset($data->title) || empty($data->title)) {
                throw new \Exception("Sermon title is required");
            }
            if (!isset($data->date) || empty($data->date)) {
                throw new \Exception("Sermon date is required");
            }
            if (!isset($data->audioFile) || !isset($data->audioFile->content)) {
                throw new \Exception("Audio file is required");
            }

            $audioFile = '';
            $uploadDir = __DIR__ . '/../uploads/sermons/';
            
            // Ensure upload directory exists
            if (!file_exists($uploadDir)) {
                if (!mkdir($uploadDir, 0777, true)) {
                    throw new \Exception("Failed to create upload directory");
                }
            }

            // Validate file type
            $allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
            if (!in_array($data->audioFile->fileType, $allowedTypes)) {
                throw new \Exception("Invalid file type. Only MP3, WAV, and OGG files are allowed.");
            }

            // Generate unique filename
            $fileName = uniqid() . '_' . $data->audioFile->fileName;
            $targetFile = $uploadDir . $fileName;

            // Decode and save file
            $fileContent = base64_decode($data->audioFile->content);
            if ($fileContent === false) {
                throw new \Exception("Failed to decode file content");
            }

            // Check decoded file size
            $decodedSize = strlen($fileContent);
            if ($decodedSize > 35 * 1024 * 1024) { // 35MB limit
                throw new \Exception("File size too large. Maximum size is 35MB.");
            }

            // Save file
            if (file_put_contents($targetFile, $fileContent) === false) {
                throw new \Exception("Failed to save file to server");
            }

            $audioFile = $fileName;

            // Insert into database
            $stmt = $this->pdo->prepare("INSERT INTO sermons (title, date, audioFile) VALUES (?, ?, ?)");
            if (!$stmt->execute([$data->title, $data->date, $audioFile])) {
                // If database insert fails, delete the uploaded file
                if (file_exists($targetFile)) {
                    unlink($targetFile);
                }
                throw new \Exception("Failed to save sermon to database");
            }

            return $this->sendResponse([
                'message' => 'Sermon created successfully',
                'data' => [
                    'title' => $data->title,
                    'date' => $data->date,
                    'audioFile' => $audioFile
                ]
            ], 200);
        } catch (\Exception $e) {
            error_log("Error creating sermon: " . $e->getMessage());
            // Clean up any uploaded file if there was an error
            if (isset($targetFile) && file_exists($targetFile)) {
                unlink($targetFile);
            }
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
