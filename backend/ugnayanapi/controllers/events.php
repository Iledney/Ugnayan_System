<?php

require_once(__DIR__ . '/../utils/response.php');
require_once(__DIR__ . '/../vendor/autoload.php');

class EventController extends GlobalUtil
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function getEvents()
    {
        try {
            $tableName = 'events';
            $sql = "SELECT * FROM $tableName";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process the results to ensure image URLs are complete
            foreach ($result as &$event) {
                if (!empty($event['image'])) {
                    $event['image'] = 'http://localhost/ugnayan_system/backend/ugnayanapi/uploads/' . $event['image'];
                }
            }
            
            return $this->sendResponse($result, 200);
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to retrieve events: " . $errmsg, 400);
        }
    }

    public function getEventById($id)
    {
        try {
            $tableName = 'events';
            $sql = "SELECT * FROM $tableName WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $this->sendResponse($result, 200);
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            return $this->sendErrorResponse("Failed to retrieve event: " . $errmsg, 400);
        }
    }

    public function createEvent($data)
    {
        try {
            $tableName = 'events';
            
            // Handle file upload for the event image
            $image = '';
            if (!empty($data->image)) {
                $uploadDir = __DIR__ . '/../uploads/';
                
                // Create directory if it doesn't exist
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                // Extract the base64 data (strip out the data:image/... part)
                $imageData = $data->image;
                if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                    $imageData = substr($imageData, strpos($imageData, ',') + 1);
                    $type = strtolower($type[1]); // jpg, png, gif
                    
                    if (!in_array($type, ['jpg', 'jpeg', 'png', 'gif'])) {
                        return $this->sendErrorResponse("Unsupported image type", 400);
                    }
                    
                    $imageData = base64_decode($imageData);
                    if ($imageData === false) {
                        return $this->sendErrorResponse("Base64 decode failed", 400);
                    }
                    
                    $fileName = uniqid() . '.' . $type;
                    $filePath = $uploadDir . $fileName;
                    
                    if (file_put_contents($filePath, $imageData)) {
                        $image = $fileName;
                    } else {
                        return $this->sendErrorResponse("Failed to save image", 500);
                    }
                } else {
                    return $this->sendErrorResponse("Invalid image format", 400);
                }
            }

            // Process form data
            $eventname = isset($data->eventname) ? trim($data->eventname) : '';
            $description = isset($data->description) ? trim($data->description) : '';
            $date = isset($data->date) ? trim($data->date) : '';
            
            if (empty($eventname) || empty($description) || empty($date)) {
                return $this->sendErrorResponse("All fields are required", 400);
            }
            
            $query = "INSERT INTO $tableName
                (eventname, description, image, date)
                VALUES (:eventname, :description, :image, :date)";
            
            $stmt = $this->pdo->prepare($query);
            
            $stmt->execute([
                'eventname' => $eventname,
                'description' => $description,
                'image' => $image,
                'date' => $date
            ]);
            
            return $this->sendResponse([
                'message' => 'Event created successfully'
            ], 200);
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            error_log("Database error: " . $errmsg);
            return $this->sendErrorResponse("Failed to create event: " . $errmsg, 400);
        }
    }

    public function deleteEvent($id)
    {
        try {
            $tableName = 'events';
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

    public function updateEvent($data)
{
    try {
        $tableName = 'events';

        // Handle file upload for the event image (if provided)
        $image = '';
        if (!empty($data->image)) {
            $uploadDir = __DIR__ . '/../uploads/';
            
            // Create directory if it doesn't exist
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            // Extract the base64 data (strip out the data:image/... part)
            $imageData = $data->image;
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, gif
                
                if (!in_array($type, ['jpg', 'jpeg', 'png', 'gif'])) {
                    return $this->sendErrorResponse("Unsupported image type", 400);
                }
                
                $imageData = base64_decode($imageData);
                if ($imageData === false) {
                    return $this->sendErrorResponse("Base64 decode failed", 400);
                }
                
                $fileName = uniqid() . '.' . $type;
                $filePath = $uploadDir . $fileName;
                
                if (file_put_contents($filePath, $imageData)) {
                    $image = $fileName;
                } else {
                    return $this->sendErrorResponse("Failed to save image", 500);
                }
            } else {
                return $this->sendErrorResponse("Invalid image format", 400);
            }
        }

        // Process form data
        $eventname = isset($data->eventname) ? trim($data->eventname) : null;
        $description = isset($data->description) ? trim($data->description) : null;
        $date = isset($data->date) ? trim($data->date) : null;

        // Build the SQL query dynamically based on provided fields
        $fields = [];
        $params = [];
        if ($eventname !== null) {
            $fields[] = "eventname = :eventname";
            $params['eventname'] = $eventname;
        }
        if ($description !== null) {
            $fields[] = "description = :description";
            $params['description'] = $description;
        }
        if ($date !== null) {
            $fields[] = "date = :date";
            $params['date'] = $date;
        }
        if (!empty($image)) {
            $fields[] = "image = :image";
            $params['image'] = $image;
        }

        if (empty($fields)) {
            return $this->sendErrorResponse("No fields to update", 400);
        }

        $params['id'] = $data->eventId;
        $query = "UPDATE $tableName SET " . implode(', ', $fields) . " WHERE id = :id";

        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            return $this->sendResponse(['message' => 'Event updated successfully'], 200);
        } else {
            return $this->sendErrorResponse("Event not found or no changes made", 404);
        }
    } catch (\PDOException $e) {
        $errmsg = $e->getMessage();
        return $this->sendErrorResponse("Failed to update event: " . $errmsg, 400);
    }
}

}
