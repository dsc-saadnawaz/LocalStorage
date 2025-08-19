/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_constants.js'],

    function (record, search, error, constantsLib) {

        var allOccupiedStorageUnitsArr = []
        function pageInit(context) {
            const title = "pageInit ::"
            try {
                allOccupiedStorageUnitsArr = getAllOccupiedStorageUnit()
            } catch (error) {
                console.error(error)
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        function validateField(context) {
            const currentRecord = context.currentRecord;
            const sublistName = context.sublistId
            const sublistFieldId = context.fieldId;
            let contractNo = currentRecord.getValue({ fieldId: 'custbody_dsc_contract_line' })
            if (contractNo) {
                // console.log("contractNo : ", contractNo)
                const contractRecordFields = search.lookupFields({
                    type: 'customrecord_dsc_contract_line',
                    id: contractNo,
                    columns: ['custrecord_dsc_clf_contract_type']
                });
                // console.log("contractRecordFields  ::" , contractRecordFields)
                let contractType = contractRecordFields?.custrecord_dsc_clf_contract_type[0].value;
                // console.log("contractType : ", contractType)

                if (contractType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD) {
                    if (sublistName === 'item') {
                        // console.log("Inside item sublist: ", sublistName);
        
                        if (sublistFieldId == 'custcol_dsc_storage_unit') {
                            // console.log("Inside field: ", sublistFieldId);
        
                            const selectedStorageUnitId = currentRecord.getCurrentSublistValue({
                                sublistId: sublistName,
                                fieldId: sublistFieldId
                            });
        
                            const storageUnitExists = allOccupiedStorageUnitsArr.some(unit => unit.storageUnitId === selectedStorageUnitId);
                            if (storageUnitExists) {
                                alert('The selected storage unit is occupied. Please choose another.');
                                return false;
                            }
                        }
                    }
                }

                
            }
            //without any contract set up
            // if (sublistName === 'item') {
            //     console.log("Inside item sublist: ", sublistName);

            //     if (sublistFieldId == 'custcol_dsc_storage_unit') {
            //         console.log("Inside field: ", sublistFieldId);

            //         const selectedStorageUnitId = currentRecord.getCurrentSublistValue({
            //             sublistId: sublistName,
            //             fieldId: sublistFieldId
            //         });

            //         const storageUnitExists = allOccupiedStorageUnitsArr.some(unit => unit.storageUnitId === selectedStorageUnitId);
            //         if (storageUnitExists) {
            //             alert('The selected storage unit is occupied. Please choose another.');
            //             return false;
            //         }
            //     }
            // }

            return true;
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
            var logTitle = 'getAllSearchResults() ';
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
                    title: "ERROR IN" + logTitle,
                    details: error
                });
                throw n_error.create({
                    name: 'DSC_CUSTOMIZATION_ERROR',
                    message: error.message
                });
            }
        }


        return {
            pageInit: pageInit,
            validateField: validateField

        };

    });
