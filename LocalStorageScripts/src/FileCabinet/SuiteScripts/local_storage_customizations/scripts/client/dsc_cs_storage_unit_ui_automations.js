/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', '../../lib/dsc_lib_constants.js'],
    (url, constantsLib) => {
        const pageInit = context => {
            const logTitle = " pageInit() ";
            try {
                const currentRecObj = context.currentRecord;
                const isCustomPrice = currentRecObj.getValue("custrecord_dsc_suf_is_custom_price"); 
                updateUnitPriceField(currentRecObj, isCustomPrice);

                let recordObj = currentRecObj;//scriptContext.currentRecord;
                let storageUnitAres = recordObj.getField('custrecord_dsc_area_square_feet');
                let storageUnitAresOpenSpace = recordObj.getField('custrecord_dsc_unit_area_open_space');
                let storageType = recordObj.getValue('custrecord_dsc_suf_storage_type');
                if (storageType == "3") {
                    storageUnitAres.isDisplay = false;
                }
                else
                {
                    storageUnitAresOpenSpace.isDisplay = false;
                }

            } catch (error) {
                log.error("ERROR IN"+logTitle, error);
            }
        }

        const fieldChanged = context => {
            const logTitle = " fieldChanged () ";
            try {
                const fieldNow = context.fieldId;
                const currentRecObj = context.currentRecord;
                if (fieldNow == "custrecord_dsc_suf_is_custom_price") {
                    const isCustomPrice = currentRecObj.getValue(fieldNow); 
                    updateUnitPriceField(currentRecObj, isCustomPrice);
                }

                let recordObj = currentRecObj;//scriptContext.currentRecord;
                let storageUnitAres = recordObj.getField('custrecord_dsc_area_square_feet');
                let storageUnitAresOpenSpace = recordObj.getField('custrecord_dsc_unit_area_open_space');
                let storageType = recordObj.getValue('custrecord_dsc_suf_storage_type');
                // console.log('storageType fc',storageType)
                if (fieldNow == "custrecord_dsc_suf_storage_type" && storageType == "3") {
                    storageUnitAresOpenSpace.isDisplay = true;
                    storageUnitAres.isDisplay = false;
                }
                if(fieldNow == "custrecord_dsc_suf_storage_type" && storageType != "3")
                {
                    storageUnitAres.isDisplay = true;
                    storageUnitAresOpenSpace.isDisplay = false;
                }

            } catch (error) {
                log.error("ERROR IN"+logTitle, error);
            }
        }

        const updateUnitPriceField = (currentRecObj, isCustomPrice) => {
            const logTitle = " updateUnitPriceField () ";
            try {
                let storageUnitPriceFldObj = currentRecObj.getField("custrecord_dsc_suf_storage_unit_price");
                if (isCustomPrice) {
                    storageUnitPriceFldObj.isDisabled = false;
                } else {
                    storageUnitPriceFldObj.isDisabled = true;
                }
            } catch (error) {
                log.error("ERROR IN"+logTitle, error);
            }
        }

        return {
            pageInit,
            fieldChanged
        }
    }
)