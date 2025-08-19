/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../../lib/dsc_lib_constants.js', 'N/search'],
    (currentRecord, url, constantsLib, search) => {
        const pageInit = (context) => {
            const title = "pageInit() ";

            // try {
            //     const recObj = context.currentRecord
            //     let queryString = window.location.search;
            //     // Parse the query string to get the parameters
            //     let urlParams = new URLSearchParams(queryString);
            //     // let paramExistingContractLineID = urlParams.get('existingContractLineId');
            //     let paramExistingParentContractId = urlParams.get('parentContractId');
            //     // console.log('paramExistingContractLineID', paramExistingContractLineID);
            //     console.log('paramExistingParentContractId', paramExistingParentContractId);

            //     if (paramExistingParentContractId) {
            //         recObj.setValue('custrecord_dsc_clf_parent_contract', paramExistingParentContractId);
            //         recObj.setValue('custrecord_dsc_clf_contract_type', constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL);
            //         recObj.setValue('custrecord_dsc_clf_status', constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_OPEN);
            //     }
            // } catch (error) {
            //     log.error("ERROR IN" + title, error);
            //     console.error("ERROR IN" + title, error);
            // }

            try {
                const recObj = context.currentRecord;
                const parentContractId = recObj.getValue('custrecord_dsc_clf_parent_contract');
                let recordMode = context.mode; 
                if (parentContractId && recordMode === 'create') {
                    const contractLineData = getContractLines(parentContractId);

                    if (contractLineData && contractLineData.contractLineEndDate) {
                        // Renewal case
                        recObj.setValue({
                            fieldId: 'custrecord_dsc_clf_contract_type',
                            value: constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL
                        });

                        const endDateObj = formatNsDateStringToObject(contractLineData.contractLineEndDate);
                        if (endDateObj) {
                            const startDate = new Date(endDateObj.setDate(endDateObj.getDate() + 1));
                            recObj.setValue({
                                fieldId: 'custrecord_dsc_clf_start_date',
                                value: startDate
                            });
                        }
                    } else {
                        // No existing contract line → Standard
                        recObj.setValue({
                            fieldId: 'custrecord_dsc_clf_contract_type',
                            value: constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD
                        });
                        recObj.setValue({
                            fieldId: 'custrecord_dsc_clf_start_date',
                            value: ''
                        });
                    }
                }
            } catch (error) {
                console.error("ERROR in pageInit", error);
            }

        }


        const fieldChanged = (context) => {
            const title = "fieldChanged() :: ";
            try {
                const fieldId = context.fieldId;
                const contractLineRec = context.currentRecord;
                // console.log('fieldChanged', fieldId)
                if (fieldId == "custrecord_dsc_clf_parent_contract") {
                    let contractId = contractLineRec.getValue('custrecord_dsc_clf_parent_contract');
                    // console.log('contractId', contractId)
                    if (contractId) {
                        let getContractLineData = getContractLines(contractId);
                        console.log('getContractLineData', getContractLineData)
                        if (getContractLineData && getContractLineData.contractLineEndDate) {

                            let getDate = formatNsDateStringToObject(getContractLineData.contractLineEndDate)
                            // console.log('getDate', getDate)
                            if (getDate) {
                                let calculateStartDate = new Date(getDate.setDate(getDate.getDate() + 1));
                                if (calculateStartDate) {
                                    contractLineRec.setValue('custrecord_dsc_clf_start_date', calculateStartDate)
                                }

                            }

                        }
                    }
                }
            } catch (error) {
                log.error({
                    title: title + "error",
                    details: error
                })
            }
        }
        const getContractLines = (contractId) => {
            const logTitle = " getContractLines() ";
            try {
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
                            label: "Sales Order Reference"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_end_date",
                            label: "End Date"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_start_date",
                            label: "Start Date"
                        })

                    ]
                });
                const searchResults = contractLineSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                // console.log('searchResults', searchResults)
                let contractLinesObj = {}
                if (searchResults && searchResults.length > 0) {
                    contractLinesObj.contractLine = searchResults[0].getValue(({
                        name: 'internalid'
                    }));
                    contractLinesObj.contractLineSO = searchResults[0].getValue(({
                        name: 'custrecord_dsc_clf_so_reference'
                    }));
                    contractLinesObj.contractLineEndDate = searchResults[0].getValue(({
                        name: 'custrecord_dsc_clf_end_date'
                    }));
                    return contractLinesObj;
                } else {
                    return '';
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                console.log("ERROR IN" + logTitle, error);
            }
        }

        const formatNsDateStringToObject = nsDateString => {
            const logTitle = " formatNsDateStringToObject() ";
            try {
                const nsDateContent = nsDateString.split("/");
                const nsDateDays = nsDateContent[0];
                const nsDateMonthIndex = nsDateContent[1] - 1;
                const nsDateYears = nsDateContent[2];
                let dateObj = new Date(nsDateYears, nsDateMonthIndex, nsDateDays);
                // console.log(logTitle + ' dateObj', dateObj)
                return dateObj;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }
        return {
            pageInit,
            fieldChanged
        }
    }
)