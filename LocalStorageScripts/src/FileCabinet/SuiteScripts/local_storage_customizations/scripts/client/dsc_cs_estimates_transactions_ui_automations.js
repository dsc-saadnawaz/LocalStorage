/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_constants.js'],

    function (record, search, n_error, constantsLib) {
        var allOccupiedStorageUnitsArr = []
        var STORAGE_UNITS_MAPPING = {}

        function pageInit(context) {
            const title = "pageInit ::"
            try {
                allOccupiedStorageUnitsArr = getAllOccupiedStorageUnit()
                STORAGE_UNITS_MAPPING = getStorageUnitsMapping();
                console.log(` ${title} + STORAGE_UNITS_MAPPING : `, STORAGE_UNITS_MAPPING)
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }


        function fieldChanged(context) {
            const title = "fieldChanged ::"
            try {
                const currentRecObj = context.currentRecord;
                const sublistNow = context.sublistId;
                const fieldNow = context.fieldId;

                if (sublistNow == "item" && fieldNow == "custcol_dsc_storage_unit") {
                    const storageUnitId = currentRecObj.getCurrentSublistValue({
                        sublistId: sublistNow,
                        fieldId: fieldNow
                    });
                    console.log(` ${title} + storageUnitId : `, storageUnitId)
                    if (storageUnitId && STORAGE_UNITS_MAPPING?.[storageUnitId]) {
                        const storageUnitPrice = STORAGE_UNITS_MAPPING?.[storageUnitId]?.price ? STORAGE_UNITS_MAPPING[storageUnitId].price : 0;
                        if (storageUnitPrice) {
                            currentRecObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: "-1" });
                            currentRecObj.setCurrentSublistValue({
                                sublistId: sublistNow,
                                fieldId: "rate",
                                value: storageUnitPrice
                            });
                        }
                    }
                }
                toggleLineColumnsDisplayType(currentRecObj);
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
                console.error("ERROR IN" + title, error);
            }
        }

        function validateField(context) {
            const title = "validateField ::"
            try {
                const currentRecord = context.currentRecord;
                const sublistName = context.sublistId
                const sublistFieldId = context.fieldId;
                if (sublistName == 'item') {
                    if (sublistFieldId == 'custcol_dsc_storage_unit') {
                        const selectedStorageUnitId = currentRecord.getCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: sublistFieldId
                        });
                        const storageUnitExists = allOccupiedStorageUnitsArr.some(unit => unit.storageUnitId == selectedStorageUnitId);
                        if (storageUnitExists) {
                            alert('The selected storage unit is occupied. Please choose another.');
                            return false;
                        }
                        return true
                    }
                }
                return true

            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        function lineInit(context) {
            const title = "lineInit ::"
            try {
                const currentRecObj = context.currentRecord;
                toggleLineColumnsDisplayType(currentRecObj);
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
                console.error("ERROR IN" + title, error);
            }
        }

        function postSourcing(context){
            const title = "postSourcing ::"
            try {
                const currentRecObj = context.currentRecord;
                toggleLineColumnsDisplayType(currentRecObj);
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
                console.error("ERROR IN" + title, error);
            }
        }

        const getAllOccupiedStorageUnit = () => {
            const title = "getAllOccupiedStorageUnit ::";
            try {
                let occupiedStorageUnits = [];
                const occupiedStorageUnitSearch = search.create({
                    type: "customrecord_dsc_storage_unit",
                    filters: [
                        ["custrecord_dsc_suf_availability_status", "anyof", constantsLib.FIELD_VALUES.AVAILABILITY_STATUS_OCCUPIED]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "name", label: "Name" })
                    ]
                });

                let results = getAllSearchResults(occupiedStorageUnitSearch);
                results.forEach((storageUnitDetails) => {
                    let storageUnitId = storageUnitDetails.getValue({ name: 'internalid' });
                    let storageUnitName = storageUnitDetails.getValue({ name: 'name' });
                    occupiedStorageUnits.push({
                        storageUnitId,
                        storageUnitName
                    });
                });
                return occupiedStorageUnits;

            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
                return [];
            }
        };

        const getAllSearchResults = searchObj => {
            var title = 'getAllSearchResults() ';
            try {
                var resultList = [];
                var startPos = 0;
                var endPos = 1000;

                var searchResult = searchObj.run();
                while (true) {
                    var currList = searchResult.getRange(startPos, endPos);

                    if (currList == null || currList.length <= 0)
                        break;
                    if (resultList == null) {
                        resultList = currList;
                    } else {
                        resultList = resultList.concat(currList);
                    }
                    if (currList.length < 1000) {
                        break;
                    }
                    startPos += 1000;
                    endPos += 1000;
                }

                return resultList;
            } catch (error) {
                log.error({
                    title: "ERROR IN" + title,
                    details: error
                });
                throw n_error.create({
                    name: 'DSC_CUSTOMIZATION_ERROR',
                    message: error.message
                });
            }
        }

        const getStorageUnitsMapping = transactionId => {
            const title = " getStorageUnitsMapping() ";
            try {
                const mapObj = {};
                const storageUnitSearchObj = search.create({
                    type: "customrecord_dsc_storage_unit",
                    columns: [
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_unit_price"
                        })
                    ],
                    filters: [
                        search.createFilter({
                            name: "isinactive",
                            operator: "is",
                            values: "F"
                        })
                    ]
                });
                const searchResults = getAllSearchResults(storageUnitSearchObj);
                //log.debug(title+"searchResults", searchResults);
                for (let i = 0; i < searchResults.length; i++) {
                    const storageUnitId = searchResults[i].id;
                    if (storageUnitId) {
                        if (!mapObj[storageUnitId]) {
                            let storageUnitPrice = searchResults[i].getValue({
                                name: "custrecord_dsc_suf_storage_unit_price"
                            });
                            storageUnitPrice = storageUnitPrice ? parseFloat(storageUnitPrice) : 0;
                            mapObj[storageUnitId] = {
                                price: storageUnitPrice
                            }
                        }
                    }
                }
                return mapObj;
            } catch (error) {
                log.error("ERROR IN" + title, error);
                console.error("ERROR IN" + title, error);
            }
        }


        const toggleLineColumnsDisplayType = currentRecObj => {
            const title = " toggleLineColumnsDisplayType() ";
            try {
                const itemId = currentRecObj.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item"
                });
                const itemSublistObj = currentRecObj.getSublist({
                    sublistId: "item"
                });
                if (itemId == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                    //Disabled Columns against Storage Unit Items
                    for (let fieldObj of constantsLib.STORAGE_UNIT_ITEM_DISABLED_COLUMNS) {
                        itemSublistObj.getColumn(fieldObj).isDisabled = true;
                    }
                    //Enable Columns against Non-Storage Unit Items
                    for (let fieldObj of constantsLib.NON_STORAGE_UNIT_ITEM_DISABLED_COLUMNS) {
                        itemSublistObj.getColumn(fieldObj).isDisabled = false;
                    }
                } else { //Non-Storage Unit Item
                    //Enable Columns against Storage Unit Items
                    for (let fieldObj of constantsLib.STORAGE_UNIT_ITEM_DISABLED_COLUMNS) {
                        itemSublistObj.getColumn(fieldObj).isDisabled = false;
                    }
                    //Disable Columns against Non-Storage Unit Items
                    for (let fieldObj of constantsLib.NON_STORAGE_UNIT_ITEM_DISABLED_COLUMNS) {
                        itemSublistObj.getColumn(fieldObj).isDisabled = true;
                    }
                }
            } catch (error) {
                log.error("ERROR IN" + title, error)
            }
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            validateField: validateField,
            lineInit: lineInit,
            postSourcing:postSourcing
        };

    });
