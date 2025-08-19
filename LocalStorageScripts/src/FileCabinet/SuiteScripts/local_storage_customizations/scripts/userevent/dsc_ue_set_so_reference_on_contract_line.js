/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (record, search, n_error, utilsLib, constantsLib) => {

        const beforeSubmit = (context) => {
            const title = "beforeSubmit ::"
            try {

                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {

                    let recordObj = context.newRecord;
                    let lines = recordObj.getLineCount({
                        sublistId: 'item'
                    })

                    for (let i = 0; i < lines; i++) {
                        let item = recordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        })


                        if (item == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                            let storageUnit = recordObj.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_dsc_storage_unit_display',
                                line: i
                            })
                            if (!storageUnit) {
                                throw n_error.create({
                                    name: 'STORAGE_UNIT_MISSING',
                                    message: 'Please add the Storage unit for item ' + constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID
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

                throw error?.message
            }
        }


        const afterSubmit = (context) => {
            const title = "afterSubmit ::"
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    let recordObj = context.newRecord;
                    let SalesOrderId = recordObj.id;
                    if (SalesOrderId) {
                        let soPaymentMethod = recordObj.getValue('custbody_dsc_payment_method');
                        let salesOrderStatus = recordObj.getValue('status');
                        let getExistingContractLines = salesOrderOnExistingLines(SalesOrderId);
                        let getParentContract = recordObj.getValue('custbody_dsc_so_parent_contract');
                        // if (getExistingContractLines && getExistingContractLines.length > 0) {
                        //     for (let i = 0; i < getExistingContractLines.length; i++) {
                        //         record.submitFields({
                        //             type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                        //             id: parseInt(getExistingContractLines[i]),
                        //             values: {
                        //                 custrecord_dsc_clf_so_reference: ''
                        //             },
                        //             options: {
                        //                 enableSourcing: false,
                        //                 ignoreMandatoryFields: true
                        //             }
                        //         });
                        //     }
                        // }

                        let soContractLine = recordObj.getValue('custbody_dsc_contract_line');
                        if (soContractLine) {
                            let searchLookUpObj = search.lookupFields({
                                type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                                id: parseInt(soContractLine),
                                columns: ['custrecord_dsc_clf_payment_mode']
                            });
                            log.debug('searchLookUpObj', searchLookUpObj)
                            let contratLinePaymentOption = searchLookUpObj && searchLookUpObj.custrecord_dsc_clf_payment_mode ? searchLookUpObj.custrecord_dsc_clf_payment_mode[0].value : "";
                            if (contratLinePaymentOption) {
                                // record.submitFields({
                                //     type: record.Type.SALES_ORDER,
                                //     id: parseInt(SalesOrderId),
                                //     values: {
                                //         paymentoption: contratLinePaymentOption
                                //     },
                                //     options: {
                                //         enableSourcing: false,
                                //         ignoreMandatoryFields: true
                                //     }
                                // });
                            }
                            record.submitFields({
                                type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                                id: parseInt(soContractLine),
                                values: {
                                    custrecord_dsc_clf_so_reference: SalesOrderId,
                                    // custrecord_dsc_clf_payment_mode: soPaymentMethod
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                            record.submitFields({
                                type: constantsLib.RECORD_TYPES.CONTRACT,
                                id: parseInt(getParentContract),
                                values: {
                                    custrecord_dsc_contract_so_attached: true
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                        // if ((salesOrderStatus == "Pending Fulfillment" || salesOrderStatus == "Pending Billing/Partially Fulfilled") && soPaymentMethod == constantsLib.FIELD_VALUES.PAYMENT_METHOD_ONLINE) {
                        //     // let createdFulfillment = createFulfillment(SalesOrderId)
                        // }
                    }
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const salesOrderOnExistingLines = (soId) => {
            const title = "salesOrderOnExistingLines ::"
            try {
                let ContractLinesArr = [];
                var contractLineSearchObj = search.create({
                    type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                    filters: [
                        ["custrecord_dsc_clf_so_reference", "anyof", soId]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_contract_type",
                            label: "Contract Type"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_status",
                            label: "Status"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_parent_contract",
                            label: "Parent Contract"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_so_reference",
                            label: "Sales Order Reference"
                        })
                    ]
                });
                let searchResults = utilsLib.getAllSearchResults(contractLineSearchObj);
                log.debug("searchResults", searchResults)
                searchResults.forEach(contractLine => {
                    let contractLineId = contractLine.getValue({
                        name: 'internalid'
                    });
                    log.debug({
                        title: title + 'contractLineId',
                        details: contractLineId
                    })
                    if (contractLineId && !ContractLinesArr.includes(contractLineId)) ContractLinesArr.push(contractLineId)
                });
                log.debug("ContractLinesArr", ContractLinesArr);
                return ContractLinesArr || [];
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const createFulfillment = (soId) => {
            const title = "createFulfillment ::"
            try {
                let createFulfillment = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: parseInt(soId),
                    toType: record.Type.ITEM_FULFILLMENT,
                    // isDynamic: true,
                });
                createFulfillment.setValue('shipstatus', 'C')
                let createdRecordId = createFulfillment.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('createdRecordId', createdRecordId)
                return createdRecordId;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        return {
            // beforeSubmit,
            afterSubmit
        }
    });