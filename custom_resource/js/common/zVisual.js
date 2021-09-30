/*************************************************************/
/***       0. Filter Setting Start           ***/
/*************************************************************/

var _CONTEXT_PATH = "";

$( document ).ready(function() {
    // MEMO : 필터 id는 가능한 통일

    // Datapicker setting start
    var datapickerFormat = "yyyy-mm-dd";
    var $startDt = $("#startDt");
    var $endDt = $("#endDt");

    if($startDt.length > 0) {
        $startDt.datepicker({
            format: datapickerFormat,
            language: 'kr'
        });
    }
    if($endDt.length > 0) {
        $endDt.datepicker({
            format: datapickerFormat,
            language: 'kr'
        });
    }
    // Datapicker setting End


    // iCheck setting Start 
    $("input[name=check]").iCheck({
        radioClass: 'iradio_square-blue'
    });
    // iCheck setting End

});


// 현재 선택된 필터 데이터들을 정리해서 obj 로 반환
function getSelFilterValObj() {
    var startDtVal = $("#startDt").length > 0? $("#startDt").val() : "";
    var endDtVal = $("#endDt").length > 0? $("#endDt").val() : "";

    // TODO : 필터 종류 추가되면 여기에도 추가

    return {
        startDtVal: startDtVal,
        endDtVal: endDtVal
    };
}

// TODO : 코드 정보 가져오기
function getCodeList(codeTp) {
    switch (codeTp) {
        case 1: break;
        default: return ["국내서", "서양서", "일본서", "중국서", "기타"];
    }
}


// TODO : progressFlag : true - 시작, false - 종료
function toggleLoadingProgress(progressFlag) {

}

/*************************************************************/
/***       0. Filter Setting End           ***/
/*************************************************************/

/*************************************************************/
/***       1. Pivot Table Start      ***/
/*************************************************************/

/**
 * @searchCond : 검색조건
 * @tableId : 피벗테이블을 생성할 target <table> id
 * @rows : 좌측에 위치할 차원
 * @cols : 상단에 위치할 차원
 * @vals : 측정값
*/
function createPivotTableByGetAjax(searchCond, tableId, rows, cols, vals) {
    $.ajax({ 
        url: _CONTEXT_PATH + "/{root}/module/{menuCode}_pivottable_list.do",
        data: searchCond,
        method: "GET",
        dataType: "json", // 서버에서 보내줄 데이터의 타입 
        beforeSend : function() {
			// Loading 에 의한 프로시저 시작
            toggleLoadingProgress(true);
		},
        success : function(data, textStatus, jqXHR) {
            var dataSet = data;
            
            $("#" + tableId).pivotUI(
                dataSet,
                {
                    rows: rows,
                    cols: cols,
                    vals: vals,
                    hiddenFromDragDrop: vals,
                    aggregatorName: "Integer Sum",
                    rendererName: "Heatmap",
                    onRefresh: function () {
                        // 차트 생성될 때 호출되는 익명함수
                    },
                    sorters: {  // 정렬
                        "성별": $.pivotUtilities.sortAs(["남성", "여성"]),
                        "연령별": $.pivotUtilities.sortAs(["10대이하"]),
                    }
                }
            );
            
        },
        error : function(jqXHR, textStatus, errorThrown) {
            // TODO : Error 처리
		},
        complete: function(data) { 
            // Loading End
            toggleLoadingProgress(false);
        }
    });
};

/*************************************************************/
/***       1. Pivot Table End      ***/
/*************************************************************/


/*************************************************************/
/***       2-3. Dimension Submit Table 공통코드 Start      ***/
/*************************************************************/

// 화면에서 수정된 내용이 반영된 테이블의 Data 정보
var _tableData = {};

// 수정내용이 반영되지 않은 테이블의 기존 Data 정보
var _tableOriginData = {};

// 직접 DB에 입력될 수정된 내용 정보
var _tableChangedData = {};


function checkTableEditedYn(data, keyName, flag) {
    for (var i = 0; i < data.length; i++) {
        if (data[i][keyName] === flag) {
            return false;
        }
    }
    return true;
}


