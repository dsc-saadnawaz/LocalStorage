/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_constants.js', 'N/ui/message'],
    (record, search, n_error, constantsLib, message) => {
        const pageInit = context => {
            const logTitle = " pageInit() ";
            try {

                //log.debug(logTitle+"STORAGE_UNITS_MAPPING", STORAGE_UNITS_MAPPING);
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                console.error("ERROR IN" + logTitle, error);
            }
        }
        const fieldChanged = context => {
            const logTitle = " fieldChanged() ";
            try {
                const currentRecObj = context.currentRecord;
                const sublistNow = context.sublistId;
                const fieldNow = context.fieldId;

                if (sublistNow == "item" && fieldNow == "item") {
                    toggleLineColumnsDisplayType(currentRecObj);
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                console.error("ERROR IN" + logTitle, error);
            }
        }
        const lineInit = context => {
            const logTitle = 'lineInit() :: ';
            try {
                const currentRecObj = context.currentRecord;
                toggleLineColumnsDisplayType(currentRecObj);
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                console.error("ERROR IN" + logTitle, error);
            }
        }

        const postSourcing = context => {
            const logTitle = 'postSourcing() :: ';
            try {
                const currentRecObj = context.currentRecord;
                toggleLineColumnsDisplayType(currentRecObj);
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                console.error("ERROR IN" + logTitle, error);
            }
        }
        const toggleLineColumnsDisplayType = currentRecObj => {
            const logTitle = " toggleLineColumnsDisplayType() ";
            try {
                const itemId = currentRecObj.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item"
                });
                const itemSublistObj = currentRecObj.getSublist({
                    sublistId: "item"
                });
                if (itemId == constantsLib.LATE_CHARGE_ITEM_ID || itemId == constantsLib.DAMAGE_ITEM_ID) {
                    //Disabled Columns against Non-Storage Unit Items
                    for (let fieldObj of constantsLib.NON_STORAGE_UNIT_ITEM_DISABLED_COLUMNS) {
                        itemSublistObj.getColumn(fieldObj).isDisabled = true;
                    }

                } else {
                    for (let fieldObj of constantsLib.NON_STORAGE_UNIT_ITEM_DISABLED_COLUMNS) {
                        itemSublistObj.getColumn(fieldObj).isDisabled = false;
                    }
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error)
            }
        }
        return {
            pageInit,
            fieldChanged,
            lineInit,
            postSourcing
        }
    }
)