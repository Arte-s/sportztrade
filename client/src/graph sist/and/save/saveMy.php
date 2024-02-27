<?php

require_once "./savemysql.php";


function microtime_ms() { return round(microtime(true)*1000); }


define('cookieName', 'MSTradeData');

$__UserID = "1";//isset($_COOKIE[cookieName]) ? $_COOKIE[cookieName] : null;


if (! $__UserID)
{
	$db= GetDatabase();

	$id= microtime_ms();
	// Находим уникальный id, которого нет в базе данных
	while( $db && $db->getOne("Select * from `users` where `id`=?s", $id.""))
		$id++;

	$__UserID = $id."";

	$db->query("REPLACE into `users` (`id`) values(?s)", $__UserID);

	$days= 180;
	setcookie(cookieName, $__UserID, time() + $days * 60 * 60 * 24);
	//global $__UserID;
	//$__UserID = $_GET['aff'];
}



function GetDatabase() : SafeMySQL
{
	$dbName= "MSTrade";

	$conn = new mysqli(null, 'root', 'root');
// Check connection
	if ($conn->connect_error) {
		die("Connection to mySQL failed: " . $conn->connect_error);
	}

	//if ($conn->query("CREATE DATABASE IF NOT EXISTS {$dbName}")===TRUE)
	$exists = $conn->select_db($dbName);
// Create database
	if ($conn->query("CREATE DATABASE IF NOT EXISTS {$dbName}")===TRUE) {
		if (! $exists) error_log("DataBase created: " . $dbName);
		$conn->select_db($dbName);

		$ok= $conn->query("CREATE TABLE IF NOT EXISTS `users` (`id` VARCHAR(64) primary key)")===TRUE;
		if (! $ok)  error_log("Failed to create table 'users': ".$conn->error);
	}
	else
		die("Failed to create DataBase ".$dbName.":  ".$conn->connect_error);

	$db = new SafeMySQL( ['mysqli'=>$conn] );
//	$opts = [
//		'user' => 'root',
//		'pass' => '',
//		'db' => 'mstrade',
//		//'charset' => 'latin1'
//	];
//	try {
//		$db = new SafeMySQL($opts);
//	}
//	catch(Exception $e)
//	{
//		echo $e;
//		//error_log("!!!");
//		throw $e;
//	}
	return $db;
}



if (isset($_POST['key'])) {
	$key = $_POST['key'];
	$user = $__UserID;

	$db = GetDatabase();

	//$ok= $db->query("CREATE TABLE IF NOT EXISTS `parameters` (`id` INT primary key auto_increment, `user` VARCHAR(64), `key` VARCHAR(256), `value` MEDIUMTEXT)")===TRUE;
	$ok= $db->query("CREATE TABLE IF NOT EXISTS `parameters` (`user` VARCHAR(64), `key` VARCHAR(256), `value` MEDIUMTEXT, primary key(`user`,`key`))")===TRUE;

	if (! $ok)  error_log("Failed to create table 'parameters'");
//	$ok1 = $db->query("ALTER TABLE `parameters` ADD COLUMN IF NOT EXISTS `user` VARCHAR(64)");
//	$ok2 = $db->query("ALTER TABLE `parameters` ADD COLUMN IF NOT EXISTS `key` VARCHAR(256)");
//	$ok3 = $db->query("ALTER TABLE `parameters` ADD COLUMN IF NOT EXISTS `value` MEDIUMTEXT");
//	if (!($ok1 && $ok2 && $ok3)) {
//		error_log("Failed to create some columns");
//		exit();
//	}

	if (isset($_POST['value'])) { // Сохраняем значение
		$value= $_POST['value'];
		error_log("User ".$user.":  saving parameter ".$key.": ".$value);
		$res = $db->query("REPLACE into `parameters` (`user`, `key`, `value`) values(?s, ?s, ?s)", $user, $key, $value);
		error_log("Result of saving: ".$res);
		echo $res;
	}
		//$res= $db->query("Select * from `parameters` where `user`=?s and `key`=?s",$user, $key);
	else {  // Возвращаем значение
		error_log("User ".$user.":  loading parameter ".$key);
		$value = $db->getOne("Select `value` from `parameters` where `user`=?s and `key`=?s", $user, $key);
		error_log("Result of loading: ".$value);
		echo $value;
	}
		//$delete = $db->query("DELETE FROM `parameters` WHERE `user`=?s and `key`=?s",$user, $key);
}
