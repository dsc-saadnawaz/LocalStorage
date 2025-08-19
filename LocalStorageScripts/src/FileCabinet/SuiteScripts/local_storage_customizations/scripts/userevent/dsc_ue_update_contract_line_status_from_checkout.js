/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (record, search, n_error, utils, constantsLib) => {
        const beforeSubmit = (context) => {
            const title = "beforeSubmit ::"
            try {
                if (context.type == context.UserEventType.EDIT) {
                    let recordObj = context.newRecord;
                    let checkoutId = recordObj.id;
                    log.debug('checkoutId', checkoutId)
                    let checkoutStatus = recordObj.getValue('custrecord_dsc_cf_checkout_status');
                    if (checkoutId && checkoutStatus == constantsLib.FIELD_VALUES.CHECKOUT_STATUS_CLOSED) {
                        let getInvoiceSearchResult = getOpenInvoicesforCheckout(checkoutId);
                        log.debug('getInvoiceSearchResult', getInvoiceSearchResult)
                        if (getInvoiceSearchResult) {
                            throw n_error.create({
                                name: 'CHECKOUT_STATUS_ERROR',
                                message: 'You have open Invoices for this Checkout. Please complete these invoice first'
                            })
                        }
                    }
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })

                if (error.name == "CHECKOUT_STATUS_ERROR") {
                    throw error.name + " " + error.message;
                }
            }
        }

        const afterSubmit = (context) => {
            const title = "afterSubmit ::"
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    let recordObj = context.newRecord;
                    let checkoutId = recordObj.id;
                    if (checkoutId) {

                        let checkoutStatus = recordObj.getValue('custrecord_dsc_cf_checkout_status');
                        let contractLineId = recordObj.getValue('custrecord_dsc_cf_agreement_no');
                        if (contractLineId && checkoutStatus && checkoutStatus == constantsLib.FIELD_VALUES.CHECKOUT_STATUS_CLOSED) {
                            log.debug('afterSubmit contractLineId', contractLineId)
                            setContractLineStatus(contractLineId)
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
        const setContractLineStatus = (contractLineId) => {
            const setContractLineStatus = "afterSubmit :: ";
            try {
                record.submitFields({
                    type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                    id: parseInt(contractLineId),
                    values: {
                        custrecord_dsc_clf_status: constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_CLOSED
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const getOpenInvoicesforCheckout = (checkoutId) => {
            const title = "getOpenInvoicesforCheckout ::"
            try {
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters: [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["status", "anyof", "CustInvc:A", "CustInvc:D"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["custbody_dsc_contract_checkout", "anyof", checkoutId]
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
                            name: "trandate",
                            label: "Date"
                        }),
                        search.createColumn({
                            name: "statusref",
                            label: "Status"
                        }),
                        search.createColumn({
                            name: "createdfrom",
                            label: "Created From"
                        }),
                        search.createColumn({
                            name: "custbody_dsc_contract_line",
                            label: "Contract Line"
                        }),
                        search.createColumn({
                            name: "fxamount",
                            label: "Amount (Foreign Currency)"
                        }),
                        search.createColumn({
                            name: "terms",
                            label: "Terms"
                        }),
                        search.createColumn({
                            name: "custbody_dsc_contract_checkout",
                            label: "Checkout"
                        })
                    ]
                });
                let searchResult = invoiceSearchObj.run().getRange({
                    start: 0,
                    end: 10
                });
                if (searchResult && searchResult.length > 0) {
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
            beforeSubmit,
            afterSubmit
        }
    });