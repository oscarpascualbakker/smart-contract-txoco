<?php
require 'vendor/autoload.php';
use Web3\Web3;

$apiKey = 'MkCoC6RmzJXTJryxG7iFXvRvX9zIr4aA';
$endpoint = 'https://polygon-mainnet.g.alchemy.com/v2/' . $apiKey;
$contractAddress = '0xf6fe664d0D61297fBfBb829A1FF77286b887a9Fd';

// Inicializar Web3
$web3 = new Web3($endpoint);

// La ABI del contrato (simplificada para este ejemplo)
$contractAbi = [
    [
        'constant' => true,
        'inputs' => [],
        'name' => 'baseURI',
        'outputs' => [
            ['name' => '', 'type' => 'string']
        ],
        'payable' => false,
        'stateMutability' => 'view',
        'type' => 'function',
    ]
];

$contract = new \Web3\Contract($contractAbi, $contractAddress, $web3->provider);

// Obtener baseURI
$contract->call('baseURI', [], function ($err, $result) use (&$baseURI) {
    if ($err !== null) {
        echo 'Error: ' . $err->getMessage();
        return;
    }
    $baseURI = $result[0];
    echo 'El valor de baseURI es: ' . $baseURI;
});
?>
