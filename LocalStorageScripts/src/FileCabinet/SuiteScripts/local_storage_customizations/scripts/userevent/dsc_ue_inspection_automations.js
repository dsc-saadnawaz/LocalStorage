/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/error', 'N/search', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (n_error, search, utilsLib, constantsLib) => {
        const beforeSubmit = context => {
            const logTitle = " beforeSubmit() ";
            log.debug(logTitle, "<--------------- UE Script - START --------------->");
            try {
                const recObj = context.newRecord;
                const checkoutId = recObj.getValue("custrecord_dsc_uif_checkout_reference");
                if (checkoutId) {
                    const checkoutSeachLookup = search.lookupFields({
                        type: constantsLib.RECORD_TYPES.CHECKOUT,
                        id: checkoutId,
                        columns: ['custrecord_dsc_cf_checkout_status']
                    });
                    // log.debug(logTitle+"checkoutSeachLookup", checkoutSeachLookup);
                    const checkoutStatusId = checkoutSeachLookup?.custrecord_dsc_cf_checkout_status?.[0]?.value;
                    // log.debug(logTitle+"checkoutStatusId", checkoutStatusId);
                    if (checkoutStatusId && checkoutStatusId != constantsLib.FIELD_VALUES.CHECKOUT_STATUS_INSPECTION) {
                        throw n_error.create({
                            name: 'DSC_INSPECTION_ALREADY_MARKED_COMPLETE_ERROR',
                            message: 'Cannot create/update inspection record as inspection process is already marked as complete.',
                            notifyOff: false
                        });
                    }
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error.message;
            }
            log.debug(logTitle, "<--------------- UE Script - END --------------->");
        }
        return {
            beforeSubmit
        }
    }
)