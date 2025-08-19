/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(["N/record", "N/search"], (record, search) => {

    const updateStorageUnit = () => {
        const title = "updateStorageUnit ::";
        try {
            log.debug({ title: title, details: "Executed!" });

            // INITIALIZE AN ARRAY TO SAVE THE INTERNAL IDs.
            let internalIds = [];

            // CREATE A SAVE SEARCH
            const unitStoageSearch = search.create({
                type: "customrecord_dsc_storage_unit",
                filters: [
                    ["custrecord_dsc_suf_location_floor", "anyof", "1"],
                    "AND",
                    ["custrecord_dsc_suf_y_coordinate", "startswith", "-447.865"]

                ],
                columns: [search.createColumn({ name: "internalid", sort: search.Sort.ASC })]
            });


            // SAVE INTO AN ARRAY
            const myResultSet = unitStoageSearch.run().getRange({
                start: 0,
                end: 99,
            });

            //  GET ALL THE INTERNAL IDs.
            myResultSet.forEach(element => {
                let internalId = element.getValue({ name: "internalid" })
                internalIds.push(internalId)

            });


            log.debug({
                title: title + "internalIds:: ",
                details: internalIds,
            });

            // UPDATE ALL THE RECORDS BASED ON INTERNAL_ID.
            for (let i = 0; i < internalIds.length; i++) {

                const objRecord = record.load({
                    type: 'customrecord_dsc_storage_unit',
                    id: parseInt(internalIds[i]),
                    isDynamic: true
                });

                // objRecord.setValue({
                //     fieldId: 'custrecord_dsc_suf_height',
                //     value: '20.655',
                //     ignoreFieldChange: true

                // })

                // objRecord.setValue({
                //     fieldId: 'custrecord_dsc_suf_width',
                //     value: '23.1',
                //     ignoreFieldChange: true

                // })

                // const yCoortinatesValue = parseFloat(objRecord.getValue({ fieldId: 'custrecord_dsc_suf_y_coordinate' }));
                // let incrementalValue = yCoortinatesValue - 3;
                // log.debug('yCoortinatesValue', yCoortinatesValue)
                // log.debug('incrementalValue', incrementalValue)

                // objRecord.setValue({
                //     fieldId: 'custrecord_dsc_suf_y_coordinate',
                //     value: incrementalValue,
                //     ignoreFieldChange: true
                // })

                // Getting with of old record
                // const previousWidth = parseFloat(objRecordPrevious.getValue({ fieldId: 'custrecord_dsc_suf_width' }))
                // const previousXCoordinates = parseFloat(objRecordPrevious.getValue({ fieldId: 'custrecord_dsc_suf_x_coordinate' }))


                // const xCoortinatesValue = parseFloat(objRecord.getValue({ fieldId: 'custrecord_dsc_suf_x_coordinate' }));
                // let incrementalValue = xCoortinatesValue - 50;
                // //let incrementalValue = previousWidth + previousXCoordinates;
                // log.debug('xCoortinatesValue', xCoortinatesValue)
                // log.debug('incrementalValue', incrementalValue)

                // objRecord.setValue({
                //     fieldId: 'custrecord_dsc_suf_x_coordinate',
                //     value: incrementalValue,
                //     ignoreFieldChange: true

                // })

                objRecord.setValue({
                    fieldId: 'custrecord_dsc_suf_y_coordinate',
                    value: -424.865,
                    ignoreFieldChange: true

                })

                // objRecord.setValue({
                //     fieldId: 'custrecord_dsc_suf_x_coordinate',
                //     value: -657.515,
                //     ignoreFieldChange: true

                // })

                objRecord.save();

            }

            return true;

        } catch (error) {
            log.error({ title: title + "error", details: error });
        }
    };

    const execute = (scriptContext) => {
        const title = "execute ::";

        const storageType = 1;
        const storageUnitGroup = 2;
        const constantNumber = 15;
        const width = 5.83 * constantNumber;
        // const width = 87.6 - 20;
        const height = 3.775 * constantNumber;
        // const height = 71.55 / 2;
        // const height = 71.55;
        const location = 1;
        const locationFloor = 6; // HERE 6 FOR GROUND FLOOR & 1 FOR FLOOR 1 MAP.
        const availableStatus = 1; // SET THIS STATIC UPTO NOW.

        try {

            log.debug({
                title: title,
                details: "Executed!",
            });

            const recordStatus = updateStorageUnit();
            log.debug({
                title: title + "updateStorageUnit:: ",
                details: recordStatus,
            });
        } catch (error) {
            log.error({ title: title + "error", details: error });
        }
    };

    return { execute };
});
