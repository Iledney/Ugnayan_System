<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Start output buffering to prevent accidental output
ob_start();

// Allow requests from any origin
header('Access-Control-Allow-Origin: *');

// Allow specific HTTP methods
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');

// Allow specific headers
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token, Origin, Authorization');

// Set Content-Type header to application/json for all responses
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    exit(0);
}

require_once('./config/db.php');
require_once('./controllers/login.php');
require_once('./controllers/violations.php');
require_once('./controllers/events.php');
require_once('./controllers/regsiter.php');
require_once('./controllers/attendance.php');
require_once('./controllers/sermons.php');
require_once('./controllers/dashboard.php');
require_once('./controllers/finance.php');

$con = new DatabaseAccess();
$pdo = $con->connect();

$login = new Login($pdo);
$violations = new Violations($pdo);
$events = new EventController($pdo);
$register = new UserController($pdo);
$attendance = new Attendance($pdo);
$sermon = new Sermon($pdo);
$dashboard = new Dashboard($pdo);
$finance = new Finance($pdo);


// Check if 'request' parameter is set in the request
if (isset($_REQUEST['request'])) {
    // Split the request into an array based on '/'
    $request = explode('/', $_REQUEST['request']);
} else {
    // If 'request' parameter is not set, return a 404 response
    echo json_encode(["error" => "Not Found"]);
    http_response_code(404);
    exit();
}

// Handle requests based on HTTP method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        switch ($request[0]) {

            case 'login':
                if (isset($data->username) && isset($data->password)) {
                    echo json_encode($login->loginUser($data->username, $data->password));
                } else {
                    echo json_encode([
                        'status' => 400,
                        'message' => 'Invalid input data'
                    ]);
                }
                break;

            case 'register':
                if (isset($data->firstname) && isset($data->lastname) && isset($data->username) && isset($data->password)) {
                    echo json_encode($register->registerUser($data));
                } else {
                    echo json_encode([
                        'status' => 400,
                        'message' => 'Invalid input data'
                    ]);
                }
                break;

            case 'addviolations':
                echo json_encode($violations->addViolation($data));
                break;

            case 'addevent':
                echo json_encode($events->createEvent($data));
                break;

            case 'addattendance':
                echo json_encode($attendance->addAttendance($data));
                break;
            case 'addsermon':
                echo json_encode($sermon->createSermon($data));
                break;
            case 'deletesermon':
                echo json_encode($sermon->deleteSermon($data));
                break;
            case 'updateevent':
                echo json_encode($events->updateEvent($data));
                break;
            case 'updatedashboard':
                echo json_encode($dashboard->updateDashboard($data));
                break;
            case 'addcontribution':
                echo json_encode($finance->addContribution($data));
                break;
            case 'deleteevent':
                echo json_encode($events->deleteEvent($data));
                break;

            case 'logout':
                echo json_encode($login->logoutUser($data));
                break;

            default:
                echo "This is forbidden";
                http_response_code(403);
                break;
        }
        break;
    case 'GET':
        $data = json_decode(file_get_contents("php://input"));
        switch ($request[0]) {

            case 'violations':
                echo json_encode($violations->getViolations());
                break;

            case 'users':
                echo json_encode($violations->getUsers());
                break;

            case 'events':
                echo json_encode($events->getEvents());
                break;

            case 'surnames':
                echo json_encode($finance->getUserSurnames());
                break;

            case 'users-by-lastname':
                if (isset($request[1])) {
                    echo json_encode($finance->getUsersByLastname($request[1]));
                } else {
                    echo json_encode([
                        'status' => 400,
                        'message' => 'Lastname parameter is required'
                    ]);
                }
                break;

            case 'user-contributions':
                if (isset($request[1])) {
                    echo json_encode($finance->getUserContributions($request[1]));
                } else {
                    echo json_encode([
                        'status' => 400,
                        'message' => 'User ID parameter is required'
                    ]);
                }
                break;

            case 'sermons':
                echo json_encode($sermon->getSermons());
                break;

            case 'attendance':
                echo json_encode($attendance->getAttendance());
                break;

            case 'dashboard':
                echo json_encode($dashboard->getDashboard());
                break;

            default:
                echo "Method not available";
                http_response_code(404);
                break;
        }
        break;  // <-- This was missing

    default:
        echo "Method not available";
        http_response_code(404);
        break;
}

// End output buffering and send output
ob_end_flush();
