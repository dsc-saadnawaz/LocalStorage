/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/url', 'N/https', 'N/runtime'],
    (record, search, utilsLib, constantsLib, url, https, runtime) => {
        const getInputData = (context) => {
            const title = "getInputData ::";
            try {
                let scriptObj = runtime.getCurrentScript();
                let searchParam = scriptObj.getParameter({
                    name: 'custscript_dsc_recurring_invoice_Search'
                });
                if (searchParam) {
                    let billingScheduleData = getbillingScheduleData(searchParam);
                    log.debug('billingScheduleData', billingScheduleData)
                    return billingScheduleData;
                }

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
                let billingScheduleDataObj = JSON.parse(context.value);
                log.debug('billingScheduleDataObj', billingScheduleDataObj);
                if (billingScheduleDataObj.billingScheduleId && billingScheduleDataObj.billingScheduleSo) {
                    let salesOrderDataObj = getSalesOrderData(billingScheduleDataObj.billingScheduleSo);
                    log.debug('salesOrderDataObj', salesOrderDataObj)
                    if (salesOrderDataObj?.contractStatus && ![constantsLib.FIELD_VALUES.CONTRACT_STATUS_CHECKOUT_IN_PROGRESS, constantsLib.FIELD_VALUES.CONTRACT_STATUS_CLOSED].includes(salesOrderDataObj.contractStatus)) {
                        if (salesOrderDataObj.contractLineDuration && salesOrderDataObj.itemQuantity) {
                            let getcontractlineDuration = constantsLib.DURATION_VALUES[salesOrderDataObj.contractLineDuration];
                            if (getcontractlineDuration) {
                                let calulateInvoiceQuantity;
                                if (salesOrderDataObj.paymentType == constantsLib.FIELD_VALUES.PAYMENT_TYPE_PARTIAL_PAYMENT) {
                                    calulateInvoiceQuantity = Number(parseFloat(salesOrderDataObj.itemQuantity) / getcontractlineDuration);
                                } else {
                                    calulateInvoiceQuantity = Number(parseFloat(salesOrderDataObj.itemQuantity));
                                }
                                if (calulateInvoiceQuantity) {
                                    let createdInvoice = createNewInvoice(billingScheduleDataObj, calulateInvoiceQuantity, salesOrderDataObj);
                                    if (createdInvoice) {
                                        record.submitFields({
                                            type: constantsLib.RECORD_TYPES.BILLING_SCHEDULE,
                                            id: parseInt(billingScheduleDataObj.billingScheduleId),
                                            values: {
                                                custrecord_dsc_pbs_invoice_reference: parseInt(createdInvoice),
                                                custrecord_dsc_pbs_invoice_status: constantsLib.PAYMENT_BILLING_SCHEDULE.INVOICE_STATUS_COMPLETE,
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
                    }
                    // log.debug("createdInvoice", createdInvoice)
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        };
        const getbillingScheduleData = (searchId) => {
            const logTitle = " getbillingScheduleData() ";
            try {
                var billingScheduleSearch = search.load({
                    id: searchId
                });
                let billingScheduleDataObj = {};
                const searchResults = utilsLib.getAllSearchResults(billingScheduleSearch);
                // log.debug(logTitle + "searchResults", searchResults);
                if (searchResults && searchResults.length > 0) {
                    searchResults.forEach((result) => {
                        let billingScheduleId = result.getValue({
                            name: 'internalid'
                        });

                        let billingScheduleSo = result.getValue({
                            name: 'custrecord_dsc_pbs_sales_order'
                        });
                        let billingScheduleStatus = result.getValue({
                            name: 'custrecord_dsc_pbs_invoice_status'
                        });
                        if (billingScheduleId && billingScheduleSo && billingScheduleStatus == constantsLib.PAYMENT_BILLING_SCHEDULE.INVOICE_STATUS_PENDING) {
                            let billingScheduleInvDate = result.getValue({
                                name: 'custrecord_dsc_pbs_invoice_date'
                            });
                            let billingScheduleInvAmount = result.getValue({
                                name: 'custrecord_dsc_pbs_invoice_amount'
                            });
                            if (!billingScheduleDataObj[billingScheduleId]) {
                                billingScheduleDataObj[billingScheduleId] = {
                                    billingScheduleId,
                                    billingScheduleSo,
                                    billingScheduleInvDate,
                                    billingScheduleStatus,
                                    billingScheduleInvAmount
                                }
                            }
                        }
                    })
                }
                return billingScheduleDataObj;
            } catch (error) {
                log.error({
                    title: logTitle + 'Error',
                    details: error
                })
            }

        }
        const createNewInvoice = (billingScheduleDataObj, invoiceQty, salesOrderDataObj) => {
            const title = "createNewInvoice ::";
            try {
                log.debug('invoiceQty', invoiceQty)
                let createInvoice = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: parseInt(billingScheduleDataObj.billingScheduleSo),
                    toType: record.Type.INVOICE,
                    // isDynamic: true,
                }); 
                let invoiceDate = billingScheduleDataObj.billingScheduleInvDate ? billingScheduleDataObj.billingScheduleInvDate : new Date()
                // log.debug('invoiceDate',invoiceDate)
                createInvoice.setValue('custbody_dsc_network_status', '');
                createInvoice.setText('trandate', invoiceDate);
                createInvoice.setValue('custbody_dsc_network_order_ref', '');
                createInvoice.setValue('custbody_dsc_network_expiry_date', '');

                const lineCount = createInvoice.getLineCount({
                    sublistId: 'item'
                });
                if (lineCount && lineCount > 0) {
                    for (let i = 0; i < lineCount; i++) {
                        const itemId = createInvoice.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        })
                        if (itemId == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                            createInvoice.setSublistValue({
                                sublistId: "item",
                                fieldId: "quantity",
                                line: i,
                                value: parseFloat(invoiceQty).toFixed(2)
                            })
                        }
                    }
                }

                let createdRecordId = createInvoice.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('createdRecordId', createdRecordId)
                return createdRecordId;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        }
        const getSalesOrderData = (soId) => {
            const logTitle = " getContractLineDuration() ";
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["internalid", "anyof", soId],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["item", "anyof", constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID]
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
                            name: "custbody_dsc_payment_type",
                            label: "Payment Type"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_duration",
                            join: "CUSTBODY_DSC_CONTRACT_LINE",
                            label: "Duration"
                        }),
                        search.createColumn({
                            name: "item",
                            label: "Item"
                        }),
                        search.createColumn({
                            name: "quantity",
                            label: "Quantity"
                        }),

                        search.createColumn({
                            name: "custrecord_dsc_cf_status",
                            join: "CUSTBODY_DSC_SO_PARENT_CONTRACT",
                        })
                    ]
                });
                const searchResults = salesorderSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                let salesOrderObj = {};
                if (searchResults && searchResults.length > 0) {
                    salesOrderObj.soId = searchResults[0].getValue(({
                        name: 'internalid'
                    }));
                    salesOrderObj.itemId = searchResults[0].getValue(({
                        name: 'item'
                    }));
                    salesOrderObj.itemName = searchResults[0].getText(({
                        name: 'item'
                    }));
                    salesOrderObj.itemQuantity = searchResults[0].getValue(({
                        name: 'quantity'
                    }));
                    salesOrderObj.paymentType = searchResults[0].getValue(({
                        name: 'custbody_dsc_payment_type'
                    }));

                    salesOrderObj.contractLineDuration = searchResults[0].getValue(({
                        name: "custrecord_dsc_clf_duration",
                        join: "CUSTBODY_DSC_CONTRACT_LINE",
                    }));
                    salesOrderObj.contractStatus = searchResults[0].getValue(({
                        name: "custrecord_dsc_cf_status",
                        join: "CUSTBODY_DSC_SO_PARENT_CONTRACT",
                    }));
                }
                return salesOrderObj;

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