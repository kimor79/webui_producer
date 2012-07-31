W = YAHOO.namespace('WebUI');
W.api = YAHOO.namespace('WebUI.api');
W.cal = YAHOO.namespace('WebUI.calendar');
W.ds = YAHOO.namespace('WebUI.datasource');
W.dt = YAHOO.namespace('WebUI.datatable');
W.form = YAHOO.namespace('WebUI.form');

W.api.onFailure = function(o) {
	W.updateStatus(o.statusText, 'wui-api-400');
	W.loadingPanel('hide');
};

W.api.onSuccess = function(o) {
	var oOutput;
	try {
		oOutput = YAHOO.lang.JSON.parse(o.responseText);
	} catch(e) {
		W.updateStatus(o.responseText + e, 'wui-api-500');
		W.loadingPanel('hide');
		return false;
	}

	if(typeof(oOutput.status) == "undefined") {
		W.updateStatus(o.responseText, 'wui-api-400');
		W.loadingPanel('hide');
		return false;
	}

	if(oOutput.status >= 200 && oOutput.status <= 299) {
		W.updateStatus(oOutput.message, 'wui-api-200');
		W.loadingPanel('hide');
		return oOutput;
	}

	if(oOutput.status >= 400 && oOutput.status <= 499) {
		W.updateStatus(oOutput.message, 'wui-api-400');
		W.loadingPanel('hide');
		return false;
	}

	W.updateStatus(oOutput.message, 'wui-api-500');
	W.loadingPanel('hide');
	return false;
};

W.cal.doCalendars = function() {
	var oCal;
	var over_cal = false;
	var cur_field = '';

	oCal = new YAHOO.widget.Calendar('wuical', 'wui-calendar');

	var hideCal = function() {
		if(!over_cal) {
			YAHOO.util.Dom.setStyle('wui-calendar', 'display',
				'none');
		}
	};

	var setupListeners = function() {
		YAHOO.util.Event.addListener('wui-calendar', 'mouseover',
				function() {
			over_cal = true;
		});

		YAHOO.util.Event.addListener('wui-calendar', 'mouseout',
				function() {
			over_cal = false;
		});
	};

	var getDate = function() {
		var oDate = this.getSelectedDates()[0];
		cur_field.value = W.cal.formatDate(oDate);
		over_cal = false;
		hideCal();
	};

	var showCal = function(ev) {
		var oTarget = YAHOO.util.Event.getTarget(ev);
		cur_field = oTarget;

		var aXY = YAHOO.util.Dom.getXY(oTarget);
		var oDate = YAHOO.util.Dom.get(oTarget).value;

		if(oDate) {
			oDate = new Date(oDate);
			var sMDY = (oDate.getMonth() + 1) + '/' +
				oDate.getDate() + '/' + oDate.getFullYear();
			oCal.cfg.setProperty('selected', sMDY);
			oCal.cfg.setProperty('pagedate', oDate, true);
		} else {
			oCal.cfg.setProperty('selected', '');
			oCal.cfg.setProperty('pagedate', new Date(), true);
		}

		oCal.render();
		YAHOO.util.Dom.setStyle('wui-calendar', 'display', 'block');
		aXY[1] += 20;
		YAHOO.util.Dom.setXY('wui-calendar', aXY);
	};

	oCal.selectEvent.subscribe(getDate, oCal, true);
	oCal.renderEvent.subscribe(setupListeners, oCal, true);

	var oEls = YAHOO.util.Dom.getElementsByClassName('wui-cal');

	YAHOO.util.Event.addListener(oEls, 'focus', showCal);
	YAHOO.util.Event.addListener(oEls, 'blur', hideCal);

	oCal.render();

	return oCal;
};

W.cal.formatDate = function(oDate) {
	var aMonths = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
		'Aug', 'Sep', 'Oct', 'Nov', 'Dec');

	return aMonths[oDate.getMonth()] + ' ' + oDate.getDate() +
		', ' + oDate.getFullYear();
};

