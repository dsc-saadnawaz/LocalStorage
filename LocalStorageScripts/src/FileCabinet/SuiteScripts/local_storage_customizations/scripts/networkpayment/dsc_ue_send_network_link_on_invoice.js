/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/runtime', 'N/https', 'N/url'],
    (record, search, n_error, utilsLib, constantsLib, runtime, https, url) => {
        const afterSubmit = (context) => {
            const title = "afterSubmit ::"
            try {
                let recordObj = context.newRecord;
                let oldRecordObj = context.oldRecord;
                let lateInvoice = recordObj.getValue('custbody_dsc_network_late_invoice');
                let oldLateInvoice = oldRecordObj?.getValue('custbody_dsc_network_late_invoice');
                let resendNetworkLinkOld = oldRecordObj?.getValue('custbody_dsc_resend_netowrk_link');
                let resendNetworkLinkNew = recordObj.getValue('custbody_dsc_resend_netowrk_link');
                let networkPaymentSyncStatus = recordObj.getValue('custbody_dsc_network_status');
                let networkPaymentExpiryDate = recordObj.getText('custbody_dsc_network_expiry_date');


                if (context.type == context.UserEventType.CREATE ||
                    (context.type == context.UserEventType.EDIT && lateInvoice && !oldLateInvoice && lateInvoice != oldLateInvoice) ||
                    (context.type == context.UserEventType.EDIT) && resendNetworkLinkNew && networkPaymentSyncStatus == constantsLib.NETWORK_PAYMENT_INVOICE_STATUS.ERRORED) {

                    if (context.type == context.UserEventType.EDIT && resendNetworkLinkNew && networkPaymentSyncStatus == constantsLib.NETWORK_PAYMENT_INVOICE_STATUS.ERRORED) {
                        if (networkPaymentExpiryDate) {
                            log.debug('networkPaymentExpiryDate',networkPaymentExpiryDate)
                            let getDateFormat = utilsLib.formatNsDateStringToObject(networkPaymentExpiryDate);
                            if (getDateFormat && getDateFormat.getTime() < new Date().getTime()) {
                                return;
                            }
                        }
                    }

                    let invoiceId = recordObj.id;
                    let invoicePaymentOption = recordObj.getValue('paymentoption');
                    let invoiceContractLine = recordObj.getValue('custbody_dsc_contract_line');
                    let scriptObj = runtime.getCurrentScript();
                    let daysforLinkExpire;
                    if (lateInvoice || lateInvoice == "T") {
                        daysforLinkExpire = scriptObj.getParameter({
                            name: 'custscript_dsc_network_expiryday_lateinv'
                        });
                    } else {
                        daysforLinkExpire = scriptObj.getParameter({
                            name: 'custscript_dsc_networklink_expirydays'
                        });
                    }
                    // let contractLinePaymentMode;
                    if (invoiceContractLine) {
                        let searchObj = search.lookupFields({
                            type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                            id: parseInt(invoiceContractLine),
                            columns: ['custrecord_dsc_clf_payment_mode']
                        });
                        let contractLinePaymentMode = searchObj.custrecord_dsc_clf_payment_mode && searchObj.custrecord_dsc_clf_payment_mode[0] ? searchObj.custrecord_dsc_clf_payment_mode[0].value : "";

                        /// check payment mode and expiry date
                        if (invoiceId && daysforLinkExpire && contractLinePaymentMode && contractLinePaymentMode == constantsLib.FIELD_VALUES.PAYMENT_METHOD_ONLINE) {
                            let invoiceObj = {}
                            invoiceObj.invoiceId = invoiceId;
                            invoiceObj.daysforLinkExpire = daysforLinkExpire;
                            let slUrl = url.resolveScript({
                                scriptId: 'customscript_dsc_sl_network_link_invoice',
                                deploymentId: 'customdeploy_dsc_sl_network_link_invoice',
                                returnExternalUrl: true
                            });

                            log.debug({
                                title: title + 'slUrl',
                                details: slUrl
                            })

                            const response = https.post({
                                url: slUrl,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    invoiceObj,
                                    action: 'INVOICE_LINK'
                                }),
                            });
                            log.debug({
                                title: title + 'response',
                                details: response
                            })
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
        return {
            afterSubmit
        }
    });