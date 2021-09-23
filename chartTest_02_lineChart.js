function buildTheChart(jsonData, libraries) {

	// Themes begin
	am4core.useTheme(am4themes_animated);
	// Themes end

	// Create chart instance
	var chart = am4core.create("chartdiv", am4charts.XYChart);

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
	chart.legend.position = "right";
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