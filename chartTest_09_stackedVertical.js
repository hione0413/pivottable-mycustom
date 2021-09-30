var jsonDataFixed = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [] };
var loadStack = 0;
var timeLine = [];
var entireTime = [];
var str = "";
for (var i = 8; i <= 23; ++i) {
	str = "";
	switch (i) {
		default:
			str = i + "시";
			break;
		case 8:
			str = (i + 1) + "시이전";
			break;
		case 23:
			str = i + "시이후";
			break;
	}
	timeLine.push(str);
	entireTime.push({"시간대":str,"본관": 0,"디지털도서관": 0,"국립어린이청소년도서관": 0});
}

function buildStackedVert(jsonData, measure, dimension, month) {

	//Themes begin
	am4core.useTheme(am4themes_animated);
	//Themes end

	//Create chart instance
	var chart = am4core.create("stackedchartdiv", am4charts.XYChart);

	//Add data
	var originalStack = Object.keys(jsonData).length;

	if (originalStack != loadStack) {
		for (var j = 0; j < originalStack; j++) {
			for (var i = 0; i < 12; i++) {
				if (jsonData[j].월 == i + 1) {
					jsonDataFixed[i + 1].push(jsonData[j]);
				}
			}
			for (var i = 0; i < entireTime.length; i++) {
				if (jsonData[j].시간대 == entireTime[i].시간대) {
					entireTime[i].본관 = entireTime[i].본관 + jsonData[j].본관;
					entireTime[i].디지털도서관 = entireTime[i].디지털도서관 + jsonData[j].디지털도서관;
					entireTime[i].국립어린이청소년도서관 = entireTime[i].국립어린이청소년도서관 + jsonData[j].국립어린이청소년도서관;
				}
			}
			
			loadStack++;
		}
		chart.data = entireTime;
	} else {
		if (month == 0) {
			chart.data = entireTime;
		} else {
			for (var z = 0; z < 12; z++) {
				if (z + 1 == Number(month)) {
					chart.data = jsonDataFixed[z + 1];
				}
			}
		}
	}

	//Create axes
	var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
	categoryAxis.dataFields.category = dimension;
	categoryAxis.title.text = dimension;
	categoryAxis.renderer.grid.template.location = 0;
	categoryAxis.renderer.minGridDistance = 20;
	categoryAxis.renderer.cellStartLocation = 0.1;
	categoryAxis.renderer.cellEndLocation = 0.9;

	var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
	valueAxis.min = 0;
	valueAxis.title.text = measure;

	//Create series
	function createSeries(field, name, stacked) {
		var series = chart.series.push(new am4charts.ColumnSeries());
		series.dataFields.valueY = field;
		series.dataFields.categoryX = dimension;
		series.name = name;
		series.columns.template.tooltipText = "{name}: [bold]{valueY}[/]";
		series.stacked = stacked;
		series.columns.template.width = am4core.percent(95);
	}

	createSeries("본관", "본관", false);
	createSeries("디지털도서관", "디지털도서관", false);
	createSeries("국립어린이청소년도서관", "국립어린이청소년도서관", false);

	//Add legend
	chart.legend = new am4charts.Legend();

}

$(document).ready(function() {
	$("#monthSel").on("change", function() {
	  	month = $("#monthSel").val();
		buildStackedVert(jsonData, measure, dimension, month);
	});
});