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
var udpPort = 2333;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var udpServer = dgram.createSocket('udp4');

udpServer.on('listening', function () {
    var address = udpServer.address();
    console.log('udpServer: listening on ' + address.address + ":" + address.port);
});

udpServer.on('message', function (rcvdMessage, remote) {
    var fjpEntryCmd = "<CMD><ACTION><VALUE>ENTER</VALUE></CMD>\r\n";
    console.log("udpServer received: " + remote.address + ':' + remote.port +' - ' + 
        rcvdMessage);
    console.log("udpServer sending \"" + rcvdMessage + "\" from tcpClient.");
    var parsedMessage = adifToFjp(rcvdMessage.toString());
    for( var element in parsedMessage) {
        var messageToSend = new Buffer.from(parsedMessage[element]);
        tcpClient.write(messageToSend);
    };
    tcpClient.write(fjpEntryCmd);

});

udpServer.bind(udpPort, HOST);


// UDP Client
var js8String = "<command:3>Log <parameters:165><Band:3>20M <Call:5>M4NMX <Freq:6>14.076 <Mode:3>JS8 <QSO_DATE:8>20110419 <Time_ON:6>184000 <Time_OFF:6>184500 <RST_Rcvd:3>-03 <RST_Sent:3>-07 <TX_PWR:4>20.0 <EOR>";
var message = new Buffer.from(js8String);

var udpClient = dgram.createSocket('udp4');
udpClient.send(message, 0, message.length, udpPort, HOST, function(err, bytes) {
    if (err) throw err;
    console.log("udpClient: \"" + message + "\" sent to " + HOST + ':' + udpPort);
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

// ADIF parsing function
/* License Information from github.com/dskaggs/adif-parser
 * MIT license below is applicable as commented in following function

Copyright (c) 2014 Dan Skaggs

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
function adifToFjp(adifInput) {
    // Begin MIT License
    var record = {};

    var fields = adifInput.split('<');

    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var fieldName = field.split(':')[0];
        var fieldValue = field.split('>')[1];

        if (fieldName.length && fieldName != 'EOR>' && fieldValue && fieldValue.length) {
            fieldName = fieldName.trim().toLowerCase();
            fieldValue = fieldValue.trim();
            record[fieldName] = fieldValue;
        }
    }
    // End MIT License

    var fjpArray = [];
    var tbHandle;
    var handleValue;
    var k = 0;

    for (fieldName in record) {
        // We do not want command an tx_pwr entries to be sent
        if (fieldName !== "command" && fieldName !== "tx_pwr") {
            switch (fieldName) {
                // Apply N3FJP textbox name per fieldName
                case "band":
                {
                    tbHandle = "TXTENTRYBAND";
                    break;
                }
                case "call":
                {
                    tbHandle = "TXTENTRYCALL";
                    break;
                }
                case "freq":
                {
                    tbHandle = "TXTENTRYFREQUENCY";
                    break;
                }
                case "mode":
                {
                    tbHandle = "TXTENTRYMODE";
                    break;
                }
                case "qso_date":
                {
                    tbHandle = "TXTENTRYDATE";
                    break;
                }
                case "time_on":
                {
                    tbHandle = "TXTENTRYTIMEON";
                    break;
                }
                case "time_off":
                {
                    tbHandle = "TXTENTRYTIMEOFF";
                    break;
                }
                case "rst_rcvd":
                {
                    tbHandle = "TXTENTRYRSTR";
                    break;
                }
                case "rst_sent":
                {
                    tbHandle = "TXTENTRYRSTS";
                    break;
                }
                case "gridsquare":
                {
                    tbHandle = "TXTENTRYGRID";
                    break;
                }
                case "rst_rcvd":
                {
                    tbHandle = "TXTENTRYRSTS";
                    break;
                }
                case "name":
                {
                    tbHandle = "TXTENTRYNAMER";
                    break;
                }
                case "comment":
                {
                    tbHandle = "TXTENTRYCOMMENTS";
                    break;
                }
                default:
                { // just in case, don't populate textbox name
                    tbHandle = "";
                    break;
                }
            }

            // Populate value for textbox name if selected
            if (tbHandle)
                handleValue = record[fieldName];
            // Append text box entry for N3FJP form
            fjpArray[k++] = "<CMD><UPDATE><CONTROL>" + tbHandle + "</CONTROL><VALUE>" + 
                handleValue + "</VALUE></CMD>\r\n";
            // Append CALLTAB function after each command for full-feature N3FJP operation
            fjpArray[k++] = "<CMD><ACTION><VALUE>CALLTAB</VALUE></CMD>\r\n";
        }
    };
    return fjpArray;
}