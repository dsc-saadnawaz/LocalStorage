/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/runtime', 'N/https', 'N/url', 'N/task'],
    (record, search, n_error, utilsLib, constantsLib, runtime, https, url, task) => {
        const afterSubmit = (context) => {
            const title = "afterSubmit ::"
            try {
                if (context.type == context.UserEventType.CREATE) {
                    let recordObj = context.newRecord;
                    let soId = recordObj.id;
                    let contractLine = recordObj.getValue('custbody_dsc_contract_line');
                    let soCustomerDeposit = recordObj.getValue('custbody_dsc_so_customer_dpeosit');
                    let soCustomerDepositInclude = recordObj.getValue('custbody_dsc_include_customer_deposit');
                    let soPaymentOption = recordObj.getValue('paymentoption');
                    let salesOrderStatus = recordObj.getValue('status');
                    let salesOrderBillingtype = recordObj.getValue('custbody_dsc_payment_type')
                    if (contractLine && salesOrderBillingtype) {
                        let searchLookUpObj = search.lookupFields({
                            type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                            id: parseInt(contractLine),
                            columns: ['custrecord_dsc_clf_duration', 'custrecord_dsc_clf_start_date', 'custrecord_dsc_clf_payment_mode']
                        });
                        log.debug('searchLookUpObj', searchLookUpObj)
                        let contractLinePaymentMode = searchLookUpObj.custrecord_dsc_clf_payment_mode && searchLookUpObj.custrecord_dsc_clf_payment_mode[0] ? searchLookUpObj.custrecord_dsc_clf_payment_mode[0].value : "";
                        let contractLineDuration = searchLookUpObj.custrecord_dsc_clf_duration && searchLookUpObj.custrecord_dsc_clf_duration[0] ? searchLookUpObj.custrecord_dsc_clf_duration[0].value : "";
                        let contractLineStartDate = searchLookUpObj.custrecord_dsc_clf_start_date ? searchLookUpObj.custrecord_dsc_clf_start_date : "";
                        // log.debug('constantsLib.DURATION_VALUES[contractLineDuration]', constantsLib.DURATION_VALUES[contractLineDuration])
                        let contractLineDurationMonth = constantsLib.DURATION_VALUES[contractLineDuration];
                        log.debug('contractLineDurationMonth', contractLineDurationMonth)
                        let createdBillingScheduleRecordArr = [];
                        /// check online payment method && duration months
                        if (contractLineDuration && contractLineDurationMonth > 0 && contractLineStartDate && contractLinePaymentMode == constantsLib.FIELD_VALUES.PAYMENT_METHOD_ONLINE) {
                            let salesOrderData = getSalesOrderUnitPrice(soId)
                            log.debug('salesOrderData', salesOrderData)
                            // return;
                            if (salesOrderData && (salesOrderData.storageUnitTotalAmount || salesOrderData.otherItemsAmount)) {
                                let storageUnitTotal;
                                if (salesOrderBillingtype == constantsLib.FIELD_VALUES.PAYMENT_TYPE_PARTIAL_PAYMENT) {
                                    storageUnitTotal = parseFloat(salesOrderData.storageUnitTotalAmount / contractLineDurationMonth).toFixed(2);

                                } else {
                                    storageUnitTotal = parseFloat(salesOrderData.storageUnitTotalAmount)
                                }
                                log.debug('storageUnitTotal', storageUnitTotal)
                                let invoiceAmount = Number(storageUnitTotal);
                                // let customerDepositTotalPayment = 0;
                                ///customer deposit calculations

                                // if (soCustomerDeposit && soCustomerDepositInclude) {
                                //     let searchLookUpCustomerDeposit = search.lookupFields({
                                //         type: search.Type.CUSTOMER_DEPOSIT,
                                //         id: parseInt(soCustomerDeposit),
                                //         columns: ['payment', 'custbody_dsc_network_payment_received']
                                //     });
                                //     let customerDepositPayment = searchLookUpCustomerDeposit?.payment
                                //     let customerDepositPaymentReceived = searchLookUpCustomerDeposit?.custbody_dsc_network_payment_received;
                                //     if (!customerDepositPaymentReceived) {
                                //         customerDepositTotalPayment = customerDepositPayment;
                                //     }
                                // }

                                ///// for full payment type on sales order
                                if (salesOrderBillingtype == constantsLib.FIELD_VALUES.PAYMENT_TYPE_FULL_PAYMENT) {

                                    let dateFormat = utilsLib.formatNsDateStringToObject(contractLineStartDate);
                                    if (dateFormat) {
                                        let invoiceDate =  new Date(); //new Date(dateFormat)
                                        // log.debug('invoiceDate ' + i, invoiceDate)
                                        if (invoiceDate) {
                                            let totalInvoiceAmount = Number(storageUnitTotal) + Number(salesOrderData.otherItemsAmount) + Number(salesOrderData.otherItemsAmountTax);
                                            log.debug('totalInvoiceAmount full type', totalInvoiceAmount)
                                            log.debug('invoiceDate full type', invoiceDate)
                                            let createdBillingScheduleRecord = createBillingSchedule(soId, invoiceDate, totalInvoiceAmount);
                                            if (createdBillingScheduleRecord) {
                                                let mrTask = task.create({
                                                    taskType: task.TaskType.MAP_REDUCE,
                                                    scriptId: constantsLib.MAP_REDUCE_SCRIPTS.RECURRING_INVOICES_SCRIPT
                                                });
                                                let mrTaskId = mrTask.submit();
                                                log.debug("mrTaskId", mrTaskId)
                                            }
                                        }
                                    }

                                } else { ////// for partial type payment on sales order
                                    for (let i = 0; i < contractLineDurationMonth; i++) {
                                        let dateFormat = new Date();//utilsLib.formatNsDateStringToObject(contractLineStartDate);
                                        if (dateFormat) {
                                            let invoiceDate = new Date(dateFormat.setMonth(dateFormat.getMonth() + i));
                                            log.debug('invoiceDate ' + i, invoiceDate)
                                            if (invoiceDate) {
                                                if (i == 0) {
                                                    invoiceDate = new Date();
                                                    let totalInvoiceAmount = Number(storageUnitTotal) + Number(salesOrderData.otherItemsAmount) + Number(salesOrderData.otherItemsAmountTax);
                                                    // log.debug('totalInvoiceAmount', totalInvoiceAmount)
                                                    let createdBillingScheduleRecord = createBillingSchedule(soId, invoiceDate, totalInvoiceAmount);
                                                    if (createdBillingScheduleRecord) {
                                                        var mrTask = task.create({
                                                            taskType: task.TaskType.MAP_REDUCE,
                                                            scriptId: constantsLib.MAP_REDUCE_SCRIPTS.RECURRING_INVOICES_SCRIPT
                                                        });
                                                        let mrTaskId = mrTask.submit();
                                                        log.debug("mrTaskId", mrTaskId)
                                                    }
                                                } else {
                                                    let createdBillingScheduleRecord = createBillingSchedule(soId, invoiceDate, invoiceAmount);
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
        const getSalesOrderUnitPrice = (soId) => {
            const title = "getSalesOrderUnitPrice ::"
            try {
                let salesOrderObj = {};
                salesOrderObj.otherItemsAmount = 0;
                salesOrderObj.otherItemsAmountTax = 0;
                salesOrderObj.storageUnitTotalAmount = 0;

                let salesOrderRec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: parseInt(soId)
                });

                const lineCount = salesOrderRec.getLineCount({
                    sublistId: 'item'
                });
                if (lineCount && lineCount > 0) {

                    for (let i = 0; i < lineCount; i++) {
                        const itemId = salesOrderRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        // log.debug('itemId', itemId)
                        if (itemId == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                            let storageUnitAmount = salesOrderRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i
                            });
                            let storageUnitTaxAmount = salesOrderRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'tax1amt',
                                line: i
                            });
                            salesOrderObj.storageUnitTotalAmount = storageUnitAmount + storageUnitTaxAmount

                        } else {
                            let otherItemsAmount = salesOrderRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i
                            });
                            let otherItemsAmountTax = salesOrderRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'tax1amt',
                                line: i
                            });
                            salesOrderObj.otherItemsAmount += otherItemsAmount;
                            salesOrderObj.otherItemsAmountTax += otherItemsAmountTax;
                        }
                    }
                    return salesOrderObj;
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const createBillingSchedule = (soId, invoiceDate, invoiceAmount) => {
            const title = "createBillingSchedule ::"
            try {
                if (invoiceAmount && invoiceDate) {

                    let billingScheduleRecord = record.create({
                        type: constantsLib.RECORD_TYPES.BILLING_SCHEDULE,
                        isDynamic: true
                    });
                    billingScheduleRecord.setValue('custrecord_dsc_pbs_sales_order', soId);
                    billingScheduleRecord.setValue('custrecord_dsc_pbs_invoice_date', new Date(invoiceDate));
                    billingScheduleRecord.setValue('custrecord_dsc_pbs_invoice_amount', parseFloat(invoiceAmount).toFixed(2));
                    billingScheduleRecord.setValue('custrecord_dsc_pbs_invoice_status', constantsLib.PAYMENT_BILLING_SCHEDULE.INVOICE_STATUS_PENDING);

                    let createdRecordId = billingScheduleRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    return createdRecordId;
                }

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