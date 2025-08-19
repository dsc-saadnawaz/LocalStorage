/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/search', 'N/record', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'], function (search, record, utils, constantsLib) {
    const onAction = (context) => {
        const title = ' onAction() :: ';
        try {
            let recordObj = context.newRecord;
            let recordId = recordObj.id;
            log.debug('recordId', recordId)
            if (recordId) {
                let contractId = recordObj.getValue('custrecord_dsc_cf_agreement_no');
                let checkoutStorageUnit = recordObj.getValue('custrecord_dsc_cof_storage_unit');
                log.debug('checkoutStorageUnit', checkoutStorageUnit)
                if (contractId) {

                    if (checkoutStorageUnit) {
                        log.debug('storage unit', 'available')
                        let storageUnitonOtherContract = checkStorageUnitonOtherContract(contractId,checkoutStorageUnit);
                        if(!storageUnitonOtherContract)
                        {
                            record.submitFields({
                                type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                                id: parseInt(checkoutStorageUnit),
                                values: {
                                    custrecord_dsc_suf_availability_status: constantsLib.FIELD_VALUES.STORAGE_UNIT_STATUS_AVAILABLE
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                    }

                    let updatedRecordId = setContractStatus(contractId);
                    log.debug('updatedRecordId Contract', updatedRecordId)
                    if (updatedRecordId) {
                        let getContractLines = getInProgressContractLines(updatedRecordId);
                        log.debug('getContractLines', getContractLines)
                        if (getContractLines && getContractLines.length > 0) {
                            for (let i = 0; i < getContractLines.length; i++) {
                                const updatedParentContractLine = record.submitFields({
                                    type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                                    id: parseInt(getContractLines[i].contractLineId),
                                    values: {
                                        custrecord_dsc_clf_status: constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_CLOSED,
                                        custrecord_dsc_clf_close_date: new Date()
                                    }
                                });
                                if (updatedParentContractLine) {
                                    let contractLineSo = getContractLines[i].contractLineSo
                                    // let contractLineStatus = recObj.getValue('custrecord_dsc_clf_status');
                                    log.debug('contractLineSo', contractLineSo)
                                    if (contractLineSo) {
                                        let storageUnitsData = utils.getStorageUnitDetailsMapping([contractLineSo]);
                                        log.debug('storageUnitsData', storageUnitsData)
                                        if (storageUnitsData && Object.keys(storageUnitsData).length > 0) {
                                            for (let storageUnitId in storageUnitsData) {
                                                if (storageUnitId) {
                                                    // record.submitFields({
                                                    //     type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                                                    //     id: parseInt(storageUnitId),
                                                    //     values: {
                                                    //         custrecord_dsc_suf_availability_status: constantsLib.FIELD_VALUES.STORAGE_UNIT_STATUS_AVAILABLE
                                                    //     },
                                                    //     options: {
                                                    //         enableSourcing: false,
                                                    //         ignoreMandatoryFields: true
                                                    //     }
                                                    // });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
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

    const setContractStatus = (contractId) => {
        const title = ' setContractStatus() :: ';
        try {
            let updatedContractId = record.submitFields({
                type: constantsLib.RECORD_TYPES.CONTRACT,
                id: parseInt(contractId),
                values: {
                    custrecord_dsc_cf_status: constantsLib.FIELD_VALUES.CONTRACT_STATUS_CLOSED
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            return updatedContractId;

        } catch (error) {
            log.error({
                title: title + 'error',
                details: error
            })
        }
    }
    const getInProgressContractLines = (contractId) => {
        const logTitle = " getContractLines() ";
        try {
            let contractLinesArr = [];
            let contractLineStatus = constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_OPEN;
            var contractLineSearchObj = search.create({
                type: "customrecord_dsc_contract_line",
                filters: [
                    ["custrecord_dsc_clf_parent_contract", "anyof", contractId],
                    "AND",
                    ["custrecord_dsc_clf_status", "anyof", contractLineStatus]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID",
                        sort: search.Sort.DESC
                    }),
                    search.createColumn({
                        name: "name",
                        label: "ID"
                    }),
                    search.createColumn({
                        name: "custrecord_dsc_clf_parent_contract",
                        label: "Parent Contract"
                    }),
                    search.createColumn({
                        name: "custrecord_dsc_clf_status",
                        label: "Status"
                    }),
                    search.createColumn({
                        name: "custrecord_dsc_clf_so_reference",
                        label: "Sales Order"
                    })
                ]
            });
            const searchResults = contractLineSearchObj.run().getRange({
                start: 0,
                end: 1000
            });
            if (searchResults && searchResults.length > 0) {
                for (let i = 0; i < searchResults.length; i++) {
                    let contractLineId = searchResults[i].getValue(({
                        name: 'internalid'
                    }));
                    let contractLineSo = searchResults[i].getValue(({
                        name: 'custrecord_dsc_clf_so_reference'
                    }));
                    contractLinesArr.push({
                        contractLineId: contractLineId,
                        contractLineSo: contractLineSo
                    })
                }
                return contractLinesArr;
            } else {
                return [];
            }
        } catch (error) {
            log.error("ERROR IN" + logTitle, error);
        }
    }
    const checkStorageUnitonOtherContract = (contractId, storageUnitId) => {
        try {
            let customrecord_dsc_contractSearchObj = search.create({
                type: "customrecord_dsc_contract",
                filters: [
                    ["custrecord_dsc_cf_storage_unit", "anyof", storageUnitId],
                    "AND",
                    ["internalid", "noneof", contractId],
                    "AND",
                    ["custrecord_dsc_cf_status", "noneof", "5"]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "custrecord_dsc_cf_status",
                        label: "Status"
                    }),
                    search.createColumn({
                        name: "name",
                        label: "ID"
                    }),
                    search.createColumn({
                        name: "custrecord_dsc_cf_storage_unit",
                        label: "Storage Unit"
                    })
                ]
            });
            const searchResults = customrecord_dsc_contractSearchObj.run().getRange({
                start: 0,
                end: 1000
            });
            if (searchResults && searchResults.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            log.error({
                title: title + 'error',
                details: error
            })
        }

    }
    return {
        onAction
    }
})