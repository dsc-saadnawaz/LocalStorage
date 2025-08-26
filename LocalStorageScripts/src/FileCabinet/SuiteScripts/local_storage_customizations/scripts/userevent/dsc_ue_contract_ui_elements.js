/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/search', 'N/record'],
    (utilsLib, constantsLib, search, record) => {

        const beforeLoad = context => {
            const logTitle = " beforeLoad() ";
            log.debug(logTitle, "<--------------- USER_EVENT_BEFORE_LOAD - START--------------->");
            try {
                // log.debug(logTitle + "utilsLib", utilsLib);
                // log.debug(logTitle + "constantsLib", constantsLib);
                let contractObj = {};
                const formObj = context.form;
                let recordObj = context.newRecord;
                let salesOrderRef;
                let contractLineId;
                let getContractLineObj;
                formObj.clientScriptFileId = utilsLib.getFileId(constantsLib.FILE_PATHS.CLIENT_SCRIPTS.CONTRACT_UI_AUTOMATIONS);
                if (context.type == context.UserEventType.VIEW) {
                    contractObj.contractId = recordObj.id;
                    contractObj.contractStatus = recordObj.getValue('custrecord_dsc_cf_status');
                    contractObj.contractCheckout = recordObj.getValue('custrecord_dsc_cf_checkout');
                    contractObj.contractCustomer = recordObj.getValue('custrecord_dsc_cf_customer');

                    if (contractObj.contractId) {
                        getContractLineObj = getContractLines(contractObj.contractId);
                        log.debug('getContractLineObj', getContractLineObj)
                        contractObj.contractLineId = getContractLineObj.contractLine;
                        salesOrderRef = getContractLineObj.soRef ? getContractLineObj.soRef : ""
                    }
                    if (contractObj.contractId && !contractObj.contractCheckout && contractObj.contractStatus != constantsLib.FIELD_VALUES.CONTRACT_STATUS_CHECKOUT_IN_PROGRESS && contractObj.contractStatus != constantsLib.FIELD_VALUES.CONTRACT_STATUS_CLOSED) {

                        if (salesOrderRef && getContractLineObj && getContractLineObj.contractLine != "") {
                            if ([constantsLib.FIELD_VALUES.CONTRACT_STATUS_CHECKOUT_IN_PROGRESS, constantsLib.FIELD_VALUES.CONTRACT_STATUS_SIGNED].includes(contractObj.contractStatus)) {
                                contractObj.previousContractLineId = getContractLineObj.contractLine;
                                formObj.addButton({
                                    id: 'custpage_dsc_btn_contract_renewal',
                                    label: 'Renew Contract',
                                    functionName: 'manualRenewalProcess(' + JSON.stringify(contractObj) + ')'
                                });
                            }
                        }
                    }

                    if (contractObj.contractStatus == constantsLib.FIELD_VALUES.CONTRACT_STATUS_SIGNED && !contractObj.contractCheckout) {
                        formObj.addButton({
                            id: 'custpage_dsc_btn_contract_checkout',
                            label: 'Start Checkout',
                            functionName: 'startContractCheckout(' + JSON.stringify(contractObj) + ')'
                        });
                    }
                    if (!salesOrderRef && getContractLineObj.contractLine && [constantsLib.FIELD_VALUES.CONTRACT_STATUS_PENDING_SIGNATURE, constantsLib.FIELD_VALUES.CONTRACT_STATUS_SIGNED].includes(contractObj.contractStatus)) {
                        formObj.addButton({
                            id: 'custpage_dsc_btn_create_sales_order',
                            label: 'Create Sales Order',
                            functionName: 'createSalesOrder(' + JSON.stringify(contractObj) + ')'
                        });
                    }
                    log.debug('salesOrderRef', salesOrderRef)
                    if (salesOrderRef) {
                        if ([constantsLib.FIELD_VALUES.CONTRACT_STATUS_PENDING_SIGNATURE, constantsLib.FIELD_VALUES.CONTRACT_STATUS_SIGNED, constantsLib.FIELD_VALUES.CONTRACT_STATUS_CHECKOUT_IN_PROGRESS, constantsLib.FIELD_VALUES.CONTRACT_STATUS_CLOSED].includes(contractObj.contractStatus)) {
                            formObj.addButton({
                                id: 'custpage_dsc_btn_contract_pdf',
                                label: 'Generate Contract PDF',
                                functionName: 'generateContractPdf()'
                            });
                        }
                    }


                }
            } catch (error) {
                log.error("ERROR IN 1" + logTitle, error);

            }
            log.debug(logTitle, "<--------------- USER_EVENT_BEFORE_LOAD - END --------------->");
        }
        const getContractLines = (contractId) => {
            const logTitle = " getContractLines() :: ";
            try {
                log.debug({
                    title: logTitle + 'contractId',
                    details: contractId
                })
                let contractLineStatus = constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_CLOSED;
                var contractLineSearchObj = search.create({
                    type: "customrecord_dsc_contract_line",
                    filters: [
                        ["custrecord_dsc_clf_parent_contract", "anyof", contractId],
                        "AND",
                        ["custrecord_dsc_clf_status", "noneof", contractLineStatus]
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
                            name: "internalid",
                            join: "CUSTRECORD_DSC_CLF_SO_REFERENCE",
                        })
                    ]
                });
                const searchResults = contractLineSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                let contractLineObj = {};
                if (searchResults && searchResults.length > 0) {
                    contractLineObj.contractLine = searchResults[0].getValue(({
                        name: 'internalid'
                    }));
                    contractLineObj.soRef = searchResults[0].getValue({
                        name: 'internalid',
                        join: 'CUSTRECORD_DSC_CLF_SO_REFERENCE'
                    })
                    return contractLineObj;
                } else {
                    return '';
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
            }
        }
        const afterSubmit = (context) => {
            const logTitle = " afterSubmit() ";
            try {
                let recordObj = context.newRecord;
                let recordId = recordObj.id;
                if (context.type == context.UserEventType.CREATE) {
                    let getStorageUnit = recordObj.getValue('custrecord_dsc_cf_storage_unit');
                    log.debug(logTitle + "getStorageUnit111", getStorageUnit);
                    if (getStorageUnit) {
                        record.submitFields({
                            type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                            id: parseInt(getStorageUnit),
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

            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
            }
        }
        return {
            beforeLoad,
            afterSubmit
        }
    }
);