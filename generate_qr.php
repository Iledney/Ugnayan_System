<?php
// filepath: /Applications/XAMPP/xamppfiles/htdocs/Ugnayan_System/generate_qr.php
include('phpqrcode/qrlib.php');

// Set content type
header('Content-Type: image/png');

// Generate QR code
$text = "https://example.com";
QRcode::png($text);
?>