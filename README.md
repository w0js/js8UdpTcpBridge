# js8UdpTcpBridge
Electron App to bridge UDP messages from JS8CALL to TCP messages for N3FJP API

### Installing
```
npm i -D electron@latest
npm start
```

## Deployment
Using [electron-builder](https://www.electron.build/) to package the app. They recommend using [yarn](https://yarnpkg.com/en/) rather than npm.
Once both are installed per the websites, perform one of the following commands:

To install for Windows:
```yarn dist -w```

To install for linux:
```yarn dist -l```

## Contributing
Have not yet decided on contribution requirements.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/w0js/js8UdpTcpBridge/releases). 

## Authors

* **Jonathan Straub, WØJS** - *Initial work* - [WØJS - GitHub](https://github.com/w0js)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the GPLv3 License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* **Scott Davis, N3FJP** - Provided TCP API to his software
* **Thomas Wagner, N1MM** - Provided UDP API to his software
* **Jordan Sherer, KN4CRD** - Creator of JS8CALL software
* **Dan Skaggs** - Creator of [adif-parser](https://github.com/dskaggs/adif-parser/) which saved me a bunch of time
* **Ted Miston** - Provided [TCP-Example](https://gist.github.com/tedmiston/5935757)
* **@hacksparrow** - Provided [UDP-Example](https://www.hacksparrow.com/node-js-udp-server-and-client-example.html)