/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', '../../lib/dsc_lib_constants.js'],

    (record, runtime, constantsLib) => {

        const getInputData = (context) => {
            const logTitle = " getInputData :: "
            try {
                let storageUnitDataMapObj = {};
                let dataString = runtime.getCurrentScript().getParameter({ name: 'custscript_unit_data_to_send' });
                let unitDataObj = JSON.parse(dataString);
                log.debug(logTitle+"unitDataObj", unitDataObj);
                unitDataObj.storageUnitsDataArray.forEach(unitId => {
                    storageUnitDataMapObj[unitId] = unitDataObj.price
                });
                return storageUnitDataMapObj
            } catch (error) {
                log.error("ERROR IN"+logTitle, error);
            }
        }
        const map = (context) => {
            const logTitle = " map ::"
            try {
                let unitId = context.key;
                let price = context.value

                const updatedStorageUnitId = record.submitFields({
                    type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                    id: unitId,
                    values: {
                        custrecord_dsc_suf_storage_unit_price: price
                    },
                });
                log.debug(logTitle + "updatedStorageUnitId", updatedStorageUnitId);
            } catch (error) {
                log.error("ERROR IN"+logTitle, error);
            }
        }
        return { getInputData, map }
    });
