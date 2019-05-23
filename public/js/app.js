var TEMPLATE={};
var logarray = [];

function OnLoad()
{
    console.log("OnLoad");
    getAllTemplates();
    fetch("/api/log/list")
        .then((response)=>response.json())
        .then((json)=>BuildLogList(json))
        .catch((rq)=>console.log(rq));
}

function BuildLogList(json)
{
    var select = document.getElementById("LogList");
    for (var grp in json)
    {
        var optGroup = document.createElement("OPTGROUP");
        optGroup.label = grp;
        select.appendChild(json[grp].reduce((t,e)=>{
            var opt = document.createElement("option");
            opt.value = e;
            opt.text = e;
            opt.group = grp;
            t.appendChild(opt);
            return t;
        },optGroup));
    }
}

function ShowIISLog(cbo)
{
    var text = [];
    for (var i=0; i < cbo.options.length; i++)
    {
        if (cbo.options[i].selected)
        {
            text.push({
                grp:    cbo.options[i].group,
                file:   cbo.options[i].value
            });
        }
    }
    console.log(text);

    logarray = [];
    var fetchNow = function(n,cb){
        console.log("making request",n,text[n])
        var request = text[n].grp + "/" + text[n].file;
        fetch("/api/log/"+request)
            .then((response)=>response.json())
            .then((json)=>Push(json,n,cb))
            .catch((rq)=>console.log(rq));
    }
    fetchNow(0,function(){
        BuildIISLogStat(logarray[0].result,0)
    });

    function Push(json,n,cb)
    {
        console.log("pushing",n,text)
        logarray.push({
            req:    text[n],
            result: json
        });
        if (n<text.length-1) 
            fetchNow(n+1,cb); 
        else 
            cb();
    }
}

function Repeat(ar,n)
{
    var out = [];
    for (var i=0; i < n; i++)
    {
        out.concat(ar);
    }
    return out;
}
function BuildIISLogStat(urllist,ndx)
{
    var div = document.getElementById("Content");
    var html =  MakeTable("url",titleRender(ndx) + urllist.map(urlRender).join(""),[300].concat(Repeat([50,50,50,100],logarray.length)));
    div.innerHTML = html;
    function urlRender(e)
    {
        var mapping = {
            "INSERT_URL_HERE":      e.url,
            "INSERT_ESCAPE_URL_HERE": encodeURIComponent(e.url),
            "INSERT_NEXT_FILE_HERE": detailRender(e,0),
            "INSERT_GRP_HERE": logarray[ndx].req.grp,
            "INSERT_FILE_HERE": logarray[ndx].req.file
        };
        return templateRender(TEMPLATE.urllist,mapping);
    }

    function detailRender(e,ndx)
    {
        var mapping = {
           // "INSERT_NEXT_FILE_HERE": detailNextRender(e),
            "INSERT_COUNT_HERE":    e.count,
            "INSERT_TOTAL_HERE":    e.totaltime_in_min,
            "INSERT_MEAN_HERE":     e.meantime_in_sec,
            "INSERT_ERROR_HERE":    JSON.stringify(e.status),
            "INSERT_ESCAPE_URL_HERE": encodeURIComponent(e.url),
        };
        return templateRender(TEMPLATE.urldetail,mapping)+ ((ndx<logarray.length-1) ? detailNextRender(e.url,ndx+1) : "");
    }
    function detailNextRender(url,ndx)
    {
        var e = logarray[ndx].result.filter((z)=>z.url==url);
        e = e[0] || {count:"",totaltime_in_min:"",meantime_in_sec:"",status:""};
        var mapping = {
             "INSERT_COUNT_HERE":    e.count,
             "INSERT_TOTAL_HERE":    e.totaltime_in_min,
             "INSERT_MEAN_HERE":     e.meantime_in_sec,
             "INSERT_ERROR_HERE":    e.status?JSON.stringify(e.status):""
         };
         return templateRender(TEMPLATE.urldetail,mapping)+ ((ndx<logarray.length-1) ? detailNextRender(url,ndx+1) : "");
     }

    function titleRender(ndx)
    {
        var mapping = {
            "INSERT_NEXT_FILE_HERE": titleNextRender(ndx),
            "INSERT_URL_HERE":      "URL",
            "INSERT_GRP_HERE": logarray[ndx].req.grp,
            "INSERT_FILE_HERE": logarray[ndx].req.file
        };
        return templateRender(TEMPLATE.urllist,mapping);
    }
    function titleNextRender(ndx)
    {
        console.log("index = " + ndx)
        var mapping = {
            "INSERT_NEXT_FILE_HERE": TEMPLATE.urldetail,
            "INSERT_COUNT_HERE":    "COUNT<br>" + logarray[ndx].req.file,
            "INSERT_TOTAL_HERE":    "Total time<br>(in minutes)",
            "INSERT_MEAN_HERE":     "Mean time<br>(in seconds)",
            "INSERT_ERROR_HERE":    "Error page"
        };
        return templateRender(TEMPLATE.urldetail,mapping) + ((ndx<logarray.length-1) ? titleNextRender(ndx+1) : "");
    }
}

function MakeTable(id,txt,cols)
{
    return "<table id=\""+id+"\" style='table-layout:fixed'>"+cols.map(w=>"<col width='"+w+"px' />").join("")+txt+"</table>";
}
function getAllTemplates()
{
    var tmpl = document.querySelectorAll("script[type='text/template'");
    for (var i=0; i < tmpl.length; i++)
        TEMPLATE[tmpl[i].id] = tmpl[i].innerHTML;
}
function templateRender(template,mapping)
{
    var out = template;
    for (var n in mapping)
    {
        out = out.replace(new RegExp(n,"gi"),mapping[n]);
    }
    return out;
}

function getSPLog(link)
{
    console.log(link.href)
    window.event.preventDefault();
    var div = document.getElementById("SPContent");
    div.innerHTML = "<img src='tenor.gif' height=64>"
    fetch(link.href)
        .then((response)=>response.json())
        .then((json)=>ShowSPLog(json));
}

function ShowSPLog(SPLog)
{
    var div = document.getElementById("SPContent");
    div.innerHTML = MakeTable("splog",spTitleRender()+SPLog.map(spRender).join(""),[200,50,50,50,50]);
}

function spRender(e)
{
    var mapping = {
        "INSERT_SPNAME_HERE":e.spname,
        "INSERT_COUNT_HERE":e.count,
        "INSERT_TOTAL_HERE":e.totaltime_in_sec,
        "INSERT_MEAN_HERE":e.meantime_in_sec,
        "INSERT_ERROR_HERE":e.error
    };
    return templateRender(TEMPLATE.splist,mapping);
}

function spTitleRender()
{
    return spRender({
        spname:     "SP_NAME",
        count:      "COUNT",
        totaltime_in_sec:"Total time<br>(in seconds)",
        meantime_in_sec:"Mean time<br>(in seconds)",
        error:      "Error count"
    });
}