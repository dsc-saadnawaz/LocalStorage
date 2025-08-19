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
            log.debug(logTitle + "context.type", context.type);
            if (
                context.type == context.UserEventType.CREATE 
                || 
                context.type == context.UserEventType.EDIT
                ||
                context.type == context.UserEventType.COPY
            ) {
                const recObj = context.newRecord;
                const storageUnitId = recObj.id;
                const storageUnitName = recObj.getValue("name");
                const storageUnitLocationId = recObj.getValue("custrecord_dsc_suf_location");
                const storageUnitFloorId = recObj.getValue("custrecord_dsc_suf_location_floor");
                if (storageUnitName && storageUnitLocationId && storageUnitFloorId) {
                    const unitAleardyExists = checkExistingStorageUnit(storageUnitId, storageUnitName, storageUnitLocationId, storageUnitFloorId);
                    log.debug(logTitle + "unitAleardyExists", unitAleardyExists);
                    if (unitAleardyExists) {
                        throw n_error.create({
                            name: 'DSC_DUPLICATE_NAME_ERROR',
                            message: 'Another storage unit with same name, '+storageUnitName+', on this floor already exists.',
                            notifyOff: false
                        });
                    }
                }
            }
        } catch (error) {
            log.error("ERROR IN"+logTitle, error);
            throw error.message;
        }
        log.debug(logTitle, "<--------------- UE Script - END --------------->");
     }

     const checkExistingStorageUnit = (storageUnitId, storageUnitName, storageUnitLocationId, storageUnitFloorId) => {
        const logTitle = " checkExistingStorageUnit() ";
         try {
            const storageUnitSearchObj = search.create({
                type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                filters: [
                    search.createFilter({
                        name: "custrecord_dsc_suf_location",
                        operator: "anyof",
                        values: [storageUnitLocationId]
                    }),
                    search.createFilter({
                        name: "custrecord_dsc_suf_location_floor",
                        operator: "anyof",
                        values: [storageUnitFloorId]
                    }),
                    search.createFilter({
                        name: "name",
                        operator: "is",
                        values: storageUnitName
                    })
                ]
            });
            if (storageUnitId) {
                storageUnitSearchObj.filters.push(
                    search.createFilter({
                        name: "internalid",
                        operator: "noneof",
                        values: [storageUnitId]
                    })
                )
            }       
            const searchResults = storageUnitSearchObj.run().getRange({
                start: 0,
                end: 1
            });
            log.debug(logTitle+"searchResults", searchResults);
            if (searchResults.length > 0) return true;
         } catch (error) {
            log.error("ERROR IN"+logTitle, error);
        }
     } 
     return {
        beforeSubmit
     }
 }  
);