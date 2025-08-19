/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([], function () {

    function lineInit(scriptContext) {
        const title = 'lineInit()::';
        try {
            if (scriptContext.sublistId === 'item') {
                var currentRecord = scriptContext.currentRecord;

                const index = currentRecord.getCurrentSublistIndex({ sublistId: 'item' });
                log.debug({ title: title + 'index', details: index });

                // for (let i = 0; i < itemCount; i++) {

                const itemId = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                });

                if (itemId == '13' || itemId == '14') {
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'price',
                        line: index
                    }).isDisabled = true;
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: index
                    }).isDisabled = true;
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: index
                    }).isDisabled = true;
                } else {
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'price',
                        line: index
                    }).isDisabled = false;
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: index
                    }).isDisabled = false;
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: index
                    }).isDisabled = false;
                }
            }
        } catch (error) {
            log.error({ title: title + 'Error', details: error });

        }

    }

    function fieldChanged(scriptContext) {
        const title = 'fieldChanged()::';
        try {
            if (scriptContext.sublistId === 'item' && scriptContext.fieldId === 'item') {
                var currentRecord = scriptContext.currentRecord;

                const index = currentRecord.getCurrentSublistIndex({ sublistId: 'item' });
                log.debug({ title: title + 'index', details: index });

                const itemId = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                });

                if (itemId == '13' || itemId == '14') {
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'price',
                        line: index
                    }).isDisabled = true;
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: index
                    }).isDisabled = true;
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: index
                    }).isDisabled = true;
                } else {
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'price',
                        line: index
                    }).isDisabled = false;
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: index
                    }).isDisabled = false;
                    currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: index
                    }).isDisabled = false;
                }

            }
        } catch (error) {
            log.error({ title: title + 'Error', details: error });

        }

    }



    return {
        fieldChanged: fieldChanged,
        lineInit: lineInit
    };

});
