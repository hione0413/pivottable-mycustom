var yearForExcelExport = [];
var libraries = ["본관", "디지털도서관", "어린이청소년도서관", "세종도서관"];
var inputVals = [];
var inputTags = [];
for (var i = 0; i < libraries.length; i++) {
	inputVals[i] = [0];
	inputTags[i] = [0];
};
var inputTagValSw = 0;

var _TABLE_PARAM = {
	table_first: {
		tableKey: "table_first",
		tableId: "totalTable",
		tbodyId: "totalTbody",
		dimensionFirstKey: "연도",
		tableColumnInfo: [{
			name: "연도",
			dimension: "연도",
			insertFlag: false,
			calcFunc: false
		}, {
			name: "개관일수",
			dimension: "본관",
			measure: "개관일수",
			insertFlag: true,
			calcFunc: false
		}, {
			name: "이용인원 이용자수",
			dimension: "본관",
			measure: "방문자수",
			insertFlag: true,
			calcFunc: false
		}, {
			name: "이용인원 일평균",
			insertFlag: false,
			calcFunc: function(pData) {
				return Math.round(pData["본관"]["방문자수"] / pData["본관"]["개관일수"]);
			}
		}, {
			name: "이용자료수 자료수",
			dimension: "본관",
			measure: "자료수",
			insertFlag: true,
			calcFunc: false
		}, {
			name: "이용자료수 일평균",
			insertFlag: false,
			calcFunc: function(pData) {
				return Math.round(pData["본관"]["자료수"] / pData["본관"]["개관일수"]);
			}
		}],
		// 입력기능이 존재하지 않는 row
		// nonInsertRow : [ 0, 1 ],
		nonInsertRow: [],
		// Table 에 합계 row가 존재하는 경우 true
		totalRowFlag: true
	}
}

var _tableData = {
	table_first: []
};

var _tableOriginData = {
	table_first: []
};

// TODO : 변수명 임시
function compareChangedTableValueTp2(tableKey) {
	var targetTableParam = _TABLE_PARAM[tableKey];
	var tbodyInfo = targetTableParam.tableColumnInfo;
	var totalRowFlag = targetTableParam.totalRowFlag;

	var targetData = _tableData[tableKey]; // 변경된 값 정보가 담긴 Array
	var originData = _tableOriginData[tableKey]; // 기존 값 정보가 담긴 Array

	var targetTotal = [];
	var originTotal = [];

	for (var i = 0; i < targetData.length; i++) {
		var targetDataObj = targetData[i];
		var originDataObj = originData[i];
		var headerValue = "";

		for (var j = 1; j < tbodyInfo.length; j++) {
			var tdInfoName = tbodyInfo[j].name;
			var tdDimension = tbodyInfo[j].dimension;
			var tdMeasure = tbodyInfo[j].measure;
			var cellInsertFlag = tbodyInfo[j].insertFlag;

			var targetCellValue = "";
			var originCellValue = "";

			if (tbodyInfo[j].calcFunc) {
				targetCellValue = tbodyInfo[j].calcFunc(targetDataObj);
				originCellValue = tbodyInfo[j].calcFunc(originDataObj);
			} else {
				if (tdDimension && tdMeasure) {
					targetCellValue = targetDataObj[tdDimension][tdMeasure];
					originCellValue = originDataObj[tdDimension][tdMeasure];
				}
			}

			var tdId = tableKey + "_" + i + "_" + j;

			if (cellInsertFlag) {
				// input
				var $inputId = $("#" + tdId).children("input");

				if (targetCellValue !== originCellValue) {
					// 값이 기존과 다름
					$inputId.css("color", "red");
				} else {
					// 값이 기존과 같음
					$inputId.css("color", "black");
				}
			} else {
				// td값 변경
				var tdId = tableKey + "_" + i + "_" + j;
				var $tdId = $("#" + tdId);
				$tdId.html(targetCellValue);

				if (targetCellValue !== originCellValue) {
					// 값이 기존과 다름
					$tdId.css("color", "red");
				} else {
					// 값이 기존과 같음
					$tdId.css("color", "black");
				}
			}

			// column 별로 합계값을 저장해둔다
			if (totalRowFlag) {
				var targetCellTotal = targetTotal[j] ? targetTotal[j]
					+ targetCellValue : targetCellValue;
				var originCellTotal = originTotal[j] ? originTotal[j]
					+ originCellValue : originCellValue;
				targetTotal[j] = targetCellTotal;
				originTotal[j] = originCellTotal;
			}

		} // for j end
	} // for i end

	if (totalRowFlag) {
		// 합계 비교
		for (var i = 0; i < targetTotal.length; i++) {
			var tdId = tableKey + "_total_" + i;
			var $tdId = $("#" + tdId);
			$tdId.html(targetTotal[i]);

			if (targetTotal[i] !== originTotal[i]) {
				// 값이 기존과 다름
				$tdId.css("color", "red");
			} else {
				// 값이 기존과 같음
				$tdId.css("color", "black");
			}
		}

	}

}

