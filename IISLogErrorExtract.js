function logErrorExtractor(param, callback)
{

    const fs = require("fs");
    var log = __dirname + "/LOG/" + param.group + "/" + param.filename;
    const stream = require("stream");
    const readline = require("readline");

    var fieldlist = [];
    var statPage = {};
    var errorlist = [];
    const outstream = new stream;
    outstream.readable=true;
    outstream.writable=true;

    var startTime, endTime;

    function start() {
        startTime = new Date();
    };

    function end() {
        endTime = new Date();
        var timeDiff = endTime - startTime; //in ms
        // strip the ms

        // get seconds 
        var seconds = Math.round(timeDiff*100)/100;
        console.log(seconds + " ms");
    }

    start();
    const file = fs.createReadStream(log,{encoding:"utf-8"});
    var rl = readline.createInterface({ input: file, output: outstream})
                        .on("line",processLog)
                        .on("close",finishLog);
    file.on("error",donothing);

    function donothing()
    {
        callback(null);
    }
    function processLog(line)
    {
        if (line.substr(0,1)=="#")
        {
            if (line.substr(0,7)=="#Fields")
                setCurrentFields(line.split(" "));
        }
        else
        {
            collectError(line.split(" "));
        }
        function setCurrentFields(fld)
        {
            fieldlist = fld.slice(1);
        }
        function collectError(fld)
        {
            //#Fields: date time cs-method cs-uri-stem cs-uri-query c-ip cs-host sc-status sc-substatus sc-win32-status time-taken
            var posURL = fieldlist.indexOf("cs-uri-stem");
            var posTIME = fieldlist.indexOf("time-taken");
            var posSTATUS = fieldlist.indexOf("sc-status");
            var posError = fieldlist.indexOf("cs-uri-query");

            var url = fld[posURL].toLowerCase();
            var time = +fld[posTIME];
            var status = fld[posSTATUS];
            var errormsg = fld[posError];
            if (status!="200" && status!="304")
            {
              //  if (errormsg!='-' )
                    errorlist.push({
                        same:   url==param.url || param.url=="INSERT_ESCAPE_URL_HERE",
                        url:    url,
                        param:  param.url,
                        line:   fld.join(" ")
                    });
            }
/*            if (!statPage[url]) statPage[url] = {url:url, count:0, totaltime:0, status: {}};
            statPage[url].count++;
            statPage[url].totaltime += time/1000/60; // in minutes
            if (status!="200")
            {
                if (!statPage[url].status[status]) statPage[url].status[status] = 1;
                statPage[url].status[status]++;
            }*/
        }
    }

    function renderLog(e)
    {
        return e.line;
    }
    function finishLog()
    {
        var onlySame = (e)=>e.same==true;
        callback("<pre>"+errorlist.filter(onlySame).map(renderLog).join("<br>") + "</pre>");
        return;
        var by = (field,type) => (a,b) => a[field] > b[field] ? (type=="desc"?-1:1) : a[field] < b[field] ? (type=="desc"?1:-1) : 0;
        var statRank = Object.keys(statPage).map(KeyToArray).slice()
                        .sort(by("totaltime_in_min","desc"))
                        .filter((e,n)=> n<20
                                        || e.totaltime_in_min > 5 
                                        || e.meantime_in_sec > 5 
                                        || e.status["500"]
                                        || e.status["404"]);
        console.log(log);
        //console.table(statRank);
        console.log("\ndone...");
        end();
        callback(statRank);

        function KeyToArray(key)
        {
            var row = statPage[key];
            return {
                url:                row.url,
                count:              row.count,
                totaltime_in_min:   Math.round(10 * row.totaltime)/10,
                meantime_in_sec:    Math.round(10 * row.totaltime * 60 / row.count)/10,
                status:             row.status
            };
        }
    }
}
module.exports = logErrorExtractor;
