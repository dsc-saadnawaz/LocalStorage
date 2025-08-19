/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(['N/search', 'N/format'], (search, format) => {

    const pageInit = context => {
        const title = 'pageInit :: ';
        try {
            const { currentRecord, mode } = context;
            if (mode == 'edit') {
                const autoCalc = currentRecord.getValue({
                    fieldId: 'custbody_dsc_tbf_calc_due_date_frm_bl'
                });
                log.debug({ title: title + 'autoCalc', details: autoCalc });
                if (autoCalc) {
                    const dueDateField = currentRecord.getField({
                        fieldId: 'duedate'
                    });

                    dueDateField.isDisabled = true;
                }
            }
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    const fieldChanged = context => {
        const title = 'fieldChanged :: ';
        try {
            const { currentRecord, fieldId } = context;

            if (fieldId == 'custbody_dsc_tbf_calc_due_date_frm_bl') {

                const autoCalc = currentRecord.getValue({
                    fieldId: 'custbody_dsc_tbf_calc_due_date_frm_bl'
                })

                const blDateValue = currentRecord.getValue({
                    fieldId: 'custbody_dsc_tbf_due_date_bl'
                })
                const dueDateField = currentRecord.getField({
                    fieldId: 'duedate'
                });
                if (autoCalc) {
                    dueDateField.isDisabled = true;

                    const paymentTerms = currentRecord.getValue({
                        fieldId: 'terms'
                    });
                    log.debug({ title: title + 'paymentTerms', details: paymentTerms });
                    const billDueDate = format.parse({
                        value: blDateValue,
                        type: format.Type.DATE
                    })

                    log.debug({ title: title + 'billDueDate', details: billDueDate });
                    if (paymentTerms) {

                        const paymentTermFields = search.lookupFields({
                            type: search.Type.TERM,
                            id: paymentTerms,
                            columns: ['daysuntilnetdue']
                        })

                        log.debug({ title: title + 'paymentTermFields', details: paymentTermFields });
                        const daysTillNetDue = paymentTermFields?.daysuntilnetdue;

                        if (daysTillNetDue) {
                            const newDueDate = billDueDate.getDate() + +daysTillNetDue;
                            billDueDate.setDate(newDueDate);
                            log.debug({ title: title + 'invoiceDueDate', details: billDueDate });

                        }

                        log.debug({ title: title + '"DUE DATE UPDATE AUTOMATICALLY"', details: "DUE DATE UPDATE AUTOMATICALLY" });
                    }

                    currentRecord.setValue({
                        fieldId: 'duedate',
                        value: billDueDate,
                    });
                }
                else {
                    dueDateField.isDisabled = false;
                }
            }
        } catch (error) {
            log.error({ title: title + 'error', details: error });
            dueDateField.isDisabled = false;
        }
    }

    return {
        pageInit,
        fieldChanged
    }
})