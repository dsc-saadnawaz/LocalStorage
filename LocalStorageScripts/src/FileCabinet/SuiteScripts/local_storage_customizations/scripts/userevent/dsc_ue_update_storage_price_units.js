/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', 'N/task', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],

    (record, search, n_error, task, utilsLib, constantsLib) => {

        const beforeSubmit = (context) => {
            const logTitle = " beforeSubmit ::"
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    let recordObj = context.newRecord;

                    //getting values
                    let storageUnitGroup = recordObj.getValue({ fieldId: 'custrecord_dsc_supf_storage_unit_group' });
                    let location = recordObj.getValue({ fieldId: 'custrecord_dsc_supf_location' });
                    let locationFloor = recordObj.getValue({ fieldId: 'custrecord_dsc_supf_floor' });
                    let price = recordObj.getValue({ fieldId: 'custrecord_dsc_supf_new_price' });

                    //validation
                    if (storageUnitGroup?.length == 0 && location?.length == 0 && locationFloor?.length == 0) {
                        throw n_error.create({
                            name: 'DSC_STORAGE_UNIT_ERROR',
                            message: 'Please provide values for all required fields: STORAGE UNIT GROUP, LOCATION, FLOOR.',
                            notifyOff: false
                        })
                    }
                    // if (!price) {
                    //     throw n_error.create({
                    //         name: 'DSC_STORAGE_UNIT_PRICE_ERROR',
                    //         message: 'Please provide value for field: STORAGE UNIT NEW PRICE.',
                    //         notifyOff: false
                    //     })
                    // }
                }
            } catch (error) {
                log.error("ERROR IN"+logTitle, error);
                throw error.message

            }
        }

        const afterSubmit = (context) => {
            const logTitle = " afterSubmit ::"
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    let recordObj = context.newRecord

                    //getting values
                    let storageUnitGroup = recordObj.getValue({ fieldId: 'custrecord_dsc_supf_storage_unit_group' })
                    let location = recordObj.getValue({ fieldId: 'custrecord_dsc_supf_location' })
                    let locationFloor = recordObj.getValue({ fieldId: 'custrecord_dsc_supf_floor' })
                    let price = recordObj.getValue({ fieldId: 'custrecord_dsc_supf_new_price' })

                    if (
                        (storageUnitGroup?.length > 0 || location?.length > 0 || locationFloor?.length > 0)
                        &&
                        price
                        ) {
                        const storageUnitsDataArray = getStorageUnitsData(storageUnitGroup, locationFloor, location);
                        const dataToSend = {
                            storageUnitsDataArray,
                            price
                        }

                        //task module
                        let mapReduceTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_dsc_mr_update_storag',
                            deploymentId: 'customdeploy_dsc_mr_update',
                            params: {
                                'custscript_unit_data_to_send': JSON.stringify(dataToSend)
                            }
                        });

                        let mapReduceTaskId = mapReduceTask.submit();
                        log.debug({ title: logTitle + 'Map/Reduce Task ID', details: mapReduceTaskId });
                    }
                }

            } catch (error) {
                log.error("ERROR IN"+logTitle, error);
            }
        }

        const getStorageUnitsData = (storageUnitGroup, locationFloor, location) => {
            const logTitle = " getStorageUnitsData() ";
            try {
                const storageUnitsDataArray = [];
                let searchFiltersArray = [];
                if (storageUnitGroup?.length > 0) {
                    searchFiltersArray.push(["custrecord_dsc_suf_storage_unit_group", "anyof", storageUnitGroup], "AND");
                }

                if (locationFloor?.length > 0) {
                    searchFiltersArray.push(["custrecord_dsc_suf_location_floor", "anyof", locationFloor], "AND");
                }

                if (location?.length > 0) {
                    searchFiltersArray.push(["custrecord_dsc_suf_location", "anyof", location], "AND");
                }
                let storageUnitSearch = search.create({
                    type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                    filters: [
                        ...searchFiltersArray,
                        ["isinactive", "is", "F"],
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custrecord_dsc_suf_storage_unit_group" }),
                        search.createColumn({ name: "custrecord_dsc_suf_location" }),
                        search.createColumn({ name: "custrecord_dsc_suf_location_floor" })
                    ]

                });
                let searchResults = utilsLib.getAllSearchResults(storageUnitSearch);
                searchResults.forEach(unit => {
                    let unitId = unit.getValue({ name: 'internalid' });
                    if (unitId && !storageUnitsDataArray.includes(unitId)) storageUnitsDataArray.push(unitId);
                });
                log.debug('storageUnitsDataArray',storageUnitsDataArray)
                return storageUnitsDataArray;
            } catch(error) {
                log.error("ERROR IN"+logTitle, error);
            }
        }
        return { beforeSubmit, afterSubmit }

    });


