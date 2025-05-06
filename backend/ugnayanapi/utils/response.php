<?php

class GlobalUtil
{

    function sendResponse($data, $statusCode)
    {
        return array("status" => "success", "data" => $data, "statusCode" => $statusCode);
    }

    function sendErrorResponse($message, $statusCode)
    {
        return array("status" => "error", "message" => $message, "statusCode" => $statusCode);
    }

    public function sendTestResponse($data, $code = 200)
    {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'success',
            'data' => $data,
            'statusCode' => $code
        ]);
        exit;
    }
    
}
