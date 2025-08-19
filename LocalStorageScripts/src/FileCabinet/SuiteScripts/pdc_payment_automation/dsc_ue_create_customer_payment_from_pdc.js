/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

const PDC_PAYMENT_ACCOUNT = 519;
define(['N/record', 'N/search'], (record, search) => {

    const PostDateCheckStatus = {
        PAID: 2
    }

    const PaymentMethod = {
        CHECK: 2
    }



    const afterSubmit = context => {
        const title = 'afterSubmit :: ';
        try {
            const { newRecord, UserEventType, type } = context;
            if (type == UserEventType.CREATE || type == UserEventType.EDIT || type == UserEventType.XEDIT) {
                const newRecObj = record.load({
                    type: newRecord.type,
                    id: newRecord.id
                });
                const pdcStatus = newRecObj.getValue({
                    fieldId: 'custrecord_dsc_pdcf_status'
                });

                const checkNumber = newRecObj.getValue({
                    fieldId: 'custrecord_dsc_pdcf_check_num'
                });
                const customerPaymentId = newRecObj.getValue({
                    fieldId: 'custrecord_dsc_pdcf_customer_payment'
                })
                const pdcAmount = newRecObj.getValue({
                    fieldId: 'custrecord_dsc_pdcf_amount'
                })

                const invoiceId = newRecObj.getValue({
                    fieldId: 'custrecord_dsc_pdcf_invoice_ref'
                });

                // const customerDeposit = newRecObj.getValue({
                //     fieldId: 'custrecord_dsc_pdcf_deposit_ref'
                // });
                log.debug({ title: title + 'pdcAmount', details: pdcAmount });
                log.debug({ title: title + 'invoiceId', details: invoiceId });
                log.debug({ title: title + 'checkNumber', details: checkNumber });
                log.debug({ title: title + 'pdcStatus', details: pdcStatus });
                log.debug({ title: title + 'customerPaymentId', details: customerPaymentId });
                // log.debug({ title: title + 'customerDeposit', details: customerDeposit });

                const invoiceFields = search.lookupFields({
                    type: search.Type.INVOICE,
                    id: invoiceId,
                    columns: ['amountremaining', 'createdfrom', 'entity','custbody_dsc_contract_line']
                });

                log.debug({ title: title + 'invoiceFields', details: invoiceFields });

                const invoiceRemainingAmount = invoiceFields?.amountremaining;
                const salesOrderId = invoiceFields?.createdfrom?.[0]?.value;
                const customerId = invoiceFields?.entity?.[0]?.value;
                const contractId = invoiceFields?.custbody_dsc_contract_line?.[0]?.value;

                let paymentAmount = null;
                let extraAmount = null;
                // if (invoiceRemainingAmount > 0 || pdcAmount > 0) {
                //     if (invoiceRemainingAmount < pdcAmount) {
                //         paymentAmount = invoiceRemainingAmount;
                //         extraAmount = pdcAmount - invoiceRemainingAmount;
                //     } else if (invoiceRemainingAmount >= pdcAmount) {
                //         paymentAmount = pdcAmount;
                //     }
                // }
                paymentAmount = pdcAmount ? pdcAmount : 0;

                log.debug({ title: title + 'paymentAmount', details: paymentAmount });
                log.debug({ title: title + 'extraAmount', details: extraAmount });


                if (pdcStatus == PostDateCheckStatus.PAID) {
                    const updatedFields = {};
                    if (!customerPaymentId && paymentAmount > 0 && contractId) {
                        const newPaymentId = convertToCustomerPayment(paymentAmount, checkNumber, invoiceId, contractId);
                        log.debug({ title: title + 'newPaymentId', details: newPaymentId });
                        if (newPaymentId) {

                            updatedFields.custrecord_dsc_pdcf_customer_payment = newPaymentId

                            log.debug({ title: title + '"PAYMENT ATTACHED"', details: "PAYMENT ATTACHED" });

                        }

                    }

                    // if (extraAmount > 0 && salesOrderId && customerId && !customerDeposit) {
                    //     const customerDepositId = convertToCustomerDepsit(salesOrderId, extraAmount, customerId, checkNumber, newRecObj.id,contractId);
                    //     log.debug({ title: title + 'customerDepositId', details: customerDepositId });

                    //     if (customerDepositId) {
                    //         updatedFields.custrecord_dsc_pdcf_deposit_ref = customerDepositId;
                    //     }
                    // }

                    log.debug({ title: title + 'updatedFields', details: updatedFields });

                    record.submitFields({
                        type: newRecObj.type,
                        id: newRecObj.id,
                        values: updatedFields
                    });

                    log.debug({ title: title + '"DEPOSIT ATTACHED"', details: "DEPOSIT ATTACHED" });
                }
            }

            log.debug({ title: title + '"END"', details: "END" });
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    const convertToCustomerDepsit = (salesOrderId, amount, customerId, checkNumber, pdcId,contractId) => {
        const title = 'convertToCustomerDepsit :: ';
        try {
            const customerDeposit = record.create({
                type: record.Type.CUSTOMER_DEPOSIT,
                isDynamic: true,
                defaultValues: {
                    salesorder: salesOrderId,
                    entity: customerId
                }
            });

            customerDeposit.setValue({
                fieldId: 'payment',
                value: amount
            });
            customerDeposit.setValue({
                fieldId: 'custbody_dsc_deposit_contract',
                value: contractId
            });
            

            customerDeposit.setValue({
                fieldId: 'paymentmethod',
                value: PaymentMethod.CHECK
            });

            customerDeposit.setValue({
                fieldId: 'checknum',
                value: checkNumber
            })
            customerDeposit.setValue({
                fieldId: 'custbody_dsc_associated_pdc',
                value: pdcId
            })



            const customerDepositId = customerDeposit.save({
                ignoreMandaotryFields: true
            });
            return customerDepositId;
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    const convertToCustomerPayment = (amount, checkNumber, invoiceId , contractId) => {
        const title = 'convertToCustomerDepsit :: ';
        try {

            const customerPayment = record.transform({
                fromType: record.Type.INVOICE,
                fromId: invoiceId,
                toType: record.Type.CUSTOMER_PAYMENT,
                isDynamic: false
            });
            customerPayment.setValue('account',PDC_PAYMENT_ACCOUNT);
            customerPayment.setValue('custbody_dsc_contract_line',contractId);
            const lineCount = customerPayment.getLineCount({
                sublistId: 'apply'
            });

            log.debug({ title: title + 'lineCount', details: lineCount });

            for (let i = 0; i < lineCount; i++) {

                const paymentInvId = customerPayment.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'doc',
                    line: i
                })

                if (paymentInvId == invoiceId) {
                    customerPayment.setSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        line: i,
                        value: true
                    });

                    customerPayment.setSublistValue({
                        sublistId: 'apply',
                        fieldId: 'amount',
                        line: i,
                        value: amount
                    })

                    break;
                }
            }


            customerPayment.setValue({
                fieldId: 'paymentmethod',
                value: PaymentMethod.CHECK
            });

            customerPayment.setValue({
                fieldId: 'checknum',
                value: checkNumber
            })

            const customerPaymentId = customerPayment.save({
                ignoreMandaotryFields: true
            });
            return customerPaymentId;
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    return {
        afterSubmit
    }
})