// Table 에서 Input Event Handle : 변경한 부분의 데이터를 전역 변수에서 수정해준다
// MEMO : input 이벤트는 IE 9 이상부터 지원 -> 사용자 브라우저 버전 확인할 것
function handleChangeTableCellValueTp2(event, tableKey, dimFirstKey,
	dimFirstVal, dimSecond, measure) {
	var target = event.target;
	var targetValue = target.value;
	var inputId = tableKey + '_' + dimFirstVal + '_' + dimSecond + '_'
		+ measure;
	var $input = $("#" + inputId)

	if (event.which
		&& (event.which > 47 && event.which < 58 || event.which === 8)) {
		// console.log("숫자임");
	} else {
		// console.log("숫자아님");
		return;
	}

	var tableData = _tableData[tableKey];

	for (var i = 0; i < tableData.length; i++) {
		if (tableData[i][dimFirstKey] == dimFirstVal) {
			tableData[i][dimSecond][measure] = parseInt(target.value);
			break;
		}
	}

	compareChangedTableValueTp2(tableKey);
}

// 좌측 Header 가 차원인 일반 Table 생성
function createTableLeftDimension(data, tableParam) {
	var changedValueCss = 'style="color: red;"';

	var tableKey = tableParam.tableKey;
	var tableId = tableParam.tableId;
	var tbodyId = tableParam.tbodyId;
	var dimensionFirstKey = tableParam.dimensionFirstKey;

	var tableColumnInfo = tableParam.tableColumnInfo;
	var nonInsertRow = tableParam.nonInsertRow;
	var totalRowFlag = tableParam.totalRowFlag;

	var temp = [];
	var totalTemp = []; // 합계를 구하기 위해 데이터를 보관

	// 1. 데이터의 length 만큼 temp arr 에 table의 td 정보를 담을 Arr 를 준비해준다.
	for (var i = 0; i < data.length; i++) {
		temp[i] = [];
	}

	// 2. <td> String 을 생성한 뒤 
	//  -> insertTableColumnName를 참조하여 객체별로 분류 
	//  -> temp 배열에 쌓아준다
	for (var i = 0; i < data.length; i++) {
		var dataObj = data[i];
		var dimFirstKey = dimensionFirstKey;
		var dimFirstVal = dataObj[dimensionFirstKey];
		var dimKey = "";
		var meaKey = "";

		for (var j = 0; j < tableColumnInfo.length; j++) {
			var cellInfoObj = tableColumnInfo[j];
			var cellName = cellInfoObj.name;

			var cellDimension = cellInfoObj.dimension;
			var cellMeasure = cellInfoObj.measure;
			var cellInsertFlag = cellInfoObj.insertFlag;

			var cellValue = ""; // data[i][cellName];
			var cellHtml = "";

			if (cellInfoObj.calcFunc) {
				// 계산이 필요한 cell
				cellValue = cellInfoObj.calcFunc(dataObj);
			} else if (cellDimension && cellMeasure) {
				dimKey = cellDimension;
				meaKey = cellMeasure;
				cellValue = dataObj[cellDimension][cellMeasure];
			} else if (cellDimension) {
				dimKey = cellDimension;
				cellValue = dataObj[cellDimension];
			}

			var tdId = tableKey + "_" + i + "_" + j;

			if (cellInsertFlag && nonInsertRow.indexOf(i) === -1) {
				// (1) 입력셀
				var cellInput = '<input type="number" class="form-control" value="'
					+ cellValue + '" ' + ' id="' + tableKey + '_' + dimFirstVal + '_'
					+ dimKey + '_' + meaKey + '" '
					+ ' onKeyup="handleChangeTableCellValueTp2(event, \'' + tableKey
					+ '\', \'' + dimFirstKey + '\', \'' + dimFirstVal + '\', \''
					+ dimKey + '\', \'' + meaKey + '\')"/>';

				cellHtml = '<td id="' + tdId + '">' + cellInput + "</td>";
			} else if (j == 0) {
				cellHtml = '<th id="' + tdId + '">' + cellValue + "</th>";
			} else {
				// (2) 일반셀
				cellHtml = '<td id="' + tdId + '">' + cellValue + "</td>";
			}

			// column 별로 합계값을 저장해둔다
			if (totalRowFlag) {
				var cellTotla = totalTemp[j] ? totalTemp[j] + cellValue : cellValue;
				totalTemp[j] = cellTotla;
			}

			temp[i].push(cellHtml);
		}
	}

	// 3. 쌓아둔 temp 를 Table tbody에 담을 html로 변환한다
	var tempHtml = "";
	for (var i = 0; i < temp.length; i++) {
		tempHtml += "<tr>" + temp[i].join("") + "</tr>"
	}

	// 합계(Total) Row 생성
	if (totalRowFlag) {
		tempHtml += "<tr><th>계</th>";
		for (var i = 1; i < totalTemp.length; i++) {
			var totalTdId = tableKey + "_total_" + i;
			tempHtml += '<td id="' + totalTdId + '">' + totalTemp[i] + "</td>";
		}
		tempHtml += "</tr>";
	}

	// 4. 테이블 생성
	$("#" + tbodyId).empty();
	$("#" + tbodyId).html(tempHtml);
}

