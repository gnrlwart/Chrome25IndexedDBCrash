// Simple test http server
var kMainTestPage = "crashTest.html";

var sys = require("sys"),
  my_http = require("http"),
  path = require("path"),
  url = require("url"),
  filesys = require("fs");
my_http.createServer(function(request,response){
  var my_path = url.parse(request.url).pathname;
  var full_path = path.join(process.cwd(),my_path);
  filesys.exists(full_path,function(exists){
    if(!exists){
      response.writeHeader(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
    }
    else{
      filesys.readFile(full_path, "binary", function(err, file) {
        if(err) {
          response.writeHeader(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();

        }
        else{
          response.writeHeader(200);
          response.write(file, "binary");
          response.end();
        }

      });
    }
  });
}).listen(8080);
sys.puts("Crash Test page running at 127.0.0.1:8080/IDBNumberCrash.html");
