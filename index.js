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
//var udpPort = 2333;
//var udpHost = '127.0.0.1';

var dgram = require('dgram');
var udpServer = dgram.createSocket('udp4');
var jquery = $ = require('jquery');

udpServer.on('listening', function () {
    var address = udpServer.address();
    $("#udpLog").append('udpServer: listening on ' + address.address + ':' + address.port + "\r\n");
    $("#udpLog").scrollTop(999999);
});

udpServer.on('message', function (rcvdMessage, remote) {
    var fjpEntryCmd = "<CMD><ACTION><VALUE>ENTER</VALUE></CMD>\r\n";
    var ignRigPollCmd = "<CMD><IGNORERIGPOLLS><VALUE>TRUE</VALUE></CMD>\r\n";
    var rigPollCmd = "<CMD><IGNORERIGPOLLS><VALUE>FALSE</VALUE></CMD>\r\n";
    var udpRecString = "udpServer received: " + remote.address + ':' + remote.port + ' - ' +
        rcvdMessage.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;") + "\r\n";
    $("#udpLog").append(udpRecString);
    var parsedMessage = adifToFjp(rcvdMessage.toString());
    tcpClient.write(ignRigPollCmd);
    $("#udpLog").append("udpServer: sending - " + ignRigPollCmd.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    $("#udpLog").scrollTop(999999);
    for( var element in parsedMessage) {
        var messageToSend = new Buffer.from(parsedMessage[element]);
        tcpClient.write(messageToSend);
        $("#udpLog").append("udpServer: sending - " + messageToSend.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        $("#udpLog").scrollTop(999999);
    };
    tcpClient.write(fjpEntryCmd);
    $("#udpLog").scrollTop(999999);
    tcpClient.write(rigPollCmd);
    $("#udpLog").append("udpServer: sending - " + rigPollCmd.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    $("#udpLog").scrollTop(999999);
});

// UDP Client - Testing Purposes (Substitute for JS8CALL)
/*
var js8String = "<command:3>Log <parameters:166><Band:3>20M <Call:6>KC0NPL <Freq:6>14.078 <Mode:3>JS8 <QSO_DATE:8>20020422 <Time_ON:6>051500 <Time_OFF:6>055100 <RST_Rcvd:3>-17 <RST_Sent:3>-24 <TX_PWR:4>50.0 <EOR>";
var message = new Buffer.from(js8String);

var udpClient = dgram.createSocket('udp4');
$("#udpSendBtn").click( function() {
    udpClient.send(message, 0, message.length, $('#udpPort').text(), $("#udpIp").text(), function(err, bytes) {
        if (err) throw err;
        $("#udpLog").append("udpClient: '" + message.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;") + "' sent to " + 
            $("#udpIp").text() + ':' + $("#udpPort").text() + "\r\n");
        udpClient.close();
    });
});
*/

// TCP Section
var net = require('net');

// TCP server - Testing Purposes (Substitute for N3FJP ACLOG)
/*
//var tcpPort = 1100;
//var tcpHost = '127.0.0.1';

var tcpServer = net.createServer(function(socket) {
//	socket.write('Echo server\r\n');
    socket.pipe(socket);
});
*/

// TCP Client
var tcpClient = new net.Socket();

/* Now handled in connectBtn.click
tcpClient.connect($("#tcpPort").text(), $("#tcpIp").text(), function() {
	$("#tcpLog").append('tcpClient: Connected to ' + $("#tcpIp").text() + ':' + $("#tcpPort").text() + "\r\n");
//	tcpClient.write('Hello, server! Love, Client.');
});
*/

tcpClient.on('data', function(data) {
	$("#tcpLog").append('tcpClient Received: \"' + data.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;") + "\" from tcpServer");
//	tcpClient.destroy(); // kill client after server's response
});

tcpClient.on('close', function() {
	$("#tcpLog").append('tcpClient: Connection closed');
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
            if (tbHandle === "TXTENTRYBAND")
                handleValue = handleValue.replace(/M/g, '');
            // Append text box entry for N3FJP form
            fjpArray[k++] = "<CMD><UPDATE><CONTROL>" + tbHandle + "</CONTROL><VALUE>" + 
                handleValue + "</VALUE></CMD>\r\n";
            // Append CALLTAB function after each command for full-feature N3FJP operation
            fjpArray[k++] = "<CMD><ACTION><VALUE>CALLTAB</VALUE></CMD>\r\n";
        }
    };
    return fjpArray;
}

// Event handler for the Connect button
$("#connectBtn").click( function() {
    udpServer.bind($("#udpPort").text(), $("#udpIp").text()); // start udpServer

  
//    tcpServer.listen($("#tcpPort").text(), $("#tcpIp").text()); // Start tcpServer - Testing Purposes (In place of N3FJP ACLOG)
    tcpClient.connect($("#tcpPort").text(), $("#tcpIp").text(), function() {
        $("#tcpLog").append('tcpClient: Connected to ' + $("#tcpIp").text() + ':' + $("#tcpPort").text() + "\r\n"); // Start tcpClient
    });
});