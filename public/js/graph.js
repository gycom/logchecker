
var iplist = [];
const SECOND_PER_PIXEL = 80;
var cachedata = [];
var zoomfilter = null;
function init()
{
    var link = window.location.href;
    var file = link.substr(link.indexOf("/graph")+7,100);
    var h1 = document.getElementsByTagName("h1")[0];
    h1.innerHTML = "IIS Load for " + file;
    fetch("/api/graph/" + file+"?v="+Math.random())
            .then((response)=>response.json())
            .then((json)=>BuildGraph(json))
            .catch((rq)=>console.log(rq));
}

function BuildGraph(data)
{
    if (cachedata.length==0)
        cachedata = data
    var div = document.getElementById("Content");
    var txt = document.getElementById("trace");
    iplist = data.reduce((t,e)=>{var tt=t;if(!tt.includes(e.IP)){tt.push(e.IP); };return tt;},[]);
    div.innerHTML = data.map(makeBar).join("");
    var tt = document.getElementById("timetable");
    tt.style.height=(iplist.length*10)+"px";
    tt.style.width=(86400/SECOND_PER_PIXEL) + "px";
}

function makeBar(e)
{
    var width = secToPixel(msToSec(+e.time));
    var right = secToPixel(hrToSec(e.DT)- (zoomfilter?zoomfilter*3600:0));
    var left = right - width;
    var style = [
        ";position:","absolute",
        ";top:",((iplist.indexOf(e.IP))*10) + "px",
        ";width:",width + "px",
        ";height:","5px",
        ";left:",left+"px",
        ";background-color:",ColorOfStatus(e.status),
        ";border-bottom:","1px lightgray dotted"
        //";border-right:","1px black dashed"
    
    ];
    var classList = [
        "bar",
        e.url.indexOf("/punch")>=0 ? "punch" : "erp",
        (e.url.indexOf("/refresh.asp")>=0 || e.url.indexOf("/internetcheck.asp")>=0) ? "refresh" : ""
    ];
    return "<div class='" + classList.join(" ") + "' style='"+ style.join("") + "' title='"+ e.url +"'></div>";
}

function msToSec(ms)
{
    return ms/1000;
}
function hrToSec(dt)
{
    var second = (dt.substr(11,2) * 60 * 60) + (dt.substr(14,2) * 60) + (dt.substr(17,2)*1);
    return second;
}
function secToPixel(sec)
{
    return Math.ceil((sec*(zoomfilter?24:1)) / SECOND_PER_PIXEL * 4) / 4;
}

function ColorOfStatus(s)
{
    return ["#ff0","#0f0","#f00","#00f"][["200","500","404"].indexOf(s)+1];
}

function ZoomHr()
{
    var hr = window.event.srcElement.getAttribute("hr");
    zoomfilter = hr;
    BuildGraph(cachedata.filter(e=>Math.floor(hrToSec(e.DT)/3600)==+hr ));
    
}