/**
 * 순서가 보존되어야 하므로 Arr 값 반환
 * dimFirst : key - 차원1
 * dimSecond : 차원2
 * measureArr : 측정값 str 배열
 */
function realignDataByDoubleDimension(data, dimFirst, dimSecond, measureArr) {
	var result = [];
	var tempObj = {};

	for (var i = 0; i < data.length; i++) {
		var rowData = data[i];

		// 0. dimension First 값이 기존과 다를 경우 obj -> arr에 저장 후 초기화
		if (tempObj[dimFirst] && tempObj[dimFirst] !== rowData[dimFirst]) {
			result.push(tempObj);
			tempObj = {};
		}

		// 1. dimension First 값 세팅
		if (!tempObj[dimFirst]) {
			tempObj[dimFirst] = rowData[dimFirst];
		}

		// 2. dimension Second 값을 세팅할 obj 생성
		if (!tempObj[rowData[dimSecond]]) {
			tempObj[rowData[dimSecond]] = {};
		}

		// 3. dimension Second 내용 중 key값이 없으면 세팅

		for (var j = 0; j < measureArr.length; j++) {
			tempObj[rowData[dimSecond]][measureArr[j]] = rowData[measureArr[j]];
		}

		// result = [
		//     {
		//         "연도": 2018,
		//         "본관": {
		//             "방문자수": 1,
		//             "개관일수": 1
		//         }, ...
		//     }
		// ]

		// 3. 마지막 obj -> arr 저장
		if (i === data.length - 1) {
			result.push(tempObj);
		}
	}

	return result;
}

function checkTableEditedYn(data, keyName, flag) {
	for (var i = 0; i < data.length; i++) {
		if (data[i][keyName] === flag) {
			return false;
		}
	}
	return true;
}

/* 테이블 최초 생성 */
function initTableLeftDimension(data, dimFirst, dimSecond, measureArr,
	tableParam) {
	// 0. 저장 버튼 활성 비활성 여부 판단
	var insertYn = checkTableEditedYn(data, "입력YN", "N");

	// 1. 데이터를 테이블로 만들기 좋게 변환
	var alignedData = realignDataByDoubleDimension(data, dimFirst, dimSecond,
		measureArr);

	// 2. 페이지 별로 테이블 파라메터 세팅
	_tableData[tableParam.tableKey] = alignedData;
	_tableOriginData[tableParam.tableKey] = JSON.parse(JSON
		.stringify(alignedData)); // 깊은복사

	// 3. 테이블 생성
	createTableLeftDimension(alignedData, tableParam);

}


$("#btnExcelDownload").click(function(e) {
	tableToExcel();
});

$("#conversion").click(function(e) {
	console.log("conversion");
	var str1 = "table_first_";
	var str3 = "_방문자수";
	for (var i in yearForExcelExport) {
		// console.log(yearForExcelExport[i]);
		for (var j = 0; j < libraries.length; j++) {
			var str2 = yearForExcelExport[i] + "_" + libraries[j];
			var id = str1 + str2 + str3;
			// console.log($('#' + id));
			// console.log($('#' + id).val());
			inputTags[i][j] = $('#' + id).parent().html();
			inputVals[i][j] = $('#' + id).val();
			$('#' + id).parent().html(inputVals[i][j]);
		}
	}
	console.log(inputTags);
	inputTagValSw = 1;
});
// 테이블 엑셀 다운로드를 위한 배열
// yearForExcelExport[i] = thCellValue; 
// 연도를 추가하는 식

$("#inversion").click(function(e) {
	console.log("inversion");
	var str1 = "table_first_";
	var str3 = "_방문자수";
	for (var i in yearForExcelExport) {
		// console.log(yearForExcelExport[i]);
		for (var j = 0; j < libraries.length; j++) {
			console.log(inputTags[i][j]);
			var str2 = yearForExcelExport[i] + "_" + libraries[j];
			var id = str1 + str2 + str3;
			$('#' + id).parent().html(inputTags[i][j]);
		}
	}
	inputTagValSw = 0;
});