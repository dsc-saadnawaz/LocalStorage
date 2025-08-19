/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/url', 'N/https'],
    (record, search, utilsLib, constantsLib, url, https) => {
        const getInputData = (context) => {
            const title = "getInputData ::";
            try {
                let invoiceData = getInvoicesData();
                log.debug('invoiceData', invoiceData)
                return invoiceData;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        }
        const map = (context) => {
            const title = "map ::";
            try {
                let invoiceDataObj = JSON.parse(context.value);
                log.debug('invoiceDataObj', invoiceDataObj);
                if (invoiceDataObj.invoiceId && ![constantsLib.FIELD_VALUES.CONTRACT_STATUS_CHECKOUT_IN_PROGRESS, constantsLib.FIELD_VALUES.CONTRACT_STATUS_CLOSED].includes(invoiceDataObj.contractStatus)) {
                    let updatedLateInvoice = updateLateInvoive(invoiceDataObj);
                    log.debug("updatedLateInvoice", updatedLateInvoice)
                    // let createdInvoice = createNewInvoice(invoiceDataObj)
                    // if (createdInvoice) {
                    //     let createCreditMemo = record.transform({
                    //         fromType: record.Type.INVOICE,
                    //         fromId: parseInt(invoiceDataObj.invoiceId),
                    //         toType: record.Type.CREDIT_MEMO,
                    //         // isDynamic: true,
                    //     });
                    //     let createdRecordId = createCreditMemo.save({
                    //         enableSourcing: true,
                    //         ignoreMandatoryFields: true
                    //     });
                    // }
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        };
        const getInvoicesData = () => {
            const logTitle = " getInvoicesData() ";
            try {
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters: [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["status", "anyof", "CustInvc:A"],
                        "AND",
                        ["custbody_dsc_network_status", "anyof", constantsLib.NETWORK_PAYMENT_INVOICE_STATUS.EXPIRED],
                        "AND",
                        ["custbody_dsc_network_late_invoice", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "entity",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "currency",
                            label: "Currency"
                        }),
                        search.createColumn({
                            name: "expensedate",
                            label: "Expense Date"
                        }),
                        search.createColumn({
                            name: "custbody_dsc_network_status",
                            label: "Network Status"
                        }),
                        search.createColumn({
                            name: "statusref",
                            label: "Status"
                        }),
                        search.createColumn({
                            name: "custbody_dsc_network_order_ref",
                            label: "Network Order Reference"
                        }),
                        search.createColumn({
                            name: "custcol_dsc_location_floor",
                            label: "Floor"
                        }),
                        search.createColumn({
                            name: "custcol_dsc_storage_unit",
                            label: "Storage Unit"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_cf_status",
                            join: "CUSTBODY_DSC_SO_PARENT_CONTRACT",
                        })

                    ]
                });
                let invoiceDataObj = {};
                const searchResults = utilsLib.getAllSearchResults(invoiceSearchObj);
                // log.debug(logTitle + "searchResults", searchResults);
                if (searchResults && searchResults.length > 0) {
                    searchResults.forEach((result) => {
                        let invoiceId = result.getValue({
                            name: 'internalid'
                        });

                        let networkStatus = result.getValue({
                            name: 'custbody_dsc_network_status'
                        });
                        if (invoiceId && networkStatus) {
                            let invoiceStatus = result.getValue({
                                name: 'statusref'
                            });
                            let invoiceLineFloor = result.getValue({
                                name: 'custcol_dsc_location_floor'
                            });
                            let invoiceLineStorage = result.getValue({
                                name: 'custcol_dsc_storage_unit'
                            });
                            let contractStatus = result.getValue(({
                                name: "custrecord_dsc_cf_status",
                                join: "CUSTBODY_DSC_SO_PARENT_CONTRACT",
                            }));
                            if (!invoiceDataObj[invoiceId]) {
                                invoiceDataObj[invoiceId] = {
                                    invoiceId,
                                    invoiceStatus,
                                    invoiceLineFloor,
                                    invoiceLineStorage,
                                    contractStatus
                                }
                            }
                        }
                    })
                }
                return invoiceDataObj;
            } catch (error) {
                log.error({
                    title: logTitle + 'Error',
                    details: error
                })
            }

        }
        const createNewInvoice = (invoiceData) => {
            const title = "createNewInvoice ::";
            try {
                let newInvoice = record.copy({
                    type: record.Type.INVOICE,
                    id: parseInt(invoiceData.invoiceId),
                    isDynamic: true
                });
                newInvoice.setValue('custbody_dsc_network_status', '');
                newInvoice.setValue('trandate', new Date());
                newInvoice.setValue('custbody_dsc_network_order_ref', '');
                newInvoice.setValue('custbody_dsc_network_expiry_date', '');
                newInvoice.setValue('custbody_dsc_network_late_invoice', true);
                //// Add Late Charges Item

                if (invoiceData.invoiceLineStorage && invoiceData.invoiceLineFloor) {
                    newInvoice.selectNewLine({
                        sublistId: 'item'
                    });
                    newInvoice.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: constantsLib.NETWORK_LATE_CHARGES_ITEM
                    });
                    newInvoice.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: 1
                    });
                    newInvoice.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_dsc_location_floor',
                        value: invoiceData.invoiceLineFloor
                    })
                    newInvoice.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_dsc_storage_unit',
                        value: invoiceData.invoiceLineStorage
                    })
                    newInvoice.commitLine({
                        sublistId: 'item'
                    })
                }


                let createdRecordId = newInvoice.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return createdRecordId;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        }
        const updateLateInvoive = (invoiceData) => {
            const title = "updateLateInvoive ::";
            try {
                let invoiceRecord = record.load({
                    type: record.Type.INVOICE,
                    id: parseInt(invoiceData.invoiceId),
                    isDynamic: true
                });
                invoiceRecord.setValue('custbody_dsc_network_status', '');
                invoiceRecord.setValue('trandate', new Date());
                invoiceRecord.setValue('custbody_dsc_network_order_ref', '');
                invoiceRecord.setValue('custbody_dsc_network_expiry_date', '');
                invoiceRecord.setValue('custbody_dsc_network_late_invoice', true);

                invoiceRecord.selectNewLine({
                    sublistId: 'item'
                });
                invoiceRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: constantsLib.NETWORK_LATE_CHARGES_ITEM
                });
                invoiceRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: 1
                });
                // invoiceRecord.setCurrentSublistValue({
                //     sublistId: 'item',
                //     fieldId: 'custcol_dsc_location_floor',
                //     value: invoiceData.invoiceLineFloor
                // })
                // invoiceRecord.setCurrentSublistValue({
                //     sublistId: 'item',
                //     fieldId: 'custcol_dsc_storage_unit',
                //     value: invoiceData.invoiceLineStorage
                // })
                invoiceRecord.commitLine({
                    sublistId: 'item'
                })

                let updatedRecordId = invoiceRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return updatedRecordId;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        }
        return {
            getInputData,
            map
        };

    });