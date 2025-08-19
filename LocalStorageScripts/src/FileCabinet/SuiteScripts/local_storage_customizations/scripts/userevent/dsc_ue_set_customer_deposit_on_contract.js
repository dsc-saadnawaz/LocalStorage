/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (record, search, n_error, utils, constantsLib) => {
        const afterSubmit = (context) => {
            const title = "afterSubmit ::"
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    let recordObj = context.newRecord;
                    let recordId = recordObj.id;
                    if (recordId) {

                        let getContractId = recordObj.getValue('custbody_dsc_deposit_contract');
                        if (getContractId) {
                            record.submitFields({
                                type: constantsLib.RECORD_TYPES.CONTRACT,
                                id: parseInt(getContractId),
                                values: {
                                    custrecord_dsc_cf_customer_deposit: recordId
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
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