// MEMO : 보안 이슈로 제출, 취소 버튼은 각 페이지에서 독립적으로 작성할 것인지 고민 중
function handleClickSubmitTableCancleBtn(tableKey) {
    console.log("[handleClickSubmitTableCancleBtn] tableKey", tableKey);
    console.log("click cancle btn");

    $.ajax({ 
        url: _CONTEXT_PATH + "/{root}/module/{menuCode}_submittable_delete.do",
        data: {
            changedValue : _tableChangedData[tableKey]
        },
        method: "POST",
        dataType: "json", // 서버에서 보내줄 데이터의 타입 
        beforeSend : function() {
			// Loading 에 의한 프로시저 시작
            toggleLoadingProgress(true);
		},
        success : function(data, textStatus, jqXHR) {
            
        
        },
        error : function(jqXHR, textStatus, errorThrown) {
            // TODO : Error 처리
		},
        complete: function(data) { 
            // Loading End
            toggleLoadingProgress(false);
        }
    });
}


function handleClickSubmitTableSubmitBtn(tableKey) {
    console.log("[handleClickSubmitTableSubmitBtn] tableKey", tableKey);
    console.log("click submit btn", _tableChangedData);

    if (Object.keys(_tableChangedData).length === 0) {
        alert("변경된 내용이 없습니다.");
        return;
    }

    $.ajax({ 
        url: _CONTEXT_PATH + "/{root}/module/{menuCode}_submittable_save.do",
        data: {
            changedValue : _tableChangedData[tableKey]
        },
        method: "POST",
        dataType: "json", // 서버에서 보내줄 데이터의 타입 
        beforeSend : function() {
			// Loading 에 의한 프로시저 시작
            toggleLoadingProgress(true);
		},
        success : function(data, textStatus, jqXHR) {
            
        
        },
        error : function(jqXHR, textStatus, errorThrown) {
            // TODO : Error 처리
		},
        complete: function(data) { 
            // Loading End
            toggleLoadingProgress(false);
        }
    });
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

        // Ex : 데이터 정리 결과
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

/**
 * @dimDirection : Boolean 디멘전 방향 true-top, false-left
 * @dimFirst : 메인 차원 ex) 연도, 개월 etc...
 * @dimSecond : 서브 차원 ex) 도서관 종류 등
 * @measureArr : Arr 측정값 목록
 * @tableParam : 각 Table 이 가지는 고유 정보
*/
function createSubmitTableByGetAjax(searchCond, dimDirection, dimFirst, dimSecond, measureArr, tableParam) {
    $.ajax({ 
        url: _CONTEXT_PATH + "/{root}/module/{menuCode}_submittable_list.do",
        data: searchCond,
        method: "GET",
        dataType: "json", // 서버에서 보내줄 데이터의 타입 
        beforeSend : function() {
			// Loading 에 의한 프로시저 시작
            toggleLoadingProgress(true);
		},
        success : function(data, textStatus, jqXHR) {
            var dataSet = data;
            
            if(dimDirection) {
                // 메인 차원이 상단에 위치한 테이블
                initTableTopDimension(dataSet, dimFirst, dimSecond, measureArr, tableParam);
            } else {
                // 메인 차원이 좌측에 위치한 테이블
                initTableLeftDimension(dataSet, dimFirst, dimSecond, measureArr, tableParam)
            }
            
        },
        error : function(jqXHR, textStatus, errorThrown) {
            // TODO : Error 처리
		},
        complete: function(data) { 
            // Loading End
            toggleLoadingProgress(false);
        }
    });
};

/*************************************************************/
/***         2-3. Dimension Submit Table 공통코드 End      ***/
/*************************************************************/


/*************************************************************/
/***        2. Top Dimension Submit Table Start           ***/
/*************************************************************/

/*** 첫번째 차원(ex 연도, 월, 방문횟수 등)이  상단에 위치한 입력 테이블   ****/

// 변경된 값과 처음 테이블을 생성했을 때 데이터 값을 비교
function compareChangedTableValue(tableKey) {
    var targetTableParam = _TABLE_PARAM[tableKey];
    var tbodyInfo = targetTableParam.tbodyInfo;
    var theadInfo = targetTableParam.theadInfo;

    var targetData = _tableData[tableKey]; // 변경된 값 정보가 담긴 Array
    var originData = _tableOriginData[tableKey]; // 기존 값 정보가 담긴 Array

    var changedDataList = [];

    for (var i = 0; i < targetData.length; i++) {
        var targetDataObj = targetData[i];
        var originDataObj = originData[i];
        var headerKey = "";
        var headerValue = "";

        for (var j = 0; j < theadInfo.length; j++) {
            var thDimension = theadInfo[j].dimension;
            var thCellValue = targetDataObj[thDimension];
            headerKey = thDimension;
            headerValue = thCellValue;
        }

        for (var j = 0; j < tbodyInfo.length; j++) {
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
                var inputId = tableKey + "_" + headerValue + "_" + tdDimension + "_" + tdMeasure;
                var $inputId = $("#" + inputId);

                if (targetCellValue !== originCellValue) {
                    // 값이 기존과 다름
                    $inputId.css("color", "red");

                    // 변경된 값들 정보 가지고 있기
                    var changedDataObj = {
                        "dimensionFirst": headerKey,
                        "dimensionFirstValue": headerValue,
                        "dimensionSecond": tdDimension,
                        "measure": tdMeasure,
                        "changedMeasureValue": targetCellValue,
                    };
                    changedDataList.push(changedDataObj);

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
        } // for j end
    } // for i end

    _tableChangedData[tableKey] = changedDataList;

} // function compareChangedTableValue end


// Table 에서 Input Event Handle : 변경한 부분의 데이터를 전역 변수에서 수정해준다
// MEMO : input 이벤트는 IE 9 이상부터 지원 -> 사용자 브라우저 버전 확인할 것
function handleChangeTableCellValue(event, tableKey, dimFirstKey, dimFirstVal, dimSecond, measure) {
    var target = event.target;
    var targetValue = target.value;
    var inputId = tableKey + '_' + dimFirstVal + '_' + dimSecond + '_' + measure;
    var $input = $("#" + inputId)

    if (event.which && (event.which > 47 && event.which < 58 || event.which === 8)) {
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

    compareChangedTableValue(tableKey);
}


// 상단 Header 가 차원인 일반 Table 생성
function createTableTopDimension(data, tableParam) {
    var tableKey = tableParam.tableKey;

    var theadHtmlArr = JSON.parse(JSON.stringify(tableParam.theadHtmlArr)); // 깊은 복사
    var theadInfo = tableParam.theadInfo;

    var tbodyHtmlArr = JSON.parse(JSON.stringify(tableParam.tbodyHtmlArr)); // 깊은 복사
    var tbodyInfo = tableParam.tbodyInfo;

    for (var i = 0; i < data.length; i++) {
        var dataObj = data[i];
        var headerKey = "";
        var headerValue = "";
        var dimKey = "";
        var meaKey = "";

        // 1. table header 생성 : 해당 차트의 dimension 1
        for (var j = 0; j < theadInfo.length; j++) {
            var thDimension = theadInfo[j].dimension;
            var thCellValue = dataObj[thDimension];
            var thCellHtml = '<th>' + thCellValue + '</th>';
            theadHtmlArr[j].push(thCellHtml);
            headerKey = thDimension;
            headerValue = thCellValue;
        }

        // 2. table cell 생성 : dimension 2와 measure
        for (var j = 0; j < tbodyInfo.length; j++) {
            var tdInfoName = tbodyInfo[j].name;
            var tdDimension = tbodyInfo[j].dimension;
            var tdMeasure = tbodyInfo[j].measure;
            var cellInsertFlag = tbodyInfo[j].insertFlag;
            var tdCellValue = "";
            var tdCellHtml = "";

            if (tbodyInfo[j].calcFunc) {
                // 계산이 필요한 cell
                tdCellValue = tbodyInfo[j].calcFunc(dataObj);
            } else {
                if (tdDimension && tdMeasure) {
                    dimKey = tdDimension;
                    meaKey = tdMeasure;
                    tdCellValue = dataObj[tdDimension][tdMeasure];
                }
            }

            var tdId = tableKey + "_" + i + "_" + j;

            if (cellInsertFlag) {
                // (1) 입력셀
                var tdCellInput = '<input type="number" class="form-control" value="' + tdCellValue + '" ' + ' id="' + tableKey + '_' + headerValue + '_' + dimKey + '_' + meaKey + '" '
                    + ' onKeyup="handleChangeTableCellValue(event, \'' + tableKey + '\', \'' + headerKey + '\', \'' + headerValue + '\', \'' + dimKey + '\', \'' + meaKey + '\')"/>';
                tdCellHtml = '<td id="' + tdId + '">' + tdCellInput + "</td>";
            } else {
                // (2) 일반셀
                tdCellHtml = '<td id="' + tdId + '">' + tdCellValue + '</td>';
            }

            tbodyHtmlArr[j].push(tdCellHtml);
        }

    } // for end

    theadHtmlArr.push("</tr>");
    tbodyHtmlArr.push("</tr>");

    $("#" + tableParam.theadId).empty();
    $("#" + tableParam.tbodyId).empty();
    $("#" + tableParam.theadId).html(theadHtmlArr.join());
    $("#" + tableParam.tbodyId).html(tbodyHtmlArr.join());
}


// 테이블 최초 생성
function initTableTopDimension(data, dimFirst, dimSecond, measureArr, tableParam) {
    // 0. 저장 버튼 활성 비활성 여부 판단
    var insertYn = checkTableEditedYn(data, "입력YN", "N");

    // TODO : 0-1. 버튼 활성 비활성 처리 및 이벤트 부착
    var tableKey = tableParam.tableKey;
    var btnCancleId = tableParam.btnCancleId;
    var btnSubmitId = tableParam.btnSubmitId;
    var $btnSubmitId = $("#" + btnSubmitId);

    if (typeof (insertYn) === Boolean && insertYn) {
        $btnSubmitId.attr("disabled", false);
    } else {
        $btnSubmitId.attr("disabled", true);
    }

    $("#" + btnCancleId).click(function () {
        // 취소 버튼 클릭
        handleClickSubmitTableCancleBtn(tableKey);
    });

    $btnSubmitId.click(function () {
        // 제출 버튼 클릭
        handleClickSubmitTableSubmitBtn(tableKey);
    });


    // 1. 데이터를 테이블로 만들기 좋게 변환
    var alignedData = realignDataByDoubleDimension(data, dimFirst, dimSecond, measureArr);

    // 2. 페이지 별로 테이블 파라메터 세팅
    _tableData[tableParam.tableKey] = alignedData;
    _tableOriginData[tableParam.tableKey] = JSON.parse(JSON.stringify(alignedData)); // 깊은복사

    // 3. 테이블 생성
    createTableTopDimension(alignedData, tableParam);

}



/*************************************************************/
/***         2. Top Dimension Submit Table End           ***/
/*************************************************************/


/*************************************************************/
/***         3. Left Dimension Submit Table Start           ***/
/*************************************************************/
/*** 첫번째 차원(ex 연도, 월, 방문횟수 등)이  좌측에 위치한 입력 테이블   ****/

// 변경된 값과 처음 테이블을 생성했을 때 데이터 값을 비교
function compareChangedTableValueTp2(tableKey) {
    var targetTableParam = _TABLE_PARAM[tableKey];
    var tbodyInfo = targetTableParam.tableColumnInfo;
    var totalRowFlag = targetTableParam.totalRowFlag;

    var targetData = _tableData[tableKey]; // 변경된 값 정보가 담긴 Array
    var originData = _tableOriginData[tableKey]; // 기존 값 정보가 담긴 Array

    var targetTotal = [];
    var originTotal = [];

    var changedDataList = [];

    for (var i = 0; i < targetData.length; i++) {
        var targetDataObj = targetData[i];

        console.log("targetDataObj", targetDataObj);


        var originDataObj = originData[i];
        var headerKey = targetTableParam.dimensionFirstKey;
        var headerValue = targetDataObj[headerKey];

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

                    // 변경된 값들 정보 가지고 있기
                    var changedDataObj = {
                        "dimensionFirst": headerKey,
                        "dimensionFirstValue": headerValue,
                        "dimensionSecond": tdDimension,
                        "measure": tdMeasure,
                        "changedMeasureValue": targetCellValue,
                    };
                    changedDataList.push(changedDataObj);

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
                var targetCellTotal = targetTotal[j] ? targetTotal[j] + targetCellValue : targetCellValue;
                var originCellTotal = originTotal[j] ? originTotal[j] + originCellValue : originCellValue;
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

    _tableChangedData[tableKey] = changedDataList;

} // function compareChangedTableValueTp2 End


// Table 에서 Input Event Handle : 변경한 부분의 데이터를 전역 변수에서 수정해준다
// MEMO : input 이벤트는 IE 9 이상부터 지원 -> 사용자 브라우저 버전 확인할 것
function handleChangeTableCellValueTp2(event, tableKey, dimFirstKey, dimFirstVal, dimSecond, measure) {
    var target = event.target;
    var targetValue = target.value;
    var inputId = tableKey + '_' + dimFirstVal + '_' + dimSecond + '_' + measure;
    var $input = $("#" + inputId)

    if (event.which && (event.which > 47 && event.which < 58 || event.which === 8)) {
        // console.log("숫자임");
    } else {
        // console.log("숫자아님");
        return;
    }

    var tableData = _tableData[tableKey];

    for (var i = 0; i < tableData.length; i++) {
        if (tableData[i][dimFirstKey] == dimFirstVal) {
            tableData[i][dimSecond][measure] = parseInt(targetValue);
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
                var cellInput = '<input type="number" class="form-control" value="' + cellValue + '" ' + ' id="' + tableKey + '_' + dimFirstVal + '_' + dimKey + '_' + meaKey + '" '
                    + ' onKeyup="handleChangeTableCellValueTp2(event, \'' + tableKey + '\', \'' + dimFirstKey + '\', \'' + dimFirstVal + '\', \'' + dimKey + '\', \'' + meaKey + '\')"/>';
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


/* 테이블 최초 생성 */
function initTableLeftDimension(data, dimFirst, dimSecond, measureArr, tableParam) {
    // 0. 저장 버튼 활성 비활성 여부 판단
    var insertYn = checkTableEditedYn(data, "입력YN", "N");

    // 1. 데이터를 테이블로 만들기 좋게 변환
    var alignedData = realignDataByDoubleDimension(data, dimFirst, dimSecond, measureArr);

    // 2. 페이지 별로 테이블 파라메터 세팅
    _tableData[tableParam.tableKey] = alignedData;
    _tableOriginData[tableParam.tableKey] = JSON.parse(JSON.stringify(alignedData)); // 깊은복사

    // 3. 테이블 생성
    createTableLeftDimension(alignedData, tableParam);

}

/*************************************************************/
/***         3. Left Dimension Submit Table End           ***/
/*************************************************************/


/*************************************************************/
/***         4-5. DataTable Common Start           ***/
/*************************************************************/
/**
 * @searchCond : 검색 조건 정보를 담은 JSON 
 * @tableId : 테이블을 그릴 Target <table> id
 * @columnInfo : DataTable 칼럼 기본 정보
 * @columnDefs : DataTable 칼럼 커스텀 정보
 * @tableParamObj : DataTable 생성 파라메터
 * @pivotFlag : Boolean - 테이블 dimension 데이터 Pivot true, false
 * @pivotParamObj : Pivot 테이블일 경우 데이터 정립에 필요한 파라메터 정보를 담은 JSON
*/
function createDataTableByGetAjax(searchCond, tableId, columnInfo, columnDefs, tableParamObj, pivotFlag, pivotParamObj) {
    $.ajax({ 
        url: _CONTEXT_PATH + "/{root}/module/{menuCode}_datatable_list.do",
        data: searchCond,
        method: "GET",
        dataType: "json", // 서버에서 보내줄 데이터의 타입 
        beforeSend : function() {
			// Loading 에 의한 프로시저 시작
            toggleLoadingProgress(true);
		},
        success : function(data, textStatus, jqXHR) {
            // DataTable 그리기
            var dataSet = data;

            if(pivotFlag) {
                // 피벗 테이블의 경우 데이터 재정립
                dataSet = realignDataToPivot(
                    dataSet, 
                    pivotParamObj.leftDimension, 
                    pivotParamObj.topDimension, 
                    pivotParamObj.measure
                );

                // 1. table 상단 Column 으로 입력될 code 목록
                var codeArr = getCodeList(pivotParamObj.codeType);

                // (2) 코드
                for (var i = 0; i < codeArr.length; i++) {
                    columnInfo.push({
                        target: i + 2,
                        tHeaderName: codeArr[i],
                        dataColumnName: codeArr[i]
                    });
                }
            }

            // 테이블 생성
            createDataTableDefault(tableId, dataSet, columnInfo, columnDefs, tableParamObj);
        },
        error : function(jqXHR, textStatus, errorThrown) {
            // TODO : Error 처리
		},
        complete: function(data) { 
            // Loading End
            toggleLoadingProgress(false);
        }
    });
}

/*************************************************************/
/***         4-5. DataTable Common End           ***/
/*************************************************************/


/*************************************************************/
/***         4. DataTable Type Default Start           ***/
/*************************************************************/

// Create Data Table(default) Start
function createDataTableDefault(tableId, dataSet, columnInfo, columnDefs, tableParamObj) {
    // 0. 파라메터 준비
    var rowNumFlag = tableParamObj.rowNumFlag; // No 칼럼 default : false
    var pagingFlag = tableParamObj.pagingFlag ? tableParamObj.pagingFlag : false; // 페이징 default : false
    // 데이터가 각 페이지에서 설정한 특정값 이상일 경우 강제로 페이징처리
    var pagingTurningPoint = tableParamObj.pagingTurningPoint ? tableParamObj.pagingTurningPoint : false;

    // 1. column info 정보를 토대로 아래와 같은 작업 진행
    var theaderStrArr = ["<thead><tr>"];
    var columnsArr = [];

    for (var i = 0; i < columnInfo.length; i++) {
        var tHeaderName = columnInfo[i].tHeaderName;
        var dataColumnName = columnInfo[i].dataColumnName;

        // (1) Table theader html 준비
        theaderStrArr.push("<th>" + tHeaderName + "</th>");

        // (2) columns Arr 준비
        columnsArr.push({
            data: dataColumnName,
            defaultContent: 0
        });
    }

    theaderStrArr.push("</tr></thead>");

    // (3) DataTable Param Object 작성
    var dataTableParam = {
        data: dataSet,
        scrollY: "350px",   // y scroll
        scrollCollapse: true, // y scroll
        paging: pagingFlag, // y scroll
        columns: columnsArr,
        columnDefs: columnDefs,
        // drawCallback: function () {
        //     $("#" + tableId + " tbody td").not(":nth-child(1),:nth-child(2)").colorize();
        // }
    }

    if (pagingTurningPoint && dataSet.length > pagingTurningPoint) {
        dataTableParam.paging = true;
    }

    // 2. Table theader 생성
    var $targetTable = $("#" + tableId);
    $targetTable.empty();
    $targetTable.append(theaderStrArr.join(""));

    // 3. DataTable 생성
    var t = $targetTable.DataTable(dataTableParam);

    // No 값 자동생성
    if (rowNumFlag) {
        t.on('order.dt search.dt', function () {
            t.column(0, { search: 'applied', order: 'applied' }).nodes().each(function (cell, i) {
                cell.innerHTML = i + 1;
            });
        }).draw();
    }
} // function createDataTableDefault End

// Create Data Table(default) End

/*************************************************************/
/***         4. DataTable Type Default End           ***/
/*************************************************************/


/*************************************************************/
/***         5. DataTable Type Pivot Start           ***/
/*************************************************************/

/**
 * 데이터 Pivot으로 재정렬
 * @pData : Pivot할 대상 데이터
 * @leftDimension : 차원1 - 테이블의 row 첫번째 cell 값에 해당
 * @topDimension : 차원2 - 테이블의 column 에 해당
 * @measure : 측정값
*/
function realignDataToPivot(pData, leftDimension, topDimension, measure) {
    var result = [];
    var tempObj = {};

    for (var i = 0; i < pData.length; i++) {
        var rowData = pData[i];

        // 0. dimension First 값이 기존과 다를 경우 obj -> arr에 저장 후 초기화
        if (tempObj[leftDimension] && tempObj[leftDimension] !== rowData[leftDimension]) {
            result.push(tempObj);
            tempObj = {};
        }

        // 1. left dimension 값 세팅
        if (!tempObj[leftDimension]) {
            tempObj[leftDimension] = rowData[leftDimension];
        }

        // 2. topDimension : measure 값 세팅
        if (!tempObj[rowData[topDimension]]) {
            tempObj[rowData[topDimension]] = rowData[measure];
        }

        // 3. 마지막 obj -> arr 저장
        if (i === pData.length - 1) {
            result.push(tempObj);
        }
    }

    return result;
}

/*************************************************************/
/***         5. DataTable Type Pivot End           ***/
/*************************************************************/


/*************************************************************/
/***         6. Chart Start           ***/
/*************************************************************/

/**
 * @chartType : Chart 타입 ex) bar, line, pie, donut etc...
 * @searchCond : 검색조건
 * @targetDivId : 차트를 생성할 div
 * @chartParam : 차트 파라메터
 * @dataAlignCallback : 데이터의 변형이 필요할 경우 callback 함수로 정리해준다
*/
function createChartByGetAjax(chartType, searchCond, targetDivId, chartParam, dataAlignCallback) {
    $.ajax({ 
        url: _CONTEXT_PATH + "/{root}/module/{menuCode}_chartdata_list.do",
        data: searchCond,
        method: "GET",
        dataType: "json", // 서버에서 보내줄 데이터의 타입 
        beforeSend : function() {
			// Loading 에 의한 프로시저 시작
            toggleLoadingProgress(true);
		},
        success : function(data, textStatus, jqXHR) {
            var dataSet = data;
            
            if(dataAlignCallback) {
                dataSet = dataAlignCallback(dataSet);
            }

            switch (chartType) {
                case "bar":
                    buildBarChart(targetDivId, dataSet, chartParam);
                    break;
                case "line":
                    buildBarChart(targetDivId, dataSet, chartParam);
                    break;
                case "pie":
                    buildPieChart(targetDivId, dataSet, chartParam);
                    break;
                default:
                    break;
            };
            
        },
        error : function(jqXHR, textStatus, errorThrown) {
            // TODO : Error 처리
		},
        complete: function(data) { 
            // Loading End
            toggleLoadingProgress(false);
        }
    });
};



/*Chart code*/

function buildBarChart(targetDivId, jsonData, chartParam) {
    var dimension = chartParam.dimension;
    var measure = chartParam.measure;
    var measureName = chartParam.measureName? chartParam.measureName : chartParam.measure;
    var legendFlag = chartParam.legendFlag;
    var legendPosition = chartParam.legendPosition? chartParam.legendPosition : "bottom";

	// Themes begin
	am4core.useTheme(am4themes_animated);
	// Themes end

	var chart = am4core.create(targetDivId, am4charts.XYChart);

	// chartExporting
	chart.exporting.menu = new am4core.ExportMenu();
    chart.exporting.menu.items = [initExportMenuParam()];

	chart.colors.step = 2;

    if(legendFlag) {
        chart.legend = new am4charts.Legend();
        chart.legend.position = legendPosition;
        chart.legend.paddingBottom = 20;
        chart.legend.labels.template.maxWidth = 95;
    }
	

	var xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
	xAxis.dataFields.category = dimension;
	xAxis.renderer.cellStartLocation = 0.1;
	xAxis.renderer.cellEndLocation = 0.9;
	xAxis.renderer.grid.template.location = 0;

	var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
	yAxis.min = 0;

    // series 생성
	function createSeries(value, name) {
		var series = chart.series.push(new am4charts.ColumnSeries());
		series.dataFields.valueY = value;
		series.dataFields.categoryX = dimension;
		series.name = name;

		// 막대별로 다른 색상을 가지게 하고 싶을 경우
		//  MEMO : 동일한 측정값을 가지는 막대의 경우 기본적으로는 같은 색상을 가지게됨
		// series.columns.template.adapter.add("fill", function(fill, target) {
		// 	return chart.colors.getIndex(target.dataItem.index);
		// });

		series.events.on("hidden", arrangeColumns);
		series.events.on("shown", arrangeColumns);

		var bullet = series.bullets.push(new am4charts.LabelBullet());
		bullet.interactionsEnabled = false;
		bullet.dy = 30;
		bullet.label.text = '{valueY}';
		bullet.label.fill = am4core.color('#ffffff');

		return series;
	} // function createSeries end

	chart.data = jsonData;

	createSeries(measure, measureName); // 두번째 인자 name으로 외부로 노출되는 텍스트를 변경할 수 있음

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
                });
			}
		} // if end
	} // function arrangeColumns end
};


function buildLineChart(targetDivId, jsonData, chartParam) {
    var libraries = chartParam.libraries;

	// Themes begin
	am4core.useTheme(am4themes_animated);
	// Themes end

	// Create chart instance
	var chart = am4core.create(targetDivId, am4charts.XYChart);

	// chartExporting
	chart.exporting.menu = new am4core.ExportMenu();
    chart.exporting.menu.items = [initExportMenuParam()];

	// Create axes
	var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
	var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

	// series를 구성하는 함수, 함수 인자로 도서관명을 담은 배열을 가져옴
    // i 범위를 구성함에 따라 노출되는 값이 달라짐
	for (var i = 0; i < libraries.length; i++) { 
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
        //  <- 정리해서 가져오는 형식으로 변경

		// var data = [];
		// var value = null;
		// jsonData.forEach((item) => {
		// 	if (name == item.도서관명) {
		// 		value = item.방문자수;
		// 		var year = item.방문일자.substring(0, 4);
		// 		var month = item.방문일자.substring(4, 6);
		// 		var day = item.방문일자.substring(6, 8);
		// 		var dataItem = { date: new Date(Number(year), Number(month) - 1, Number(day)) };
		// 		dataItem["value" + s] = value;
		// 		data.push(dataItem);
		// 	}
		// });

		// series.data = data;
		series.data = jsonData;
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

function buildPieChart(targetDivId, jsonData, chartParam) {
    var dimension = chartParam.dimension;
    var measure = chartParam.measure;

	// Themes begin
	am4core.useTheme(am4themes_animated);
	// Themes end

	// Create chart instance
	var chart = am4core.create(targetDivId, am4charts.PieChart);

	// chartExporting
	chart.exporting.menu = new am4core.ExportMenu();
    chart.exporting.menu.items = [initExportMenuParam()];

	// Add data
	chart.data = jsonData
	
	// Add legend
	chart.legend = new am4charts.Legend();
	
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


function initExportMenuParam() {
    return {
        "label": "...",
        "menu": [
            {
                "label": "이미지 다운로드",
                "menu": [
                    { "type": "png", "label": "PNG" },
                    { "type": "jpg", "label": "JPG" },
                    { "type": "svg", "label": "SVG" },
                    { "type": "pdf", "label": "PDF" }
                ]
            }, {
                "label": "데이터 추출",
                "menu": [
                    { "type": "json", "label": "JSON" },
                    // { "type": "csv", "label": "CSV" },
                    { "type": "xlsx", "label": "XLSX" },
                    // { "type": "html", "label": "HTML" },
                    { "type": "pdfdata", "label": "PDF" }
                ]
            }
            // , {
            //     "label": "Print", "type": "print"
            // }
        ]
    };
}

// var biggerChartSw = {barchartdiv : 0, linechartdiv : 0, piechartdiv : 0};
// function biggerChart(btn) {
	
// 	var sw = btn.innerText;
// 	var target = btn.parentNode.parentNode.children[1].children[0];
// 	var targetId = target.id;
	
// 	if (sw == "+") {
// 		biggerChartSw[targetId] = 1;
// 		document.getElementById(targetId).setAttribute("style", "height : 770px;")
// 		btn.innerText = "-";
// 	} else {
// 		biggerChartSw[targetId] = 0;
// 		document.getElementById(targetId).setAttribute("style", "")
// 		btn.innerText = "+";
// 	}
// }

/*************************************************************/
/***         6. Chart End           ***/
/*************************************************************/