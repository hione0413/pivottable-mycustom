/*Chart code*/

function buildTheChart(jsonData, category, row) {
	// Themes begin
	am4core.useTheme(am4themes_animated);
	// Themes end

	var chart = am4core.create('chartdiv', am4charts.XYChart)

	chart.exporting.menu = new am4core.ExportMenu();

	chart.colors.step = 2;

	chart.legend = new am4charts.Legend()
	chart.legend.position = 'top'
	chart.legend.paddingBottom = 20
	chart.legend.labels.template.maxWidth = 95

	var xAxis = chart.xAxes.push(new am4charts.CategoryAxis())
	xAxis.dataFields.category = category;
	xAxis.renderer.cellStartLocation = 0.1
	xAxis.renderer.cellEndLocation = 0.9
	xAxis.renderer.grid.template.location = 0;

	var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
	yAxis.min = 0;
	
	function createSeries(value, name) {
		var series = chart.series
			.push(new am4charts.ColumnSeries())
		series.dataFields.valueY = value
		series.dataFields.categoryX = category;
		series.name = name

		// 막대별로 다른 색상을 가지게 하고 싶을 경우
		//  MEMO : 동일한 측정값을 가지는 막대의 경우 기본적으로는 같은 색상을 가지게됨
		series.columns.template.adapter.add("fill", function(fill, target) {
			return chart.colors.getIndex(target.dataItem.index);
		});

		series.events.on("hidden", arrangeColumns);
		series.events.on("shown", arrangeColumns);

		var bullet = series.bullets
			.push(new am4charts.LabelBullet())
		bullet.interactionsEnabled = false
		bullet.dy = 30;
		bullet.label.text = '{valueY}'
		bullet.label.fill = am4core.color('#ffffff')

		return series;
	}

	chart.data = jsonData;

	createSeries(row, row); // 두번째 인자 name으로 외부로 노출되는 텍스트를 변경할 수 있음

	function arrangeColumns() {

		var series = chart.series.getIndex(0);

		var w = 1 - xAxis.renderer.cellStartLocation
			- (1 - xAxis.renderer.cellEndLocation);
		if (series.dataItems.length > 1) {
			var x0 = xAxis.getX(series.dataItems.getIndex(0),
				"categoryX");
			var x1 = xAxis.getX(series.dataItems.getIndex(1),
				"categoryX");
			var delta = ((x1 - x0) / chart.series.length) * w;
			if (am4core.isNumber(delta)) {
				var middle = chart.series.length / 2;

				var newIndex = 0;
				chart.series.each(function(series) {
					if (!series.isHidden && !series.isHiding) {
						series.dummyData = newIndex;
						newIndex++;
					} else {
						series.dummyData = chart.series
							.indexOf(series);
					}
				})
				var visibleCount = newIndex;
				var newMiddle = visibleCount / 2;

				chart.series
					.each(function(series) {
						var trueIndex = chart.series
							.indexOf(series);
						var newIndex = series.dummyData;

						var dx = (newIndex - trueIndex
							+ middle - newMiddle)
							* delta

						series.animate({
							property: "dx",
							to: dx
						}, series.interpolationDuration,
							series.interpolationEasing);
						series.bulletsContainer.animate({
							property: "dx",
							to: dx
						}, series.interpolationDuration,
							series.interpolationEasing);
					})
			}
		}
	}
}