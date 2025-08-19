/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/search', 'N/record', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'], function (search, record, utilslib, constantsLib) {
    const onAction = (context) => {
        const title = ' onAction() :: ';
        try {
            let recordObj = context.newRecord;
            let recordId = recordObj.id;
            log.debug('recordId', recordId)
            if (recordId) {
                let createdRecordId = createCheckoutRecord(recordId);
                log.debug('createdRecordId', createdRecordId)
                if (createdRecordId) {
                    record.submitFields({
                        type: constantsLib.RECORD_TYPES.CONTRACT,
                        id: parseInt(recordId),
                        values: {
                            custrecord_dsc_cf_checkout: createdRecordId,
                            custrecord_dsc_cf_status: constantsLib.FIELD_VALUES.CONTRACT_STATUS_CHECKOUT_IN_PROGRESS
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                }
            }
        } catch (error) {
            log.error({
                title: title + 'error',
                details: error
            })
        }
    }

    const createCheckoutRecord = (recordId) => {

        let checkoutRecord = record.create({
            type: constantsLib.RECORD_TYPES.CHECKOUT,
            isDynamic: true,
        })
        checkoutRecord.setValue('custrecord_dsc_cf_agreement_no', recordId);
        // checkoutRecord.setValue('custrecord_dsc_cf_checkout_status', constantsLib.FIELD_VALUES.CHECKOUT_STATUS_INSPECTION);
        // checkoutRecord.setValue('custrecord_dsc_cf_checkout_date', new Date());
        let savedRecord = checkoutRecord.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });

        return savedRecord;
    }
    return {
        onAction
    }
})