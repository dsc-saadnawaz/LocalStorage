/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (record, search, n_error, utils, constantsLib) => {
        const afterSubmit = (context) => {
            const title = "afterSubmit ::"
            try {
                if (context.type == context.UserEventType.CREATE) {
                    let recordObj = context.newRecord;
                    let recordId = recordObj.id;
                    if (recordId) {

                        let getParentContractId = recordObj.getValue('custbody_dsc_deposit_contract');
                        if (getParentContractId) {
                            let searchLookUpObj = search.lookupFields({
                                type: constantsLib.RECORD_TYPES.CONTRACT,
                                id: parseInt(getParentContractId),
                                columns: ['custrecord_dsc_cf_checkout']
                            });
                            log.debug('searchLookUpObj', searchLookUpObj)
                            let parentContractCheckout = searchLookUpObj?.custrecord_dsc_cf_checkout[0]?.value;

                            let searchLookUpObjCheckout = search.lookupFields({
                                type: constantsLib.RECORD_TYPES.CHECKOUT,
                                id: parseInt(parentContractCheckout),
                                columns: ['custrecord_dsc_cf_checkout_status']
                            });
                            log.debug('searchLookUpObjCheckout', searchLookUpObjCheckout)

                            let checkoutStatus = searchLookUpObjCheckout?.custrecord_dsc_cf_checkout_status[0]?.value;

                            if (parentContractCheckout && checkoutStatus == constantsLib.FIELD_VALUES.CHECKOUT_STATUS_REFUND_PENDING) {
                                record.submitFields({
                                    type: constantsLib.RECORD_TYPES.CHECKOUT,
                                    id: parseInt(parentContractCheckout),
                                    values: {
                                        custrecord_dsc_cf_checkout_status: constantsLib.FIELD_VALUES.CHECKOUT_STATUS_REFUND_PROCESSED
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