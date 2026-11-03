<?php
http_response_code(410);
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");
echo json_encode(["success" => false, "message" => "Use the secure Netlify API"]);
