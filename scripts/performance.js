var timer = setInterval(function() {}, 1000);
var vizID = 0;
var serverID = 0;
var servers = ['tableau.piedmonthospital.org','tableau-test.piedmonthospital.org'];
var headers = ['start time','url'].concat(servers);
var vizLoaded = false;
var start = new Date;
var allowExecute = false;
var dashboards = [
    'https://[SERVER]/#/views/InpatientObservationDashboardMonthly/IP-ObvDashboard'
    ,'https://[SERVER]/#/views/SepsisOrderSetTracker/ByPatientName'
    ,'https://[SERVER]/#/views/EDKPIScorecard%2FEDOverallScorecardDashboard'
    ,'https://[SERVER]/#/views/ORUtilizationDashboard/ORUtilizationDashboard'
    ,'https://[SERVER]/#/views/EVSProductivityDashboard_0/TrendingTATAnalysis'
    ,'https://[SERVER]/#/views/HandHygieneDashboard/HandHygieneDashboard2_0'
    ,'https://[SERVER]/#/views/BedUtilization_1/BedUtilizationDashboard'
    ,'https://[SERVER]/#/views/LaborProductivityDashboard_0/LaborProductivityDashboard'
    ,'https://[SERVER]/#/views/StatisticsDashboardsQuickVersion/KeyHospitalStatisticsDashboard'
    ,'https://[SERVER]/#/views/FirstCaseDelays/FirstCaseDelays'
    ,'https://[SERVER]/#/views/OperatingRoomMonthlyDashboards/Summary'
    ,'https://[SERVER]/#/views/BarcodeCompliance/BarcodeCompliance'
    ,'https://[SERVER]/#/views/PHCOutcomesDashboard/MortalityDashboard'
    ,'https://[SERVER]/#/views/PSIDashboards/AllPSIMetrics'
    ,'https://[SERVER]/#/views/HealthCatalyst-CLABSI/CentralLineUtilization'
    ,'https://[SERVER]/#/views/PressGaneyDashboard/PressGaneySentimentDashboard'
    ,'https://[SERVER]/#/views/PiedmontMetrics/MetricCard'
    ];

var LOADED_INDICATOR = 'api.VizInteractiveEvent';  
var COMPLETE_INDICATOR = 'tableau.completed';

$(document).ready(function(){
    var table = makeTable($('#results'), headers);
    performanceTester();

});

function isMessage(txt, msg) {
  return txt.substring(0, msg.length) === msg;
}


function performanceTester(viz) {
    vizLoaded = false;
    var tableauViz = document.getElementById("tableauViz");
    var url = dashboards[vizID].replace('[SERVER]',servers[serverID]);
    $('#testDashboard').html(url);
    var options = {
        width: '1000px',
        height: '500px',
        toolbarPosition: 'top',
        onFirstInteractive: function () {
            console.log('finshed loading');

            console.log(serverID+':'+vizID);
            console.log(url);
            var seconds = Math.round((new Date - start) / 1000 );
            appendResults(vizID, serverID, seconds);
            clearInterval(timer);
            if(serverID<servers.length-1){
                serverID++;
            } else {
                serverID = 0;
                vizID++;
            }
            if(vizID<dashboards.length){
                window.removeEventListener('message', handleMessage);
                viz.dispose();
                performanceTester(viz);
            } else {
                $('#testDashboard').html('Testing Complete!');
            }
        }
    };
    window.removeEventListener('message', handleMessage);

    allowExecute = true;
    console.log('attempt load of: ' + url);
    viz = new tableauSoftware.Viz(tableauViz, url, options);
    start = new Date;
    timer = setInterval(function() {
        $('#timer').text(Math.round((new Date - start) / 1000 )+ " Seconds");
    }, 1000);

    var handleMessage = function(msg) {
        if (allowExecute) {
            if (isMessage(msg.data, LOADED_INDICATOR)) {
              vizLoaded = true;
            } else if (isMessage(msg.data, COMPLETE_INDICATOR)){
              if (vizLoaded) {
                console.log('viz loaded successfully!');
              } else {
                console.log('viz failed to load!');
                var url = dashboards[vizID].replace('[SERVER]',servers[serverID]);
                console.log(serverID+':'+vizID);
                console.log(url);
                var seconds = Math.round((new Date - start) / 1000 );
                appendResults(vizID, serverID, seconds);
                clearInterval(timer);
                if(serverID<servers.length-1){
                    serverID++;
                } else {
                    serverID = 0;
                    vizID++;
                }
                if(vizID<dashboards.length){
                    allowExecute = false;
                    console.log('dispose of failed viz: ' + url);
                    //window.removeEventListener('message', handleMessage);
                    setTimeout(function(){ 
                        viz.dispose(); 
                        performanceTester(viz);
                    }, 1000);
                } else {
                    $('#testDashboard').html('Testing Complete!');
                }
              }
            }
        }
    }

    window.addEventListener('message', handleMessage);

}


function appendResults(visID, server, seconds){
    dashboard = dashboards[vizID];
    var dateOptions = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'};
    var now  = new Date();

    if(server === 0){
        let tr = $('<tr/>');
        tr.attr("id",'d_'+vizID);
        tr.append($('<td/>').html(now.toLocaleDateString("en-US", dateOptions)));
        tr.append($('<td/>').html(dashboard));
        tr.append($('<td/>').html(seconds));
        $('#data').append(tr);
    } else {
        let td = $('<td/>');
        td.html(seconds);
        $("[id='d_"+visID+"']").append(td);
    }
}

function makeTable(container, data) {
    var table = $("<table/>");
    var thead = $("<thead/>").addClass("thead-dark");
    var tbody = $("<tbody/>").attr("id","data");
    table.addClass("table table-striped small");

    var row = $("<tr/>");
    $.each(data, function(c,t) {
        row.append($('<th/>').attr("scope","col").text(t));
    });
    thead.append(row);
    table.append(thead);
    table.append(tbody);
    return container.append(table);
}