<?php
header('Access-Control-Allow-Origin: *');

if(!isset($_GET['q']))
{
    echo 'error';
    exit;
}

$url = "https://unisat.io/_next/data/FJqw_KN_hpI4xI4tITJV9/search.json?q=".$_GET['q']."&type=sats&p=1";

$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
$resp = curl_exec($curl);

if($resp === false)
{
    echo 'error';
    curl_close($curl);
    exit;
}

curl_close($curl);

$json = json_decode($resp);
$json = $json->pageProps;
$length = count($json->results);

for($i = 0; $i < $length; $i++)
{
    if($json->results[$i]->inscriptionIndex == 0)
    {
        $json = $json->results[$i];
        break;
    }
}

echo json_encode($json);