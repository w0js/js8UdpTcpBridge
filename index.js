/*
    js8UdpTcpBridge - UDP to TCP bridge from N1MM+ to N3FJP logging software
    Copyright (C) 2019  Jonathan Straub

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// UDP server
var PORT = 2333;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var udpServer = dgram.createSocket('udp4');

udpServer.on('listening', function () {
    var address = udpServer.address();
    console.log('udpServer: listening on ' + address.address + ":" + address.port);
});

udpServer.on('message', function (message, remote) {
    console.log("udpServer received: " + remote.address + ':' + remote.port +' - ' + message);
    console.log("udpServer sending \"" + message + "\" from tcpClient.")
    tcpClient.write(message);
});

udpServer.bind(PORT, HOST);


// UDP Client
var message = new Buffer('My KungFu is Good!');

var udpClient = dgram.createSocket('udp4');
udpClient.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
    if (err) throw err;
    console.log("udpClient: \"" + message + "\" sent to " + HOST + ':' + PORT);
    udpClient.close();
});

// TCP server
var net = require('net');
var tcpPort = 1337;

var tcpServer = net.createServer(function(socket) {
//	socket.write('Echo server\r\n');
    socket.pipe(socket);
});

tcpServer.listen(tcpPort, HOST);

// TCP Client
var tcpClient = new net.Socket();

tcpClient.connect(tcpPort, HOST, function() {
	console.log('tcpClient: Connected to ' + HOST + ':' + tcpPort);
//	tcpClient.write('Hello, server! Love, Client.');
});

tcpClient.on('data', function(data) {
	console.log('tcpClient Received: \"' + data + "\" from tcpServer");
//	tcpClient.destroy(); // kill client after server's response
});

tcpClient.on('close', function() {
	console.log('tcpClient: Connection closed');
});