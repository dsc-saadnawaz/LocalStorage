/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/ui/serverWidget'],
    (record, search, utilsLib, constantsLib, serverWidget) => {
        const afterSubmit = context => {
            const logTitle = "afterSubmit";
            try {
                let recordObj = context.newRecord;
                let recordObjOld = context.oldRecord;
                let recordId = recordObj.id;
                let storageUnitType = recordObj.getValue('custrecord_dsc_suf_storage_type')
                if ((context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) && storageUnitType != "3") {

                    let storageArea = recordObj.getValue('custrecord_dsc_area_square_feet')
                    let storageAreaPrice = recordObj.getValue('custrecord_dsc_storage_unit_rpsf');

                    if (storageArea && storageAreaPrice) {
                        let totalAmount = Number(storageArea) * Number(storageAreaPrice);
                        log.debug('totalAmount', totalAmount)
                        if (totalAmount) {
                            record.submitFields({
                                type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                                id: parseInt(recordId),
                                values: {
                                    custrecord_dsc_suf_storage_unit_price: totalAmount
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                    }

                }
                if ((context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) && storageUnitType == "3") {
                    {
                        let storageUnitLength = recordObj.getValue('custrecord_dsc_suf_length_m');
                        let storageUnitWidth = recordObj.getValue('custrecord_dsc_suf_storage_width_m');
                        let storageAreaPrice = recordObj.getValue('custrecord_dsc_storage_unit_rpsf');

                        let areaCalculation = parseInt((Number(storageUnitLength) * 3.28) * (Number(storageUnitWidth)) * 3.28);
                        let totalAmount = Number(storageAreaPrice) * areaCalculation
                        log.debug('areaCalculation', areaCalculation)
                        log.debug('areaCalculation totalAmount', totalAmount)
                        if (areaCalculation) {
                            record.submitFields({
                                type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                                id: parseInt(recordId),
                                values: {
                                    custrecord_dsc_unit_area_open_space: areaCalculation,
                                    custrecord_dsc_suf_storage_unit_price: totalAmount
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
                log.error("ERROR IN" + logTitle, error);
            }
        }

        return {
            afterSubmit
        }
    }
)