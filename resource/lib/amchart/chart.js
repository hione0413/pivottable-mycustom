/*Chart code*/

function buildBarChart(jsonData, dimension, measure) {
	// Themes begin
	am4core.useTheme(am4themes_animated);
	// Themes end

	var chart = am4core.create('barchartdiv', am4charts.XYChart);

	// chartExporting
	chart.exporting.menu = new am4core.ExportMenu();

	chart.colors.step = 2;

	chart.legend = new am4charts.Legend();
	chart.legend.position = 'bottom';
	chart.legend.paddingBottom = 20;
	chart.legend.labels.template.maxWidth = 95;

	var xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
	xAxis.dataFields.category = dimension;
	xAxis.renderer.cellStartLocation = 0.1;
	xAxis.renderer.cellEndLocation = 0.9;
	xAxis.renderer.grid.template.location = 0;

	var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
	yAxis.min = 0;

	function createSeries(value, name) {
		var series = chart.series.push(new am4charts.ColumnSeries());
		series.dataFields.valueY = value;
		series.dataFields.categoryX = dimension;
		series.name = name;

		// 막대별로 다른 색상을 가지게 하고 싶을 경우
		//  MEMO : 동일한 측정값을 가지는 막대의 경우 기본적으로는 같은 색상을 가지게됨
		series.columns.template.adapter.add("fill", function(fill, target) {
			return chart.colors.getIndex(target.dataItem.index);
		});

		series.events.on("hidden", arrangeColumns);
		series.events.on("shown", arrangeColumns);

		var bullet = series.bullets.push(new am4charts.LabelBullet());
		bullet.interactionsEnabled = false;
		bullet.dy = 30;
		bullet.label.text = '{valueY}';
		bullet.label.fill = am4core.color('#ffffff');

		return series;
	}

	chart.data = jsonData;

	//createSeries(measure, name); // 두번째 인자 name으로 외부로 노출되는 텍스트를 변경할 수 있음
	createSeries(measure, measure); // 두번째 인자 name으로 외부로 노출되는 텍스트를 변경할 수 있음

	function arrangeColumns() {

		var series = chart.series.getIndex(0);

		var w = 1 - xAxis.renderer.cellStartLocation - (1 - xAxis.renderer.cellEndLocation);
		if (series.dataItems.length > 1) {
			var x0 = xAxis.getX(series.dataItems.getIndex(0), "categoryX");
			var x1 = xAxis.getX(series.dataItems.getIndex(1), "categoryX");
			var delta = ((x1 - x0) / chart.series.length) * w;
			if (am4core.isNumber(delta)) {
				var middle = chart.series.length / 2;
				var newIndex = 0;
				chart.series.each(function(series) {
					if (!series.isHidden && !series.isHiding) {
						series.dummyData = newIndex;
						newIndex++;
					} else {
						series.dummyData = chart.series.indexOf(series);
					}
				})
				var visibleCount = newIndex;
				var newMiddle = visibleCount / 2;

				chart.series.each(function(series) {
						var trueIndex = chart.series.indexOf(series);
						var newIndex = series.dummyData;

						var dx = (newIndex - trueIndex + middle - newMiddle) * delta;

						series.animate({
							property: "dx",
							to: dx
						}, 
						series.interpolationDuration,
						series.interpolationEasing);
						
						series.bulletsContainer.animate({
							property: "dx",
							to: dx
						}, 
						series.interpolationDuration,
						series.interpolationEasing);
					})
			}
		}
	}
};


