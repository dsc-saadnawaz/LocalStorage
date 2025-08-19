/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(
    ['N/search', '../../lib/dsc_lib_constants.js'],
    (search, constantsLib) => {
        var STORAGE_UNITS_MAPPING = {}
        const pageInit = context => {
            const logTitle = " pageInit() ";
            try {
                console.log(logTitle + "constantsLib.SUMMER_DISCOUNT_APPLICABLE_STORAGE_UNIT_MAX_AREA", constantsLib.SUMMER_DISCOUNT_APPLICABLE_STORAGE_UNIT_MAX_AREA);
                STORAGE_UNITS_MAPPING = getStorageUnitsMapping();
                console.log(logTitle + "STORAGE_UNITS_MAPPING", STORAGE_UNITS_MAPPING);
            } catch (error) {
                log.error("ERROR IN"+logTitle, error);
            }
        }

        const getStorageUnitsMapping = () => {
            const logTitle = " getStorageUnitsMapping() ";
            try {
                const mapObj = {};
                let storageUnitSearchObj = search.create({
                    type: "customrecord_dsc_storage_unit",
                    columns: [
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_unit_group"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_area",
                            join: "custrecord_dsc_suf_storage_unit_group"
                        })
                    ]
                });
                const searchResults = getAllSearchResults(storageUnitSearchObj);
                for (let i=0; i < searchResults.length; i++) {
                    const resultObj = searchResults[i];
                    const storageUnitId = resultObj.id;
                    if (storageUnitId && !mapObj[storageUnitId]) {
                        const storageGroupId = resultObj.getValue({
                            name: "custrecord_dsc_suf_storage_unit_group"
                        });
                        let storageGroupAreaSqft = resultObj.getValue({
                            name: "custrecord_dsc_area",
                            join: "custrecord_dsc_suf_storage_unit_group"
                        });
                        storageGroupAreaSqft = storageGroupAreaSqft ? parseFloat(storageGroupAreaSqft) : 0;
                        mapObj[storageUnitId] = {
                            storageUnitId,
                            storageGroupId,
                            storageGroupAreaSqft
                        };
                    }
                }
                return mapObj;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }

        return {
            pageInit
        }
    }
);