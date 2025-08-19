/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (record, search, n_error, utils, constantsLib) => {
        const afterSubmit = (context) => {
            const title = "afterSubmit ::"
            try {
                if (context.type == context.UserEventType.CREATE) {
                    let recordObj = context.newRecord;
                    let recordId = recordObj.id;
                    if (recordId) {
                        let approvalStatus = recordObj.getValue('status');
                        let parentContract = recordObj.getValue('custbody_dsc_so_parent_contract');
                        let contractLine = recordObj.getValue('custbody_dsc_contract_line');
                        
                        let lineItemsData = getLineItemsData(recordObj);
                        log.debug('lineItemsData lineStorageIds', lineItemsData.lineStorageIds)
                        if (lineItemsData && Object.keys(lineItemsData).length != 0 && lineItemsData.lineStorageIds.length > 0) {
                            let storageUnitsData = lineItemsData.lineStorageIds;
                            
                            if (contractLine && parentContract) {
                                let getContractLineType = checkContractLineType(contractLine);
                                log.debug('getContractLineType', getContractLineType)

                                if(getContractLineType && getContractLineType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD)
                                {
                                    let updatedContract = record.submitFields({
                                        type: constantsLib.RECORD_TYPES.CONTRACT,
                                        id: parseInt(parentContract),
                                        values: {
                                            custrecord_dsc_cf_storage_unit: storageUnitsData[0]
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                    log.debug('updatedContract',updatedContract)
                                }
                            }
                           
                            for (let i = 0; i < storageUnitsData.length; i++) {
                                record.submitFields({
                                    type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                                    id: parseInt(storageUnitsData[i]),
                                    values: {
                                        custrecord_dsc_suf_availability_status: constantsLib.FIELD_VALUES.STORAGE_UNIT_STATUS_OCCUPIED
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });
                            }

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
        const getLineItemsData = (salesOrderRecord) => {
            const title = "getLineItemsData ::"
            try {
                let lineDataObj = {}
                let lineStorageIds = [];
                let lineCount = salesOrderRecord.getLineCount({
                    sublistId: "item"
                });
                if (lineCount && lineCount > 0) {
                    for (let i = 0; i < lineCount; i++) {
                        let dataObj = {}
                        dataObj.lineId = salesOrderRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'line',
                            line: i
                        })
                        dataObj.lineStorageUnitId = salesOrderRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_dsc_storage_unit',
                            line: i
                        })
                        if (dataObj.lineStorageUnitId && !lineStorageIds.includes(dataObj.lineStorageUnitId)) {
                            lineStorageIds.push(dataObj.lineStorageUnitId)
                        }
                        if (dataObj.lineId) {
                            if (!lineDataObj[dataObj.lineId]) {

                                dataObj.lineRate = salesOrderRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    line: i
                                })
                                dataObj.lineItem = salesOrderRecord.getSublistValue({
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
        const checkContractLineType = (contractLineId) => {
            const title = "checkContractLineType :: ";
            try {
                const contractLineSearchLookup = search.lookupFields({
                    type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                    id: parseInt(contractLineId),
                    columns: ['custrecord_dsc_clf_contract_type']
                });
                const contractLineType = contractLineSearchLookup?.custrecord_dsc_clf_contract_type?.[0]?.value;
                return contractLineType;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }

        }
        return {
            afterSubmit
        }
    });