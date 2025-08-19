/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/runtime'],
    (record, search, n_error, utils, constantsLib, runtime) => {
        const beforeSubmit = (context) => {
            const title = "beforeSubmit ::"
            try {
                let setApprovalStatus = false;
                if ((context.type == context.UserEventType.CREATE) && runtime.executionContext != runtime.ContextType.WORKFLOW) {
                    let recordObj = context.newRecord;
                    let paymentType = recordObj.getValue('custbody_dsc_payment_type');
                    let approvalStatus = recordObj.getValue('custbody_dsc_approval_status');
                    let lineItemData = getLineItemsData(recordObj);
                    // log.debug('lineItemData', lineItemData);

                    if (lineItemData && Object.keys(lineItemData).length != 0 && lineItemData.lineStorageIds.length > 0) {
                        let storageUnitsData = getStorageUnitsData(lineItemData.lineStorageIds);
                        log.debug('storageUnitsData', storageUnitsData)
                        if (storageUnitsData && Object.keys(storageUnitsData).length != 0) {
                            for (let lineId in lineItemData.lineDataObj) {
                                let currentObj = lineItemData.lineDataObj[lineId];
                                log.debug('currentObj', currentObj);
                                // log.debug('storageUnitsData[currentObj.lineStorageUnitId]', storageUnitsData[currentObj.lineStorageUnitId])
                                if (currentObj.lineRate && currentObj.lineRate != storageUnitsData[currentObj.lineStorageUnitId].storageUnitRate) {
                                    log.debug('currentObj.lineRate', currentObj.lineRate);
                                    log.debug('storageUnitsData.storageUnitRate', storageUnitsData[currentObj.lineStorageUnitId].storageUnitRate);
                                    setApprovalStatus = true;
                                    break;
                                } else {
                                    setApprovalStatus = false;
                                }
                            }
                        }
                    }

                    log.debug('setApprovalStatus', setApprovalStatus);
                    log.debug('approvalStatus', approvalStatus)
                    if (approvalStatus != constantsLib.FIELD_VALUES.APPROVAL_STATUS_APPROVED && approvalStatus != constantsLib.FIELD_VALUES.APPROVAL_STATUS_REJECTED) {
                        if (setApprovalStatus || paymentType == constantsLib.FIELD_VALUES.PAYMENT_TYPE_PARTIAL_PAYMENT) {
                            recordObj.setValue('custbody_dsc_approval_status', constantsLib.FIELD_VALUES.APPROVAL_STATUS_PENDING_APPROVAL)
                        }
                        if (!setApprovalStatus && paymentType != constantsLib.FIELD_VALUES.PAYMENT_TYPE_PARTIAL_PAYMENT) {
                            recordObj.setValue('custbody_dsc_approval_status', constantsLib.FIELD_VALUES.APPROVAL_STATUS_APPROVED)
                        }
                    }

                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const getLineItemsData = (estimateRecord) => {
            const title = "getLineItemsData ::"
            try {
                let lineDataObj = {}
                let lineStorageIds = [];
                let lineCount = estimateRecord.getLineCount({
                    sublistId: "item"
                });
                if (lineCount && lineCount > 0) {
                    for (let i = 0; i < lineCount; i++) {
                        let dataObj = {}
                        dataObj.lineId = estimateRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'line',
                            line: i
                        })
                        dataObj.lineStorageUnitId = estimateRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_dsc_storage_unit',
                            line: i
                        })
                        if (!lineStorageIds.includes(dataObj.lineStorageUnitId)) {
                            lineStorageIds.push(dataObj.lineStorageUnitId)
                        }
                        if (dataObj.lineId) {
                            if (!lineDataObj[dataObj.lineId]) {

                                dataObj.lineRate = estimateRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    line: i
                                })
                                dataObj.lineItem = estimateRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: i
                                })
                                lineDataObj[dataObj.lineId] = dataObj;
                            }
                        }
                    }

                    return {
                        lineDataObj,
                        lineStorageIds
                    };
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const getStorageUnitsData = (storageUnitIds) => {
            let storageUnitMapObj = {}
            const title = "getStorageUnitsData ::"
            try {
                var storageUnitSearchObj = search.create({
                    type: "customrecord_dsc_storage_unit",
                    filters: [
                        ["internalid", "anyof", storageUnitIds]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_unit_price",
                            label: "Storage Unit Price "
                        })
                    ]
                });
                let searchResults = utils.getAllSearchResults(storageUnitSearchObj);
                // log.debug('searchResults', searchResults);
                if (searchResults && searchResults.length > 0) {
                    for (let i = 0; i < searchResults.length; i++) {
                        let storageUnitId = searchResults[i].id
                        let getStorageUnitRate = searchResults[i].getValue(({
                            name: 'custrecord_dsc_suf_storage_unit_price'
                        }));
                        let storageUnitRate = getStorageUnitRate && Number(getStorageUnitRate) > 0 ? getStorageUnitRate : 0
                        // log.debug('storageUnitId', storageUnitId)
                        if (storageUnitId && !storageUnitMapObj[storageUnitId]) {
                            storageUnitMapObj[storageUnitId] = {
                                storageUnitId,
                                storageUnitRate
                            }
                        }
                    }
                }
                return storageUnitMapObj;

            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        return {
            beforeSubmit
        }
    });