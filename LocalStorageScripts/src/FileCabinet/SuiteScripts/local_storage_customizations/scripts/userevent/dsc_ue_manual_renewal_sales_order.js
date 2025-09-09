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
                    let contractLineId = recordObj.id;
                    if (contractLineId) {
                        let getContractId = recordObj.getValue('custrecord_dsc_clf_parent_contract');
                        if (getContractId) {
                            let previousContractLine = getContractLines(getContractId, contractLineId);
                            log.debug('previousContractLine', previousContractLine)
                            //recordObj.getValue('custrecord_dsc_clf_prev_contract_line');
                            let contractLineType = recordObj.getValue('custrecord_dsc_clf_contract_type');
                            if (previousContractLine) {
                                record.submitFields({
                                    type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                                    id: parseInt(previousContractLine),
                                    values: {
                                        custrecord_dsc_clf_status: constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_CLOSED,
                                        custrecord_dsc_clf_close_date: new Date()
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });

                                // if (contractLineType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL) {
                                //     let { contractLineSalesOrderRef,  paymentMode} = salesOrderfromPreviousContractLine(previousContractLine);
                                //     log.debug('contractLineSalesOrderRef', contractLineSalesOrderRef);
                                //     log.debug('paymentMode', paymentMode);
                                //     if (contractLineSalesOrderRef) {
                                //         let getCreatedSalesOrder = createSalesOrder(contractLineSalesOrderRef, contractLineId , paymentMode);  //pass payment mode here
                                //         log.debug('getCreatedSalesOrder', getCreatedSalesOrder);
                                //         if (getCreatedSalesOrder) {
                                //             record.submitFields({
                                //                 type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                                //                 id: parseInt(contractLineId),
                                //                 values: {
                                //                     custrecord_dsc_clf_so_reference: getCreatedSalesOrder
                                //                 },
                                //                 options: {
                                //                     enableSourcing: false,
                                //                     ignoreMandatoryFields: true
                                //                 }
                                //             });
                                //         }
                                //     }
                                // }
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
        const salesOrderfromPreviousContractLine = (previousContractLineId) => { //getting payment mode & salesOrderRef here
            const title = "salesOrderfromPreviousContractLine ::"
            try {
                let searchObj = search.lookupFields({
                    type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                    id: parseInt(previousContractLineId),
                    columns: ['custrecord_dsc_clf_so_reference', 'custrecord_dsc_clf_payment_mode']
                });
                let contractLineSalesOrderRef = searchObj.custrecord_dsc_clf_so_reference && searchObj.custrecord_dsc_clf_so_reference[0] ? searchObj.custrecord_dsc_clf_so_reference[0].value : "";
                let  paymentMode = searchObj.custrecord_dsc_clf_payment_mode && searchObj.custrecord_dsc_clf_payment_mode[0] ? searchObj.custrecord_dsc_clf_payment_mode[0].value : "";
                log.debug({title: title + 'contractLineSalesOrderRef' , details: contractLineSalesOrderRef})

                return {contractLineSalesOrderRef , paymentMode};
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }

        }
        const createSalesOrder = (salesOrderId, contractLineId , paymentMode) => {
            const title = "createSalesOrder ::"
            try {
                let newSalesOrder = record.copy({
                    type: record.Type.SALES_ORDER,
                    id: parseInt(salesOrderId)
                    // isDynamic: true
                });
                newSalesOrder.setValue('custbody_dsc_contract_line', contractLineId);
                newSalesOrder.setValue('trandate', new Date());


                //set payment mode
                log.debug({title: title + 'paymentMode' , details: paymentMode})

                // newSalesOrder.setValue('paymentoption', paymentMode);
                // newSalesOrder.setValue('custbody_dsc_payment_method', paymentMode);


                //remove padlock item 
                let getLineCount = newSalesOrder.getLineCount({
                    sublistId: 'item'
                })
                for (let i = getLineCount - 1; i >= 0; i--) {
                    let itemId = newSalesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                
                    if (itemId == constantsLib.PADLOCK_ITEM_ID || itemId == constantsLib.PACKING_CHARGES_ITEM_ID) {
                        newSalesOrder.removeLine({
                            sublistId: 'item',
                            line: i
                        });
                    }
                }

                let createdRecordId = newSalesOrder.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return createdRecordId;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }

        }
        const getContractLines = (contractId, contractLineId) => {
            const logTitle = " getContractLines() ";
            try {
                let contractLineStatus = constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_CLOSED;
                var contractLineSearchObj = search.create({
                    type: "customrecord_dsc_contract_line",
                    filters: [
                        ["custrecord_dsc_clf_parent_contract", "anyof", contractId],
                        "AND",
                        ["custrecord_dsc_clf_status", "noneof", contractLineStatus],
                        "AND",
                        ["internalid", "noneof", contractLineId]
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
                        })
                    ]
                });
                const searchResults = contractLineSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                if (searchResults && searchResults.length > 0) {
                    let contractLine = searchResults[0].getValue(({
                        name: 'internalid'
                    }));
                    return contractLine;
                } else {
                    return '';
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
            }
        }
        return {
            afterSubmit
        }
    });