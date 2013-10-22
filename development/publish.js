if(!process.argv[2] || typeof process.argv[2] !== "string" || !process.argv[2].match(/^v\d+\.\d+\.\d+$/)){
	console.error(process.argv);
	throw "A version number is required as the third argument of this script in v0.0.0 format.";
}

var 
  _ = require("lodash"),
  path = require("path"),
  fs = require("fs"),
  minifier = require("minifier"),
	currentDir = __dirname,
	version = process.argv[2],
	readmeFileName = "readme.md",
	licenseFileName = "gpl-3.0.txt",
	kogridJsPath = path.join(currentDir,"web/scripts/knockout.kogrid.js"),
	kogridCssPath = path.join(currentDir,"web/styles/knockout.kogrid.css"),
	kogridJsFileName = "knockout.kogrid." + version + ".js",
	kogridCssFileName = "knockout.kogrid." + version + ".css",
	kogridJsMinFileName = "knockout.kogrid." + version + ".min.js",
	kogridCssMinFileName = "knockout.kogrid." + version + ".min.css",
	readmePath = path.join(currentDir,"web",readmeFileName),
	licensePath = path.join(currentDir,"web",licenseFileName),
	releasePath = path.join(currentDir,"../release",version),
	mainPath = path.join(currentDir,"../");

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      if(cb && err && _.any(err)){
      	console.error(err);	
      	cb(err);
      }
      cbCalled = true;
    }
  }
};

function deleteFolderRecursive(path) {
  var files = [];
  if( fs.existsSync(path) ) {
      files = fs.readdirSync(path);
      files.forEach(function(file,index){
          var curPath = path + "/" + file;
          if(fs.statSync(curPath).isDirectory()) { // recurse
              deleteFolderRecursive(curPath);
          } else { // delete file
              fs.unlinkSync(curPath);
          }
      });
      fs.rmdirSync(path);
  }
};


function minifyTo(source,target){
	minifier.minify(source, {
		output : target
	});
};

// remove directory if it exists
if(fs.existsSync(releasePath)){
	console.info("Deleting existing path " + releasePath);
	deleteFolderRecursive(releasePath);
}

// create release directory
console.info("Creating path " + releasePath);
fs.mkdirSync(releasePath,0777);

// push to release folder
console.info("Copying to release folder " + releasePath);
copyFile(kogridJsPath,path.join(releasePath,kogridJsFileName));
copyFile(kogridCssPath,path.join(releasePath,kogridCssFileName));
copyFile(readmePath,path.join(releasePath,readmeFileName));
copyFile(licensePath,path.join(releasePath,licenseFileName));
minifyTo(kogridJsPath,path.join(releasePath,kogridJsMinFileName));
minifyTo(kogridCssPath,path.join(releasePath,kogridCssMinFileName));


// delete files from main folder
fs.readdirSync(mainPath).forEach(function(item){
	var p = path.join(mainPath,item);
	var stats = fs.statSync(p);
	if(stats.isFile()){
		console.info("Deleting " + p);
		fs.unlinkSync(p);
	}	
});


// push to main folder
console.info("Copying to main folder " + releasePath);
copyFile(kogridJsPath,path.join(mainPath,kogridJsFileName));
copyFile(kogridCssPath,path.join(mainPath,kogridCssFileName));
copyFile(readmePath,path.join(mainPath,readmeFileName));
copyFile(licensePath,path.join(mainPath,licenseFileName));
minifyTo(kogridJsPath,path.join(mainPath,kogridJsMinFileName));
minifyTo(kogridCssPath,path.join(mainPath,kogridCssMinFileName));
	