function buildLineChart(jsonData, libraries) {

	// Themes begin
	am4core.useTheme(am4themes_animated);
	// Themes end

	// Create chart instance
	var chart = am4core.create("linechartdiv", am4charts.XYChart);

	// chartExporting
	chart.exporting.menu = new am4core.ExportMenu();

	// Create axes
	var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
	var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

	// series를 구성하는 함수, 함수 인자로 도서관명을 담은 배열을 가져옴
	for (var i = 0; i < 3; i++) { // i 범위를 구성함에 따라 노출되는 값이 달라짐
		createSeries("value" + i, libraries[i]);
	}

	// Create series
	function createSeries(s, name) {
		var series = chart.series.push(new am4charts.LineSeries());
		series.dataFields.valueY = "value" + s;
		series.dataFields.dateX = "date";
		series.name = name;

		var segment = series.segments.template;
		segment.interactionsEnabled = true;

		var hoverState = segment.states.create("hover");
		hoverState.properties.strokeWidth = 3;

		var dimmed = segment.states.create("dimmed");
		dimmed.properties.stroke = am4core.color("#dadada");

		segment.events.on("over", function(event) {
			processOver(event.target.parent.parent.parent);
		});

		segment.events.on("out", function(event) {
			processOut(event.target.parent.parent.parent);
		});

		// json의 담긴 정보를 각 도서관명에 따라서 반복하여 배열에 넣어줌
		var data = [];
		var value = null;
		jsonData.forEach((item) => {
			if (name == item.도서관명) {
				value = item.방문자수;
				var year = item.방문일자.substring(0, 4);
				var month = item.방문일자.substring(4, 6);
				var day = item.방문일자.substring(6, 8);
				var dataItem = { date: new Date(Number(year), Number(month) - 1, Number(day)) };
				dataItem["value" + s] = value;
				data.push(dataItem);
			}
		});

		series.data = data;
		return series;
	}

	chart.legend = new am4charts.Legend();
	chart.legend.position = "bottom";
	chart.legend.scrollable = true;

	// setTimeout(function() {
	//   chart.legend.markers.getIndex(0).opacity = 0.3;
	// }, 3000)
	chart.legend.markers.template.states.create("dimmed").properties.opacity = 0.3;
	chart.legend.labels.template.states.create("dimmed").properties.opacity = 0.3;

	chart.legend.itemContainers.template.events.on("over", function(event) {
		processOver(event.target.dataItem.dataContext);
	})

	chart.legend.itemContainers.template.events.on("out", function(event) {
		processOut(event.target.dataItem.dataContext);
	})

	function processOver(hoveredSeries) {
		hoveredSeries.toFront();

		hoveredSeries.segments.each(function(segment) {
			segment.setState("hover");
		})

		hoveredSeries.legendDataItem.marker.setState("default");
		hoveredSeries.legendDataItem.label.setState("default");

		chart.series.each(function(series) {
			if (series != hoveredSeries) {
				series.segments.each(function(segment) {
					segment.setState("dimmed");
				})
				series.bulletsContainer.setState("dimmed");
				series.legendDataItem.marker.setState("dimmed");
				series.legendDataItem.label.setState("dimmed");
			}
		});
	}

	function processOut() {
		chart.series.each(function(series) {
			series.segments.each(function(segment) {
				segment.setState("default");
			})
			series.bulletsContainer.setState("default");
			series.legendDataItem.marker.setState("default");
			series.legendDataItem.label.setState("default");
		});
	}

	/*
	document.getElementById("button").addEventListener("click", function() {
		processOver(chart.series.getIndex(3));
	})
	*/
};

function buildPieChart(jsonData, dimension, measure) {

	// Themes begin
	am4core.useTheme(am4themes_animated);
	// Themes end

	// Create chart instance
	var chart = am4core.create("piechartdiv", am4charts.PieChart);

	// chartExporting
	chart.exporting.menu = new am4core.ExportMenu();

	// Add data
	chart.data = jsonData

	// Add and configure Series
	var pieSeries = chart.series.push(new am4charts.PieSeries());
	pieSeries.dataFields.value = measure;
	pieSeries.dataFields.category = dimension;
	pieSeries.slices.template.stroke = am4core.color("#fff");
	pieSeries.slices.template.strokeOpacity = 1;

	// This creates initial animation
	pieSeries.hiddenState.properties.opacity = 1;
	pieSeries.hiddenState.properties.endAngle = -90;
	pieSeries.hiddenState.properties.startAngle = -90;

	chart.hiddenState.properties.radius = am4core.percent(0);
};

var biggerChartSw = {barchartdiv : 0, linechartdiv : 0, piechartdiv : 0};

function biggerChart(btn) {
	
	var sw = btn.innerText;
	var target = btn.parentNode.parentNode.children[1].children[0];
	var targetId = target.id;
	
	if (sw == "+") {
		biggerChartSw[targetId] = 1;
		document.getElementById(targetId).setAttribute("style", "height : 770px;")
		btn.innerText = "-";
	} else {
		biggerChartSw[targetId] = 0;
		document.getElementById(targetId).setAttribute("style", "")
		btn.innerText = "+";
	}
}


function switchingCharts(btn) {
	
	var str = "";
	var absolute1stId = document.getElementsByClassName("z-card-info")[0].children[0].id;
	var absolute1stTitle = document.getElementsByClassName("z-card-title")[0].innerHTML;
	var targetTitle = btn.parentNode.parentNode.children[0].children[0].innerHTML;
	var target = btn.parentNode.parentNode.children[1];
	var targetId = target.children[0].id;
	
	str +=  "<div class='chartdiv' id='" + targetId + "'></div>"
	document.getElementsByClassName("z-card-info")[0].innerHTML = str;
	str = "";
	btn.parentNode.parentNode.children[0].children[0].innerHTML = absolute1stTitle;
	document.getElementsByClassName("z-card-title")[0].innerHTML = targetTitle;
	
	str +=  "<div class='chartdiv' id='" + absolute1stId + "'></div>"
	btn.parentNode.parentNode.children[1].innerHTML = str;
	
	
	document.getElementById(targetId).setAttribute("style", "height : 770px;")
	document.getElementsByClassName("z-card-footer")[0].children[0].innerText = "-";
	biggerChartSw[targetId] = 1;
	
	document.documentElement.scrollTop = 0;
}

 