W.ds.newDataSource = function(sUrl, aFields) {
	var oDatasource = new YAHOO.util.DataSource(sUrl);
	oDatasource.responseType = YAHOO.util.DataSource.TYPE_JSON;
	oDatasource.responseSchema = {
		fields: aFields,
		metaFields: { totalRecords: 'totalRecords' },
		resultsList: 'records'
	};

	return oDatasource;
};

W.ds.parseBool = function(oData) {
	if(oData) {
		switch(oData) {
		case true:
		case 1:
		case '1':
		case 'on':
		case 'true':
		case 'yes':
			return true;
		}
	}

	return false;
};

W.ds.parseDate = function(oData) {
	var oDate;
	if(isNaN(oData)) {
		oDate = new Date(0);
	} else {
		oDate = new Date(oData * 1000);
	}

	return oDate;
};

W.dt.config = function(sSort, iResults, sDir) {
	if(typeof(sDir) == 'undefined') {
		sDir = 'asc';
	}

	var oIstate = {
		pagination: {
			recordOffset: 0,
			rowsPerPage: iResults
		},
		sortedBy: {
			dir: sDir,
			key: sSort
		}
	};

	var sPageTemplate = '{CurrentPageReport}' +
		' {FirstPageLink} {PreviousPageLink}' +
		' {PageLinks} {NextPageLink} {LastPageLink}' +
		' {RowsPerPageDropdown}';

	var sPRTemplate = '{startRecord} - {endRecord} of {totalRecords}';

	var oConfigs = {
		draggableColumns: true,
		dynamicData: true,
		generateRequest: W.dt.generateRequest,
		initialRequest: W.dt.generateRequest(oIstate),
		paginator: new YAHOO.widget.Paginator({
			rowsPerPage: iResults,
			rowsPerPageOptions: [ 25, 50, 100, 250, 500, 1000 ],
			template: sPageTemplate,
			pageReportTemplate: sPRTemplate
		}),
		sortedBy: { dir: sDir, key: sSort }
	};

	return oConfigs;
};

W.dt.formatBool = function(elCell, oRecord, oColumn, oData) {
	if(oData) {
		elCell.innerHTML = 'Yes';
	} else {
		elCell.innerHTML = 'No';
	}
}

W.dt.formatDate = function(elCell, oRecord, oColumn, oData) {
	if(oData.getFullYear() == "1969") {
		elCell.innerHTML = '';
	} else {
		elCell.innerHTML = oData.toLocaleString();
	}
};

W.dt.formatTruncateString = function(elCell, oRecord, oColumn, oData) {
	if(oData.length > 50) {
		elCell.innerHTML = oData.substring(0, 46) + ' ...';
	} else {
		elCell.innerHTML = oData;
	}
};

W.dt.generateRequest = function(oState, oSelf) {
	if(!oState) {
		oState = { pagination: null, sortedBy: null };
	}

	var sDir = 'asc';
	if(oState.sortedBy && oState.sortedBy.dir) {
		if(oState.sortedBy.dir == 'desc') {
			sDir = 'desc';
		} else if(oState.sortedBy.dir ===
				YAHOO.widget.DataTable.CLASS_DESC) {
			sDir = 'desc';
		}
	}

	var sSort = (oState.sortedBy) ? oState.sortedBy.key : 'name';
	var iResults = (oState.pagination) ? oState.pagination.rowsPerPage : 25;
	var iIndex = (oState.pagination) ?
		oState.pagination.recordOffset : 0;

	return '&numResults=' + iResults +
		'&sortField=' + encodeURIComponent(sSort) +
		'&sortDir=' + sDir +
		'&startIndex=' + iIndex;
};

