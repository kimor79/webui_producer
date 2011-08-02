YAHOO.namespace('WebUI');

YAHOO.WebUI.alterA = function() {
	var oAs = YAHOO.util.Dom.getElementsByClassName('wui-fade');

	for (var i = 0, len = oAs.length; i < len; i++) {
		var oA = oAs[i];
		YAHOO.util.Event.addListener(oA, 'click', function(evt) {
			var sHref = this.href;
			YAHOO.util.Event.preventDefault(evt);
			YAHOO.WebUI.fadeOut.animate();

			YAHOO.WebUI.fadeOut.onComplete.subscribe(function() {
				window.location = sHref;
			});
		});
	}
};

YAHOO.WebUI.apiOnFailure = function(o) {
	YAHOO.WebUI.updateStatus(o.statusText, 'wui-api-400');
	YAHOO.WebUI.loadingPanel('hide');
};

YAHOO.WebUI.apiOnSuccess = function(o) {
	var oOutput;
	try {
		oOutput = YAHOO.lang.JSON.parse(o.responseText);
	} catch(e) {
		YAHOO.WebUI.updateStatus(o.responseText + e, 'wui-api-500');
		YAHOO.WebUI.loadingPanel('hide');
		return false;
	}

	if(typeof(oOutput.status) == "undefined") {
		YAHOO.WebUI.updateStatus(o.responseText, 'wui-api-400');
		YAHOO.WebUI.loadingPanel('hide');
		return false;
	}

	switch(oOutput.status) {
		case 200:
			YAHOO.WebUI.updateStatus(oOutput.message,
				'wui-api-200');
			YAHOO.WebUI.loadingPanel('hide');
			return oOutput;
		case 400:
			YAHOO.WebUI.updateStatus(oOutput.message,
				'wui-api-400');
			YAHOO.WebUI.loadingPanel('hide');
			return false;
	}

	YAHOO.WebUI.updateStatus(oOutput.message, 'wui-api-500');
	YAHOO.WebUI.loadingPanel('hide');
	return false;
};

YAHOO.WebUI.apiPostJSON = function(sUrl, oData, oCallback) {
	var sJSON = YAHOO.lang.JSON.stringify(oData);

	YAHOO.util.Connect.asyncRequest('POST', sUrl, oCallback, sJSON);
};

YAHOO.WebUI.apiSubmit = function(sClass, oCallback) {
	var oElements = YAHOO.util.Dom.getElementsByClassName(sClass);

	for (var i = 0, len = oElements.length; i < len; i++) {
		var oEl = oElements[i];
		var sUrl = oEl.form.action;

		YAHOO.util.Event.addListener(oEl, 'click', function(evt) {
			YAHOO.WebUI.loadingPanel('show');
			YAHOO.util.Event.preventDefault(evt);
			var oData = YAHOO.WebUI.formToObject(oEl.form);
			YAHOO.WebUI.apiPostJSON(sUrl, oData, oCallback);
		});
	}
};

YAHOO.WebUI.dSparserDate = function(oData) {
	var oDate;
	if(isNaN(oData)) {
		oDate = new Date(0);
	} else {
		oDate = new Date(oData * 1000);
	}

	return oDate;
};

YAHOO.WebUI.dTformatDate = function(elCell, oRecord, oColumn, oData) {
	if(oData.getFullYear() == "1969") {
		elCell.innerHTML = '';
	} else {
		elCell.innerHTML = oData.toLocaleString();
	}
};

YAHOO.WebUI.dTformatLongText = function(elCell, oRecord, oColumn, oData) {
	var sData = YAHOO.lang.escapeHTML(oData.toString());

	if(sData.length > 50) {
		elCell.innerHTML = sData.substr(0,47) + '...';
	} else {
		elCell.innerHTML = sData;
	}
};

YAHOO.WebUI.formSubmit = function(sClass) {
	var oElements = YAHOO.util.Dom.getElementsByClassName(sClass);

	YAHOO.util.Event.addListener(oElements, 'click', function(evt) {
		YAHOO.WebUI.loadingPanel('show');
		YAHOO.util.Event.preventDefault(evt);
		var sQuery = YAHOO.WebUI.formToQuery(this.form);
		window.location = '?' + sQuery;
	});
};

YAHOO.WebUI.formSubmitOnEnter = function(sClass) {
	var oForms = YAHOO.util.Dom.getElementsByClassName(sClass);

	var doSubmit = function(evt) {
		YAHOO.WebUI.loadingPanel('show');
		YAHOO.util.Event.preventDefault(evt);
		var sQuery = YAHOO.WebUI.formToQuery(this);
		window.location = '?' + sQuery;
	};

	for (var i = 0, len = oForms.length; i < len; i++) {
		oForm = oForms[i];

		var oKL = new YAHOO.util.KeyListener(oForm, { keys: 13 }, {
				correctScope: true,
				fn: doSubmit,
				scope: oForm
		});

		oKL.enable();
	}
};

YAHOO.WebUI.formToObject = function(oForm) {
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

	return oData;
};

