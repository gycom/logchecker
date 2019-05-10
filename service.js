var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'LogAnalysis',
  description: 'Web tool to analyze IIS logs in conjonction with SessionLog.',
  script: 'D:\\cyframe\\devtool\\node\\logchecker\\index.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});
switch(process.argv[2])
{
    case "install":
        if(svc.exists)
        {
            console.log("Service already exists. Please uninstall first");
            break;
        }
        svc.install();
        break;
    case "uninstall":
        if(svc.exists)
            svc.uninstall()
        break;
    default:
        if(!svc.exists)
            console.log("Service not installed. Please do \"npm run service install\" first")
        else
            console.log("Service exists... Please do \"npm run service uninstall\" first before reinstalling")
        break;
}

//https://stackoverflow.com/questions/10547974/how-to-install-node-js-as-windows-service

//https://www.npmjs.com/package/node-windows
