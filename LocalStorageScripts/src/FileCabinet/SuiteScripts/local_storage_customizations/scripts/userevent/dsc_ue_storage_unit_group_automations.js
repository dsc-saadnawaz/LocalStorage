/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/search', 'N/record'],
    (utilsLib, constantsLib, search, record) => {
        const beforeSubmit = context => {
            const logTitle = " beforeSubmit() ";
            try {
                const recObj = context.newRecord;
                const namePrefix = "SUG:";
                const nameSuffix = "";
                const delimiter = "x";
                let suGroupName = utilsLib.generateRecordName(recObj, constantsLib.STORAGE_UNIT_GROUP_NAME_SEQUENCE, namePrefix, nameSuffix, delimiter);
                log.debug(logTitle + "suGroupName", suGroupName);
                // if (suGroupName) recObj.setValue("name", suGroupName);
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
            }
        }

        const afterSubmit = context => {
            const logTitle = " afterSubmit() ";
            try {
                const recObj = context.newRecord;
                let recordId = recObj.id;

                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    // let SuGroupArea = recObj.getValue('custrecord_dsc_area', custrecord_dsc_area)
                    // let SuGroupRate = recObj.getValue('custrecord_dsc_ratepersqfeet', custrecord_dsc_ratepersqfeet)
                    // log.debug('SuGroupArea', SuGroupArea)
                    // log.debug('SuGroupRate', SuGroupRate)
                    if (recordId) {
                        getStorageUnits(recordId)
                    }
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
            }
        }

        const getStorageUnits = unitGroupId => {
            const logTitle = " getStorageUnits() ";
            try {
                let storage_unitSearchObj = search.create({
                    type: "customrecord_dsc_storage_unit",
                    filters: [
                        ["custrecord_dsc_suf_storage_unit_group", "anyof", unitGroupId]
                    ],
                    columns: [
                        search.createColumn({
                            name: "name",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_type",
                            label: "Storage Type"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_unit_group",
                            label: "Storage Unit Group"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_storage_unit_rpsf",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_area_square_feet"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_unit_area_open_space"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_length_m"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_width_m"
                        })

                    ]
                });

                const searchResults = storage_unitSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });
                log.debug('searchResults1111', searchResults)
                // let contractLinesData = [];
                for (let i = 0; i < searchResults.length; i++) {
                    const searchResultData = searchResults[i];
                    const storageType = searchResultData.getValue({
                        name: "custrecord_dsc_suf_storage_type"
                    });
                    const storageUnitId = searchResultData.getValue({
                        name: "internalid"
                    });
                    if (storageType && storageUnitId) {

                        let storageUnitArea = searchResultData.getValue({
                            name: "custrecord_dsc_area_square_feet"
                        });
                        const storageUnitRate = searchResultData.getValue({
                            name: "custrecord_dsc_storage_unit_rpsf"
                        });
                        const storageUnitLength = searchResultData.getValue({
                            name: "custrecord_dsc_suf_length_m"
                        });
                        const storageUnitWidth = searchResultData.getValue({
                            name: "custrecord_dsc_suf_storage_width_m"
                        });
                        let storageAreaPrice = storageUnitRate;

                        let storageUnitPrice = Number(storageUnitArea) * Number(storageUnitRate)
                        log.debug('storageUnitPrice', storageUnitPrice)
                        log.debug('storageType', storageType)

                        if(storageType == "3")
                        {
                            let areaCalculation = parseInt((Number(storageUnitLength) * 3.28) * (Number(storageUnitWidth)) * 3.28);
                            let totalAmount = Number(storageAreaPrice) * areaCalculation
                            log.debug('areaCalculation', areaCalculation)
                            log.debug('areaCalculation totalAmount', totalAmount)
                            if (areaCalculation) {
                                record.submitFields({
                                    type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                                    id: parseInt(storageUnitId),
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
                        else
                        {
                            record.submitFields({
                                type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                                id: parseInt(storageUnitId),
                                values: {
                                    custrecord_dsc_suf_storage_unit_price: storageUnitPrice
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
            beforeSubmit,
            afterSubmit
        }
    }
);