YAHOO.WebUI.formToQuery = function(oForm) {
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

YAHOO.WebUI.getQueryString = function() {
	var aUrl = window.location.href.split('?', 2);

	var sQuery = aUrl[1];

	if(!sQuery) {
		return '';
	}

	aQuery = sQuery.split('#', 1);

	return aQuery[0];
};

YAHOO.WebUI.nl2br = function(sStr) {
	return sStr.replace(/\n/g, '<br>');
};

YAHOO.WebUI.updateStatus = function(sText, sClass) {
	var oDiv = document.getElementById('wui-status');

	if(oDiv) {
		if(sClass) {
			YAHOO.util.Dom.removeClass(oDiv, 'wui-api-200');
			YAHOO.util.Dom.removeClass(oDiv, 'wui-api-400');
			YAHOO.util.Dom.removeClass(oDiv, 'wui-api-500');
			YAHOO.util.Dom.addClass(oDiv, sClass);
		}

		oDiv.innerHTML = YAHOO.WebUI.nl2br(sText);
	}
};

YAHOO.WebUI.dataTableConfigs = function(sSort, iResults, sDir) {
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

	var configs = {
		draggableColumns: true,
		dynamicData: true,
		generateRequest: YAHOO.WebUI.dataTableGenerateRequest,
		initialRequest: YAHOO.WebUI.dataTableGenerateRequest(oIstate),
		paginator: new YAHOO.widget.Paginator({
			rowsPerPage: iResults,
			rowsPerPageOptions: [ 25, 50, 100, 250, 500, 1000 ],
			template: sPageTemplate,
			pageReportTemplate: sPRTemplate
		}),
		sortedBy: { dir: sDir, key: sSort }
	};

	return configs;
};

YAHOO.WebUI.dataTableGenerateRequest = function(oState, oSelf) {
	oState = oState || { pagination: null, sortedBy: null };

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
	var sResults = (oState.pagination) ? oState.pagination.rowsPerPage : 25;
	var startIndex = (oState.pagination) ?
		oState.pagination.recordOffset : 0;

	return '&numResults=' + sResults +
		'&sortField=' + encodeURIComponent(sSort) +
		'&sortDir=' + sDir +
		'&startIndex=' + startIndex;
};

YAHOO.WebUI.newDataTable = function(sDiv, aColumns, oDataSource, oConfigs) {
	var datatable = new YAHOO.widget.DataTable(sDiv, aColumns,
		oDataSource, oConfigs);

	datatable.handleDataReturnPayload = function(oRequest, oResponse,
			oPayload) {
		oPayload.totalRecords = oResponse.meta.totalRecords;
		return oPayload;
	};

	return datatable;
};

YAHOO.WebUI.newDataSource = function(sUrl, aFields) {
	var datasource = new YAHOO.util.DataSource(sUrl);
	datasource.responseType = YAHOO.util.DataSource.TYPE_JSON;
	datasource.responseSchema = {
		fields: aFields,
		metaFields: { totalRecords: 'totalRecords' },
		resultsList: 'records'
	};

	return datasource;
};

YAHOO.WebUI.refreshDataTable = function(oDT) {
	if(typeof(oDT) != 'object') {
		return;
	}

	oFailure = function(sRequest, oResponse, oPayload) {
		var sLength = oDataTable.getRecordSet().getLength();
		oDT.deleteRows(sLength -1, -1 * sLength);
		oDT.render();
		oDT.showTableMessage(this.get("MSG_ERROR"));
	};

	oSuccess = function(sRequest, oResponse, oPayload) {
		oDT.onDataReturnInitializeTable(sRequest, oResponse, oPayload);
		oDT.get('paginator').setPage(1);
	};

	try {
		var oCallback = {
			argument: oDT.getState(),
			failure: oFailure,
			success: oSuccess
		};

		var oIrequest = oDT.get('initialRequest');
		oDT.getDataSource().sendRequest(oIrequest, oCallback);
	} catch(e) {
		YAHOO.WebUI.updateStatus(YAHOO.lang.dump(e), 'wui-api-400');
	}
};

YAHOO.WebUI.loadingPanel = function(sAction) {
	if(!YAHOO.WebUI.loadingPanelPL) {
		YAHOO.WebUI.loadingPanelPL = new YAHOO.widget.Panel(
			'wui-loading', {
				close: false,
				draggable: false,
				fixedcenter: true,
				modal: true,
				visible: true,
				zIndex: 99
		});

		YAHOO.WebUI.loadingPanelPL.setHeader('Loading, please wait...');

		if(YAHOO.WebUI.loadingPanelImg) {
			YAHOO.WebUI.loadingPanelPL.setBody('<img src="' +
				YAHOO.WebUI.loadingPanelImg + '">');
		}

		YAHOO.WebUI.loadingPanelPL.render(document.body);
	}

	switch(sAction) {
		case 'hide':
			YAHOO.WebUI.loadingPanelPL.hide();
			break;
		case 'show':
			YAHOO.WebUI.loadingPanelPL.show();
			break;
	}
};

YAHOO.util.Event.onContentReady('yui-main', function() {
	YAHOO.WebUI.fadeOut = new YAHOO.util.Anim('yui-main', {
		opacity: { to: 0 }
	}, 0.1);
});

YAHOO.util.Event.onDOMReady(function() {
	if(document.getElementById('wui-focus')) {
		document.getElementById('wui-focus').focus();
	}
});
