var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;

http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(),"web", uri);
  
  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200, { 
      	"Content-Length" : file.length,
      	"Content-Type" : (function(){
					if(filename.match(/\.js$/i)) {
						return "application/javascript";
					} else if (filename.match(/\.(css|less)$/i)){
						return "text/css";
					} else
      			return "text/html";
      	}())
      });
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");

// open browser window
var spawn = require('child_process').spawn;
try {
	// windows
	spawn('explorer', ['http://localhost:' + port]);
} catch (e) {
	// unix
	spawn('explorer', ['http://localhost:' + port]);
}