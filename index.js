const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

app.use(express.static(__dirname + "/public"));

app.get("/",defaultPage);
app.get("/api/log/list",getLogList)
app.get("/api/log/:grp/:file",getIISLogStat);
app.get("/api/sp/:grp/:file/:url",getSessionLogStat);
app.get("/api/sp/:grp/:file",getSessionLogStat);
app.listen(3000,()=>console.log("Running on port 3000"));

function defaultPage(req,res)
{
    res.redirect("/default.html");
}

function getLogList(req,res)
{
    var list = {};
    var folders = fs.readdirSync(__dirname+"/LOG");
    folders.forEach(SendLogList)
    function SendLogList(fld)
    {
        var files = fs.readdirSync(__dirname+"/LOG/"+fld);
        list[fld] = files.filter(e=>e.substr(-4)==".log" && e.substr(0,4)=="u_ex");
    }
    res.send(JSON.stringify(list))
}

function getIISLogStat(req,res)
{
    var logExtractor = require("./IISLogExtract");
    logExtractor({
            group:      req.params.grp,
            filename:   req.params.file
        },
        logStat=>res.send(JSON.stringify(logStat))
    );
}

function getSessionLogStat(req,res)
{
    var sessionlogExtractor = require("./SessionLogExtract");
    sessionlogExtractor({
            group:      req.params.grp,
            filename:   req.params.file,
            url:        req.params.url
        },
        logStat=>res.send(JSON.stringify(logStat))
    );
}