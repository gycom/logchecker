const data = [
    {"ip":"10.31.10.222","starttime":"2019-04-07 01:06:15","duration":10000,url:"//"}
    ,{"ip":"10.31.10.222","starttime":"2019-04-07 01:06:15","duration":10000}
    ,{"ip":"10.31.10.115","starttime":"2019-04-07 01:08:15","duration":1000}
    ,{"ip":"10.31.10.222","starttime":"2019-04-07 01:26:15","duration":2000}
    ,{"ip":"10.31.10.115","starttime":"2019-04-07 01:46:15","duration":6000}
    ,{"ip":"10.31.10.222","starttime":"2019-04-07 01:56:15","duration":10000}
];
function ExtractRequest(param, callback)
{
    const fs = require("fs");
    var log = __dirname + "/LOG/" + param.grp + "/" + param.file;
    const stream = require("stream");
    const readline = require("readline");
    var fieldlist = [];
    var statPage = {};
    var requestlist = [];
    const outstream = new stream;
    outstream.readable=true;
    outstream.writable=true;

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
            var posD = fieldlist.indexOf("date");
            var posT = fieldlist.indexOf("time");
            var posIP = fieldlist.indexOf("c-ip");
            var posURL = fieldlist.indexOf("cs-uri-stem");
            var posTIME = fieldlist.indexOf("time-taken");
            var posSTATUS = fieldlist.indexOf("sc-status");

            var url = fld[posURL].toLowerCase();
            var IP = fld[posIP];
            var DT = fld[posD] + " " + fld[posT];
            var time = +fld[posTIME];
            var status = fld[posSTATUS];
            requestlist.push({
                IP:         IP,
                DT:         DT,
                time:       time,
                url:        url,
                status:     status
            });
        }
    }

    function renderLog(e)
    {
        return e.line;
    }
    function finishLog()
    {
        callback(requestlist);

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
module.exports = ExtractRequest;