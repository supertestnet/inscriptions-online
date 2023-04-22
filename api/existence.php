<?php
header('Access-Control-Allow-Origin: *');

if(!isset($_GET['text']))
{
    echo 'error';
    exit;
}

$url = "https://unisat.io/brc20-api/inscriptions/category/unisat/existence";

$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_HTTPHEADER, array('Accept: application/json', 'Content-Type: application/json'));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$name = json_encode($_GET['text']);

$data = '{"names":['.$name.']}';

curl_setopt($curl, CURLOPT_POSTFIELDS, $data);

$resp = curl_exec($curl);

if($resp === false)
{
    echo 'error';
}

curl_close($curl);

echo $resp;