W.dt.newDataTable = function(sDiv, aColumns, oDataSource, oConfigs) {
	var oDatatable = new YAHOO.widget.DataTable(sDiv, aColumns,
		oDataSource, oConfigs);

	oDatatable.handleDataReturnPayload = function(oRequest, oResponse,
			oPayload) {
		oPayload.totalRecords = oResponse.meta.totalRecords;
		return oPayload;
	};

	return oDatatable;
};

W.dt.refreshDataTable = function(oDT) {
	if(typeof(oDT) != 'object') {
		return;
	}

	oFailure = function(sRequest, oResponse, oPayload) {
		var iLength = oDataTable.getRecordSet().getLength();
		oDT.deleteRows(sLength -1, -1 * iLength);
		oDT.render();
		oDT.showTableMessage(this.get("MSG_ERROR"));
	};

	oSuccess = function(sRequest, oResponse, oPayload) {
		oDT.onDataReturnInitializeTable(sRequest, oResponse, oPayload);
		oDT.get('paginator').setPage(1);
	};

	try {
		var oIrequest = oDT.get('initialRequest');
		oDT.getDataSource().sendRequest(oIrequest, {
			argument: oDT.getState(),
			failure: oFailure,
			success: oSuccess
		});
	} catch(e) {
		W.updateStatus(YAHOO.lang.dump(e), 'wui-api-400');
	}
};

W.form.submitGETClick = function(sClass) {
	var oElements = YAHOO.util.Dom.getElementsByClassName(sClass);

	YAHOO.util.Event.addListener(oElements, 'click', function(evt) {
		W.loadingPanel('show');
		YAHOO.util.Event.preventDefault(evt);
		var sQuery = W.form.toGET(this.form);
		window.location = '?' + sQuery;
	});
};

W.form.submitGETEnter = function(sClass) {
	var oForms = YAHOO.util.Dom.getElementsByClassName(sClass);

	var doSubmit = function(evt) {
		W.loadingPanel('show');
		YAHOO.util.Event.preventDefault(evt);
		var sQuery = W.form.toGET(this);
		window.location = '?' + sQuery;
	};

	var len = oForms.length;
	for (var i = 0; i < len; i++) {
		oForm = oForms[i];

		var oKL = new YAHOO.util.KeyListener(oForm, { keys: 13 }, {
			correctScope: true,
			fn: doSubmit,
			scope: oForm
		});

		oKL.enable();
	}
};

W.form.submitJSONClick = function(sClass, oCallback) {
	var oElements = YAHOO.util.Dom.getElementsByClassName(sClass);

	for (var i = 0, len = oElements.length; i < len; i++) {
		var oEl = oElements[i];
		var sUrl = oEl.form.action;

		YAHOO.util.Event.addListener(oEl, 'click', function(evt) {
			W.loadingPanel('show');
			YAHOO.util.Event.preventDefault(evt);
			YAHOO.util.Connect.asyncRequest('POST', sUrl,
				oCallback, W.form.toJSON(oEl.form));
		});
	}
};

W.form.submitPOSTClick = function(sClass, oCallback) {
	var oElements = YAHOO.util.Dom.getElementsByClassName(sClass);

	for (var i = 0, len = oElements.length; i < len; i++) {
		var oEl = oElements[i];
		var sUrl = oEl.form.action;

		YAHOO.util.Event.addListener(oEl, 'click', function(evt) {
			W.loadingPanel('show');
			YAHOO.util.Event.preventDefault(evt);
			YAHOO.util.Connect.asyncRequest('POST', sUrl,
				oCallback, W.form.toPOST(oEl.form));
		});
	}
};

W.form.toGET = function(oForm) {
	var aData = [];

	var len = oForm.elements.length;
	for (var i = 0; i < len; i++) {
		var oObj = oForm.elements[i];

		if(oObj.type == 'checkbox') {
			if(oObj.checked == true) {
				aData.push(oObj.name + '=on');
			} else {
				aData.push(oObj.name + '=off');
			}

			continue;
		}

		if(oObj.name != '') {
			if(oObj.value != '') {
				aData.push(oObj.name + '=' +
					encodeURIComponent(oObj.value));
			}
		}
	}

	return aData.join('&');
};

