var gaugeGraph;
var lastGaugeData = [];
var delayGraph;
var delayCurrentData = [];

//if (window.addEventListener) {
//    window.addEventListener('resize', resizeHandlerDelay, false);
//}
//else if (window.attachEvent) {
//    window.attachEvent('onresize', resizeHandlerDelay);
//}

function init() {
    initCharts();
    StartInterval(500);
}

function getDelayChartOptions() {
    var options = {
        hAxis: {
            title: '',
            slantedText: false,
            scaleType: 'log'
        },
        vAxis: {
            title: 'Delay (ms)',
            scaleType: 'log',
            format: 'short'
        },
        legend: {
            position: 'top',
            alignment: 'center'
        },
        backgroundColor: {
            fill: '#E8E8E8'
        },
        chartArea: {
            left: '12%',
            width: '87%',
            top: '12%',
            height: '80%'
        }
    };
    return options;
}

function initCharts() {
    gaugeGraph = c3.generate({
        bindto: '#gaugeChart',
        data: {
            columns: [
                ['Risk', 0]
            ],
            type: 'gauge'
        },
        gauge: {
            label: {
                format: function (value, ratio) {
                    return value + '%';
                },
                show: false // to turn off the min/max labels.
            },
            min: 0, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
            max: 100, // 100 is default
            units: '%',
            //width: 39 // for adjusting arc thickness
        },
        color: {
            pattern: ['#60B044', '#F6C600', '#DC3912'], // the three color levels for the percentage values.
            threshold: {
                //            unit: 'value', // percentage is default
                //            max: 200, // 100 is default
                values: [50, 80, 100]
            }
        },
        size: {
            height: 180
        },
        padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        },
        tooltip: {
            format: {
                title: function (x) { return 'Risk för fel under kommande minut'; },
                value: function (x) { return x + '% (' + moment(lastGaugeData[0]).format('hh:mm:ss') + ')';}
            }
        }
    });

    delayGraph = new google.visualization.LineChart(document.getElementById('delayGraph'));
    var initDelayOptions = getDelayChartOptions();

    var newRow = ["", 0, 0, 0];

    var initDelayDataTable = new google.visualization.DataTable();

    initDelayDataTable.addColumn('string', 'X');
    initDelayDataTable.addColumn('number', 'Max');
    initDelayDataTable.addColumn('number', 'Delay');
    initDelayDataTable.addColumn('number', 'Average');

    initDelayDataTable.addRows([
      newRow
    ]);


    delayGraph.draw(initDelayDataTable, initDelayOptions);

}

function StartInterval(intervalTime) {
    var interval = setInterval(function () {
        GetData();
    }, intervalTime);
}


function GetData() {
    var serviceURL = '/Home/GetDataSessionType';

    $.ajax({
        type: "GET",
        url: serviceURL,
        data: param = "",
        contentType: "text/plain; charset=utf-8",
        dataType: "text",
        success: handleRecievedData,
        error: errorFunc
    });


    function errorFunc(error) {
        console.log(error);
    }
}


function handleRecievedData(data) {
    if (data === null || data.length === 0) {
        return null;
    }

    var jsonData = JSON.parse(data);

    var statusCodeData = {
        "numberoftimeouts": jsonData.numberoftimeouts,
        "numberofthreehundred": jsonData.numberofthreehundred,
        "numberofsevenhundred": jsonData.numberofsevenhundred,
        "numberofother": jsonData.numberofother,
        "time": jsonData.time
    };

    var gaugeData = {
        "id": jsonData.id,
        "label": jsonData.label,
        "time": jsonData.time
    };

    var sessionTypeData = {
        "numberstartsessions": jsonData.numberstartsessions,
        "numberexistingsessions": jsonData.numberexistingsessions,
        "time": jsonData.time
    };

    var delayData = {
        "max": jsonData.max,
        "average": jsonData.average,
        "delay": jsonData.delay,
        "time": jsonData.time
    };

    drawStatusTiles(statusCodeData);
    drawGaugeGraph(gaugeData);
    drawDelayGraph(delayData);
}

function drawStatusTiles(jsonData) {
    var labelStatus300 = $('#labelStatus300');
    var labelStatus700 = $('#labelStatus700');
    var labelStatusTimeout = $('#labelStatusTimeout');
    var labelStatusOther = $('#labelStatusOther');

    labelStatus300.text(jsonData.numberofthreehundred);
    labelStatus700.text(jsonData.numberofsevenhundred);
    labelStatusTimeout.text(jsonData.numberoftimeouts);
    labelStatusOther.text(jsonData.numberofother);
}

function drawDelayGraph(jsonData) {
    var options = getDelayChartOptions();

    var newTimeValue = jsonData.time;

    var newMaxValue = jsonData.max;
    var newDelayValue = jsonData.delay;
    var newAvgValue = jsonData.average;

    if (delayCurrentData.length !== 0) {
        var newDelayData = [];
        var newMomentTime = moment(newTimeValue);
        var newMomentCompareTime = newMomentTime.subtract(30, 's');

        delayCurrentData.forEach(function (value, index) {
            var momentTime = moment(value[0]);
            if (momentTime.isAfter(newMomentCompareTime)) { //Remove 30s from the new value time, and if timestamp from the existing data is after we keep it
                newDelayData.push(value);
            }
        });

        delayCurrentData = newDelayData;
    }

    delayCurrentData.push([newTimeValue, newMaxValue, newDelayValue, newAvgValue]);

    if (delayGraph == null) {
        delayGraph = new google.visualization.LineChart(document.getElementById('delayGraph'));
    }


    var delayDataTable = new google.visualization.DataTable();

    delayDataTable.addColumn('string', 'X');
    delayDataTable.addColumn('number', 'Max');
    delayDataTable.addColumn('number', 'Delay');
    delayDataTable.addColumn('number', 'Average');
    var newDataTableData = delayCurrentData.map(function (item) {
        return ["", item[1], item[2], item[3]];
    })


    delayDataTable.addRows(
        newDataTableData
    );


    delayGraph.draw(delayDataTable, options);
}

function drawGaugeGraph(jsonData) {

    if (lastGaugeData[1] !== jsonData.label) {
        gaugeGraph.load({
            columns: [['Risk', jsonData.label]]
        });
    }

    lastGaugeData = [jsonData.time, jsonData.label];
}

function resizeHandler() {
    var delayDataTable = new google.visualization.DataTable();

    delayDataTable.addColumn('string', 'X');
    delayDataTable.addColumn('number', 'Max');
    delayDataTable.addColumn('number', 'Delay');
    delayDataTable.addColumn('number', 'Average');
    var newDataTableData = delayCurrentData.map(function (item) {
        return ["", item[1], item[2], item[3]];
    })


    delayDataTable.addRows(
        newDataTableData
    );


    delayGraph.draw(delayDataTable, options);
}