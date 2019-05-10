function sessionLogExtractor(param,callback)
{
    console.log(param);
    var log = __dirname + "/LOG/" + param.group + "/20" + param.filename.substr(4,6)+"-0300/all.txt";
    var urlfilter = param.url||"";
    console.log("filter",urlfilter)
    const fs = require("fs");
    const stream = require("stream");
    const readline = require("readline");
    const linestream = new stream();
    const file = fs.createReadStream(log,{encoding:"utf-8"});
    const reader = readline.createInterface({
        input:  file,
        output: linestream
    });
    var statSP = [];
    var state = {
        page:"",
        spname:"",
        starttime:"",
        endtime:"",
        error:0
    };
    var schema = [
        "CMATC_LOGIN",
        "CMATC",
        "CF_DISTRIBUTION_V2",
        "CUST_SUPP_MANAGEMENT",
        "PRODUCT_MANAGEMENT",
        "PRODUCTION_MANAGEMENT",
        "PFC",
        "SHIPMENT_MANAGEMENT",
        "JOBTRACK_DIEMAKING",
        "JT_EXTRUSION_V2",
        "JT_CORE_PRODUCTION",
        "INVOICE_MANAGEMENT",
        "DWH_JT_DIE",
        "DWH_JT_EXT_2",
        "MIGRATION",
        "ANT_AREA"
    ];
    const linetype = [
        "-------------------Start of Page",
        "-------------------End of Page",
        "Check SysParam",
        "Perform =",
        "Action =",
        "records --",
        "--------------------- P A R A M E T E R S ---------------------<BR>",
        "---------------------------------------------------------------<BR>",
        "//#",
        "Returned value =",
        "//PUNCH:",
        " ORA-"
    ];
    
    reader.on("line",process);
    reader.on("close",finish);
    file.on("error",donothing);

    function donothing()
    {
        callback([]);
    }
    
    function process(line)
    {
        var type = linetype.map((s,n)=>({
            pos:    line.indexOf(s),
            type:   n
        })).filter((e)=>e.pos>=0);
    
        if (line.length==0) return;
        if (type.length == 0)
        {
            // spname and parameters
            if (line.substr(-4)!="<BR>")
            {
                // spname and trace
                var pos = line.indexOf("//");
                var ending = line.substr(pos+2);
                //console.log(ending);
                var s = ending.split(".")[0];
                if (schema.includes(s.toUpperCase()))
                {
                    state.spname = ending;
                    state.starttime = line.substr(0,line.indexOf("M:")+1);
                }
            }
            else
            {
                // parameters
                //console.log(line)
            }
        }
        else
        {
            var ending = line.substr(type[0].pos + linetype[type[0].type].length + 1);
            switch(type[0].type)
            {
                case 0: // start of page
                    state.page = ending;
                    break;
                case 1: // end of page
                    state = {
                        page:       "",
                        spname:     "",
                        starttime:  "",
                        endtime:    "",
                        error:      0
                    };
                    break;
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 9:
                case 10:
                //console.log(line)
                    break;
                case 8:
                    // end sp execution
                    state.endtime = line.substr(0,line.indexOf("M:")+1);
                    if (state.page.toLowerCase()==urlfilter.toLowerCase() || urlfilter=="INSERT_ESCAPE_URL_HERE")
                    {
                        statSP.push(state);
                    }
                    state = {
                        page:       state.page,
                        spname:     "",
                        starttime:  "",
                        endtime:    "",
                        error:      0
                    };
                    break;
                case 11: // ORA-
                    //console.log("ORA-2" + ending)
                    state.error += 1;
                    break;
                default:
                    //console.log(line);
                    pos = line.indexOf("//");
                    if (pos >= 0)
                    {
                        //console.log(line.substr(pos))
                    }
                    else
                    {
                        //console.log(line)
                    }
                    break;
            }
        }
    }
    
    function finish()
    {
        //console.log(statSP.filter(e=>e.spname=="JT_EXTRUSION_V2.PKG_JOBS.SAVEJOBMACHINESTATUS"))
        var by = (field,type) => (a,b) => a[field] > b[field] ? (type=="desc"?-1:1) : a[field] < b[field] ? (type=="desc"?1:-1) : 0;
        var stat = statSP
                    .filter(e=>e.spname!="")
                    .map(CalcDuration)
                    .reduce(CalcStat,{});
        var statRank = Object.keys(stat).map(KeyToArray).slice()
                        .sort(by("totaltime_in_sec","desc"))
                        .filter((e,n)=> n<200
                                        || e.totaltime_in_sec > 5 
                                        || e.meantime_in_sec > 5);
        console.log(log);
        //console.table(statRank);
        console.log("\ndone...");
        callback(statRank);
       // end();
    
        function CalcStat(t,e)
        {
            var t2 = t;
            if (!t2[e.spname])
            {
                t2[e.spname] = {
                    spname: e.spname.toUpperCase(),
                    totalduration: 0,
                    count:0,
                    error:0
                };
            }
            t2[e.spname].count++;
            t2[e.spname].totalduration += e.duration;
            t2[e.spname].error += e.error;
            return t2;
        }
        function CalcDuration(e)
        {
            var d1 = new Date(e.starttime);
            var d2 = new Date(e.endtime);
            return {
                spname: e.spname,
                duration: ((+d2) - (+d1))/1000,//d2.getTime()-d1.getTime()
                error: e.error
            };
        }
        function KeyToArray(key)
        {
            var row = stat[key];
            return {
                spname:             row.spname,
                count:              row.count,
                totaltime_in_sec:   Math.round(10 * row.totalduration)/10,
                meantime_in_sec:    Math.round(1000 * row.totalduration / row.count)/1000,
                error:              row.error
            };
        }
    }
}
module.exports = sessionLogExtractor;