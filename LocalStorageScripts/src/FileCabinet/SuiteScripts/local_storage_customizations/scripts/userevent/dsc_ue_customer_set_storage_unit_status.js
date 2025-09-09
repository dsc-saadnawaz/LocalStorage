/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (record, log, utilsLib, constantsLib) => {
        const afterSubmit = context => {
            try {
                const logTitle = " afterSubmit() ";
                if (context.type !== context.UserEventType.CREATE &&
                    context.type !== context.UserEventType.EDIT) {
                    return;
                }

                let newRec = context.newRecord;
                let lineCount = newRec.getLineCount({
                    sublistId: 'recmachcustrecord_dsc_cf_customer' // replace with your child sublist ID
                    
                });

                log.debug(logTitle + "lineCount111", lineCount);
                for (let i = 0; i < lineCount; i++) {
                    let storageUnitId = newRec.getSublistValue({
                        sublistId: 'recmachcustrecord_dsc_cf_customer',
                        fieldId: 'custrecord_dsc_cf_storage_unit', // child field referencing storage unit
                        line: i
                    });

                    let contractStatus = newRec.getSublistValue({
                        sublistId: 'recmachcustrecord_dsc_cf_customer',
                        fieldId: 'custrecord_dsc_cf_status', // child field holding contract status
                        line: i
                    });

                    // log.debug('Storage Unit Update Check', 'Unit ID: ' + storageUnitId)
                    // log.debug('Contract Status Check', 'Status: ' + contractStatus)

                    if (storageUnitId &&
                        contractStatus === constantsLib.FIELD_VALUES.CONTRACT_STATUS_OPEN) {

                        log.debug('Updating Storage Unit', 'Unit ID: ' + storageUnitId +
                            ' | Contract Status: ' + contractStatus);
                        
                        record.submitFields({
                            type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                            id: parseInt(storageUnitId),
                            values: {
                                custrecord_dsc_suf_availability_status: constantsLib.FIELD_VALUES.STORAGE_UNIT_STATUS_OCCUPIED
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }
                }
            } catch (e) {
                log.error('afterSubmit error', e);
            }
        }

        return {
            afterSubmit
        };
    });