W.form.toJSON = function(oForm) {
	var oData = new Object();

	var len = oForm.elements.length;
	for (var i = 0; i < len; i++) {
		var oObj = oForm.elements[i];

		if(oObj.type == 'checkbox') {
			if(oObj.checked == true) {
				oData[oObj.name] = true;
			} else {
				oData[oObj.name] = false;
			}

			continue;
		}

		if(oObj.name != '') {
			oData[oObj.name] = oObj.value;
		}
	}

	return YAHOO.lang.JSON.stringify(oData);
};

W.form.toPOST = function(oForm) {
	var aData = [];

	var len = oForm.elements.length;
	for (var i = 0; i < len; i++) {
		var oObj = oForm.elements[i];

		if(oObj.type == 'checkbox') {
			if(oObj.checked == true) {
				aData.push(oObj.name + '=on');
			} else {
				aData.push(oObj.name + '=off');
			}

			continue;
		}

		if(oObj.name != '') {
			aData.push(oObj.name + '=' +
				encodeURIComponent(oObj.value));
		}
	}

	return aData.join('&');
};

W.getQueryString = function() {
	var aUrl = window.location.href.split('?', 2);

	var sQuery = aUrl[1];
	if(!sQuery) {
		return '';
	}

	var aQuery = sQuery.split('#', 1);

	return aQuery[0];
};

W.loadingPanel = function(sAction) {
	if(!W.loadingPanelPL) {
		W.loadingPanelPL = new YAHOO.widget.Panel('wui-loading', {
			close: false,
			draggable: false,
			fixedcenter: true,
			modal: true,
			visible: true,
			zIndex: 99
		});

		W.loadingPanelPL.setHeader('Loading, please wait...');
		W.loadingPanelPL.setBody('Loading, please wait...');
		// setBody( figure out how to get loading img via css

		W.loadingPanelPL.render(document.body);
	}

	switch(sAction) {
		case 'hide':
			W.loadingPanelPL.hide();
			break;
		case 'show':
			W.loadingPanelPL.show();
		break;
	}
};

W.nl2br = function(sText) {
	return sText.replace(/\n/g, '<br>');
};

W.updateStatus = function(sText, sClass) {
	var oDiv = document.getElementById('wui-status');

	if(!oDiv) {
		return;
	}

	if(sClass) {
		YAHOO.util.Dom.removeClass(oDiv, 'wui-api-200');
		YAHOO.util.Dom.removeClass(oDiv, 'wui-api-400');
		YAHOO.util.Dom.removeClass(oDiv, 'wui-api-500');
		YAHOO.util.Dom.addClass(oDiv, sClass);
	}

	YAHOO.util.Dom.removeClass(oDiv, 'hidden');
	oDiv.innerHTML = W.nl2br(YAHOO.lang.escapeHTML(sText));

	if(YAHOO.util.Dom.hasClass(oDiv, 'wui-status-dismiss')) {
		oDiv.innerHTML +=
			'<div id="wui-status-dismiss"' +
			' class="txt-clickable">Dismiss</div>';

		YAHOO.util.Event.addListener('wui-status-dismiss',
				'click', function() {
			YAHOO.util.Dom.addClass('wui-status', 'hidden');
			YAHOO.util.Dom.removeClass('wui-status', 'wui-api-200');
			YAHOO.util.Dom.removeClass('wui-status', 'wui-api-400');
			YAHOO.util.Dom.removeClass('wui-status', 'wui-api-500');
		});
	}
};

YAHOO.util.Event.onDOMReady(function() {
	if(document.getElementById('wui-focus')) {
		document.getElementById('wui-focus').focus();
	}

	if(document.getElementById('wui-calendar')) {
		W.cal.doCalendars();
	}
});
