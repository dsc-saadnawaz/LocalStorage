/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', 'N/url', 'N/https', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (record, search, n_error, url, https, utils, constantsLib) => {
        const afterSubmit = (context) => {
            const title = "afterSubmit ::"
            try {
                const recObj = context.newRecord;
                let invoiceId = recObj.id;

                if (context.type === context.UserEventType.CREATE) {

                    let getPaymentMode = recObj.getValue('custbody_dsc_payment_method');
                    log.debug('getPaymentMode', getPaymentMode);

                    if (getPaymentMode !== constantsLib.FIELD_VALUES.PAYMENT_METHOD_ONLINE) {
                        // Transform Invoice -> Customer Payment
                        let paymentRec = record.transform({
                            fromType: record.Type.INVOICE,
                            fromId: invoiceId,
                            toType: record.Type.CUSTOMER_PAYMENT,
                            isDynamic: true
                        });

                        // Example: Apply full amount automatically
                        let applyLineCount = paymentRec.getLineCount({
                            sublistId: 'apply'
                        });
                        for (let i = 0; i < applyLineCount; i++) {
                            paymentRec.selectLine({
                                sublistId: 'apply',
                                line: i
                            });
                            let docId = paymentRec.getCurrentSublistValue({
                                sublistId: 'apply',
                                fieldId: 'doc'
                            });
                            if (docId == invoiceId) {
                                paymentRec.setCurrentSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'apply',
                                    value: true
                                });
                            }
                            paymentRec.commitLine({
                                sublistId: 'apply'
                            });
                        }

                        // Save Payment
                        let paymentId = paymentRec.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });

                        log.audit('Customer Payment Created', 'Payment ID: ' + paymentId);

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