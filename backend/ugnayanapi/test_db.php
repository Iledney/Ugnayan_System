<?php
require_once('./config/db.php');

try {
    $con = new DatabaseAccess();
    $pdo = $con->connect();
    
    // Get all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Tables in database:\n";
    print_r($tables);
    
    // Check users table structure
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nUsers table structure:\n";
    print_r($columns);
    
    // Check if there are any users
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "\nNumber of users: " . $count['count'] . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
} 