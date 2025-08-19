/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
let STORAGE_UNITS_MAPPING = {}
let CONTEXT_TYPE;
let contractType;
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_constants.js', 'N/ui/message'],
    (record, search, n_error, constantsLib, message) => {
        var salesOrderDetails;
        const pageInit = context => {
            const logTitle = " pageInit() ";
            try {
                CONTEXT_TYPE = context.mode;
                STORAGE_UNITS_MAPPING = getStorageUnitsMapping();
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




                //UAT-REWORK

                let salesOrderId;
                if (fieldNow == "custbody_dsc_contract_line") {  //sublistNow == 'item'
                    let contractNumber = currentRecObj.getValue({ fieldId: 'custbody_dsc_contract_line' })
                    if (contractNumber) {
                        const contractFields = search.lookupFields({
                            type: 'customrecord_dsc_contract_line',
                            id: contractNumber,
                            columns: ['custrecord_dsc_clf_parent_contract', 'custrecord_dsc_clf_contract_type']
                        })
                        let parentContractId = contractFields.custrecord_dsc_clf_parent_contract?.[0].value
                        contractType = contractFields.custrecord_dsc_clf_contract_type?.[0].value
                        if (contractType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL) {
                            console.log("contractType", contractType)
                            salesOrderId = getDetailsFromParentContract(parentContractId)
                            salesOrderDetails = getDetailsFromSalesOrder(salesOrderId);
                            // console.log("Fetched sales order details:", salesOrderDetails);
                        }
                    }
                }

                if (sublistNow == 'item' && fieldNow == 'item') {
                    const itemId = currentRecObj.getCurrentSublistValue({
                        sublistId: sublistNow,
                        fieldId: fieldNow
                    });
                    // console.log("itemID ::", itemId)  //6
                    if (itemId == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID && contractType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL) {
                        if (salesOrderDetails && salesOrderDetails.length > 0) {
                            updateItemSublistWithSalesOrderDetails(currentRecObj, salesOrderDetails);  // Use the stored salesOrderDetails

                        } else {
                            console.log("No sales order details found. Ensure that the standard contract line has been selected.");
                        }
                    }


                    ///// set quantity
                    toggleLineColumnsDisplayType(currentRecObj);
                    // const itemId = currentRecObj.getCurrentSublistValue({
                    //     sublistId: "item",
                    //     fieldId: "item"
                    // });
                    if (itemId == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                        let contractLine = currentRecObj.getValue('custbody_dsc_contract_line')
                        if (contractLine) {
                            let searchLookUpObj = search.lookupFields({
                                type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                                id: parseInt(contractLine),
                                columns: ['custrecord_dsc_clf_duration', 'custrecord_dsc_clf_start_date', 'custrecord_dsc_clf_payment_mode']
                            });
                            let contractLineDuration = searchLookUpObj?.custrecord_dsc_clf_duration[0]?.value;
                            let contractLineDurationMonth = contractLineDuration ? constantsLib.DURATION_VALUES[contractLineDuration] : "";
                            if (contractLineDurationMonth) {
                                currentRecObj.setCurrentSublistValue({
                                    sublistId: sublistNow,
                                    fieldId: "quantity",
                                    value: contractLineDurationMonth
                                })
                            }

                        }

                    }
                }

                //

                if (sublistNow == "item" && fieldNow == "custcol_dsc_storage_unit") {
                    const storageUnitId = currentRecObj.getCurrentSublistValue({
                        sublistId: sublistNow,
                        fieldId: fieldNow
                    });
                    const storageUnitDataObj = storageUnitId ? STORAGE_UNITS_MAPPING?.[storageUnitId] : undefined;
                    if (storageUnitDataObj?.storageGroupAreaSqft) {
                        currentRecObj.setCurrentSublistValue({
                            sublistId: sublistNow,
                            fieldId: "custcol_dsc_su_area_sqft",
                            value: storageUnitDataObj?.storageGroupAreaSqft,
                            ignoreFieldChange: true
                        });
                    }
                }

                if (sublistNow == "item" && fieldNow == "custcol_dsc_storage_unit" && contractType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD) {
                    console.log('contract type isssss standard' )
                    const storageUnitId = currentRecObj.getCurrentSublistValue({
                        sublistId: sublistNow,
                        fieldId: fieldNow
                    });
                    // console.log('custcol_dsc_storage_unit change',storageUnitId)
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
                        toggleLineColumnsDisplayType(currentRecObj);
                    }
                }

                if (sublistNow == "item" && fieldNow == "custcol_dsc_storage_unit" && contractType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL && salesOrderDetails.length<1) {
                    console.log('contract type isssss renewal' )
                    const storageUnitId = currentRecObj.getCurrentSublistValue({
                        sublistId: sublistNow,
                        fieldId: fieldNow
                    });
                    // console.log('custcol_dsc_storage_unit change',storageUnitId)
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
                        toggleLineColumnsDisplayType(currentRecObj);
                    }
                }

                // if (sublistNow == "item" && fieldNow == "item") {
                //     console.log("salesOrderDetails :333 ".salesOrderDetails)

                // }

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
                const sublistNow = context.sublistId;
                const fieldNow = context.fieldId;

                toggleLineColumnsDisplayType(currentRecObj);

                // const storageUnitId = currentRecObj.getCurrentSublistValue({
                //     sublistId: 'item',
                //     fieldId: 'custcol_dsc_storage_unit'
                // });
                // // console.log('custcol_dsc_storage_unit change',storageUnitId)
                // if (storageUnitId && STORAGE_UNITS_MAPPING?.[storageUnitId]) {
                //     const storageUnitPrice = STORAGE_UNITS_MAPPING?.[storageUnitId]?.price ? STORAGE_UNITS_MAPPING[storageUnitId].price : 0;
                //     if (storageUnitPrice) {
                //         currentRecObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: "-1" });
                //         currentRecObj.setCurrentSublistValue({
                //             sublistId: 'item',
                //             fieldId: "rate",
                //             value: storageUnitPrice
                //         });
                //     }
                // }

                const storageUnitId = currentRecObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_dsc_storage_unit'
                });

                if (contractType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL) {
                    console.log('post sourcing is running and contract type is renewal')
                    if (storageUnitId && STORAGE_UNITS_MAPPING?.[storageUnitId]) {
                        const storageUnitPrice = STORAGE_UNITS_MAPPING?.[storageUnitId]?.price ? STORAGE_UNITS_MAPPING[storageUnitId].price : 0;
                        if (storageUnitPrice) {
                            // currentRecObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: "-1" });
                            currentRecObj.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: "rate",
                                value: storageUnitPrice
                            });
                        }
                    }
                }


            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                console.error("ERROR IN" + logTitle, error);
            }
        }

        const getStorageUnitsMapping = transactionId => {
            const logTitle = " getStorageUnitsMapping() ";
            try {
                const mapObj = {};
                const storageUnitSearchObj = search.create({
                    type: "customrecord_dsc_storage_unit",
                    columns: [
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_unit_price"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_unit_group"
                        }),
                        search.createColumn({
                            name: "name",
                            join: "custrecord_dsc_suf_storage_unit_group"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_area",
                            join: "custrecord_dsc_suf_storage_unit_group"
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
                //log.debug(logTitle+"searchResults", searchResults);
                for (let i = 0; i < searchResults.length; i++) {
                    const storageUnitId = searchResults[i].id;
                    if (storageUnitId) {
                        if (!mapObj[storageUnitId]) {
                            let storageUnitPrice = searchResults[i].getValue({
                                name: "custrecord_dsc_suf_storage_unit_price"
                            });
                            storageUnitPrice = storageUnitPrice ? parseFloat(storageUnitPrice) : 0;

                            const storageGroupId = searchResults[i].getValue({
                                name: "custrecord_dsc_suf_storage_unit_group"
                            });
                            const storageGroupName = searchResults[i].getValue({
                                name: "name",
                                join: "custrecord_dsc_suf_storage_unit_group"
                            });                      
                            let storageGroupAreaSqft = searchResults[i].getValue({
                                name: "custrecord_dsc_area",
                                join: "custrecord_dsc_suf_storage_unit_group"
                            });
                            storageGroupAreaSqft = storageGroupAreaSqft ? parseFloat(storageGroupAreaSqft) : 0;
                        
                            let isSummerDiscountApplicable = constantsLib?.SUMMER_DISCOUNT_APPLICABLE_STORAGE_GROUPS?.includes(storageGroupName) ? true : false;

                            mapObj[storageUnitId] = {
                                storageUnitId,
                                price: storageUnitPrice,
                                storageGroupId,
                                storageGroupName,
                                storageGroupAreaSqft,
                                isSummerDiscountApplicable
                            }
                        }
                    }
                }
                return mapObj;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                console.error("ERROR IN" + logTitle, error);
            }
        }

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


        const saveRecord = (context) => {
            const title = "saveRecord ::"
            try {
                let salesRecordObj = context.currentRecord;
                let lines = salesRecordObj.getLineCount({
                    sublistId: 'item'
                })
                let storageUnitsArr = []
                for (let i = 0; i < lines; i++) {
                    let item = salesRecordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    })

                    let storageUnitLine = salesRecordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_dsc_storage_unit',
                        line: i
                    })
                    if(storageUnitLine && !storageUnitsArr.includes(storageUnitLine))
                    {
                        storageUnitsArr.push(storageUnitLine)
                    }
                    let itemText = salesRecordObj.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    })

                    if (item == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                        let storageUnit = salesRecordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_dsc_storage_unit_display',
                            line: i
                        })

                        if (!storageUnit) {
                            const errorMessage = 'Storage unit is required for item ' + itemText;
                            // Display error message using NetSuite message API
                            let msg = message.create({
                                title: 'Error : Missing Storage Unit for Unit ',
                                message: errorMessage,
                                type: message.Type.ERROR
                            });
                            msg.show();

                            return false

                        }
                    }
                }
                if(storageUnitsArr.length > 1)
                {
                    let msg = message.create({
                        title: 'Error : More than one Storage Unit',
                        message: 'Please create Sales Order for only single Storage Unit ',
                        type: message.Type.ERROR
                    });
                    msg.show();

                    return false
                }     
                return true
            } catch (error) {
                console.error("ERROR IN"+title, error);
                log.error({
                    title: title + 'error',
                    details: error
                })
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
                if (
                    itemId
                    &&
                    [
                        constantsLib.SUMMER_DISCOUNT_ITEM_ID,
                        constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID
                    ].includes(itemId)
                ) {
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
                log.error("ERROR IN" + logTitle, error)
            }
        }

        const getDetailsFromParentContract = parentContractId => {
            const title = "getDetailsFromParentContract ::"
            try {
                let parentContractDetailsObj = {}
                let salesOrderId
                let parentContractDetailsSearch = search.create({
                    type: 'customrecord_dsc_contract',
                    filters: [
                        ["internalid", "anyof", parentContractId],
                        "AND",
                        ["custrecord_dsc_clf_parent_contract.custrecord_dsc_clf_contract_type", "anyof", constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD]
                    ],
                    columns:
                        [
                            search.createColumn({ name: "name", label: "ID" }),
                            search.createColumn({ name: "custrecord_dsc_cf_storage_unit", label: "Storage Unit" }),
                            search.createColumn({
                                name: "custrecord_dsc_clf_contract_type",
                                join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                                label: "Contract Type"
                            }),
                            search.createColumn({
                                name: "custrecord_dsc_clf_so_reference",
                                join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                                label: "Sales Order Reference"
                            })
                        ]
                })
                let results = getAllSearchResults(parentContractDetailsSearch);
                results.forEach((contractDetails) => {
                    let contractId = contractDetails.getValue({ name: 'name' })
                    let contractType = contractDetails.getValue({ name: "custrecord_dsc_clf_contract_type", join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT" })
                    salesOrderId = contractDetails.getValue({ name: "custrecord_dsc_clf_so_reference", join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT" })
                    if (!parentContractDetailsObj[contractId]) {
                        parentContractDetailsObj[contractId] = {
                            contractType,
                            salesOrderId
                        }
                    }
                    //console.log('parentContractDetailsObj  ::', parentContractDetailsObj)
                    //console.log('salesOrderId  ::', salesOrderId)


                })
                return salesOrderId
            } catch (error) {
                log.error("ERROR IN" + title, error)

            }
        }

        const getDetailsFromSalesOrder = (salesOrderId) => {
            const title = "getDetailsFromSalesOrder ::"
            // console.log("runnning getDetailsFromSalesOrder")
            try {
                let salesOrderDetails = []
                if(salesOrderId)
                {
                const salesOrderRecord = record.load({
                    type: 'salesorder',
                    id: salesOrderId,
                });
                let lineCount = salesOrderRecord.getLineCount({ sublistId: 'item' })
                for (let i = 0; i < lineCount; i++) {
                    let item = salesOrderRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    })

                    let location = salesOrderRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        line: i
                    })

                    let floor = salesOrderRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_dsc_location_floor',
                        line: i
                    })


                    let storageUnit = salesOrderRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_dsc_storage_unit',
                        line: i
                    })
                    if (storageUnit && storageUnit != "" && item == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                        salesOrderDetails.push({
                            item,
                            location,
                            floor,
                            storageUnit
                        })
                    }
                }
            }
                return salesOrderDetails
            } catch (error) {
                console.error("ERROR IN" + title, error)
                log.error("ERROR IN" + title, error)
            }
        }

        const updateItemSublistWithSalesOrderDetails = (currentRecObj, salesOrderDetails) => {
            const title = "updateItemSublistWithSalesOrderDetails ::"
            // console.log(title + " RUNNING");
            // console.log(title + " salesOrderDetails", salesOrderDetails);
            try {
                //setting salesordesublist:
                let details = salesOrderDetails[0];
                // salesOrderDetails.forEach((details, index) => {
                // currentRecObj.selectLine({ sublistId: 'item', line: index });
                currentRecObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: details?.location, fireSlavingSync: true });
                currentRecObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_dsc_location_floor', value: details?.floor, fireSlavingSync: true });
                currentRecObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_dsc_storage_unit', value: details?.storageUnit, fireSlavingSync: true });

                // currentRecObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: "-1" })






                //currentRecObj.commitLine({ sublistId: sublistNow })
                // })
                console.log(`${title} Successfully updated the sublist.`);


            } catch (error) {
                console.error("ERROR IN" + title, error)
                log.error("ERROR IN" + title, error)
            }
        }

        const validateLine = context => {
            const logTitle = " validateLine() ";
            console.log(logTitle, "START!");
            try {
                const currentRecObj = context.currentRecord;
                const currentLineItemType = currentRecObj.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "itemtype"
                });
                const currentLineItemId = currentRecObj.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item"
                });
                const currentLinePriceLevel = currentRecObj.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "price"
                });

                if (currentLineItemId == constantsLib.SUMMER_DISCOUNT_ITEM_ID) { //Validating Summer Promo Discount
                    let associatedStorageUnitDataObj = getAssociatedStorageUnitDataObj(currentRecObj); 
                    if (associatedStorageUnitDataObj?.storageUnitId) {
                        associatedStorageUnitDataObj = {
                            ...associatedStorageUnitDataObj,
                            ...STORAGE_UNITS_MAPPING?.[associatedStorageUnitDataObj?.storageUnitId]
                        };
                        console.log(logTitle + "associatedStorageUnitDataObj : AFTER", associatedStorageUnitDataObj);
                        if (associatedStorageUnitDataObj.isSummerDiscountApplicable) {
                            if (currentLinePriceLevel != constantsLib.PRICE_LEVEL_CUSTOM) {
                                // if (associatedStorageUnitDataObj?.taxCodeId) {
                                //     currentRecObj.setCurrentSublistValue({
                                //         sublistId: "item",
                                //         fieldId: "taxcode",
                                //         value: associatedStorageUnitDataObj?.taxCodeId
                                //     });
                                // }
                                // if (associatedStorageUnitDataObj?.taxRate) {
                                //     currentRecObj.setCurrentSublistValue({
                                //         sublistId: "item",
                                //         fieldId: "taxrate1",
                                //         value: associatedStorageUnitDataObj?.taxRate
                                //     });
                                // }
                                let discountItemRate = currentRecObj.getCurrentSublistValue({
                                    sublistId: "item",
                                    fieldId: "rate"
                                });
                                discountItemRate = discountItemRate ? parseFloat(discountItemRate/100) : 0;
                                const discountItemAmount = (associatedStorageUnitDataObj?.storageUnitRate * discountItemRate);
                                currentRecObj.setCurrentSublistValue({
                                    sublistId: "item",
                                    fieldId: "price",
                                    value: constantsLib.PRICE_LEVEL_CUSTOM //CUSTOM
                                });
                                currentRecObj.setCurrentSublistValue({
                                    sublistId: "item",
                                    fieldId: "amount",
                                    value: discountItemAmount
                                });
                            }
                        } else {
                            alert("DISCOUNT NOT APPLICABLE FOR THIS STORAGE UNIT!\nTo apply this discount, make sure the associated Storage Unit belongs to any one of the following groups: " + constantsLib.SUMMER_DISCOUNT_APPLICABLE_STORAGE_GROUPS);
                            return false;
                        }
                    } else {
                        alert("Found no associated Storage Unit against this discount item!");
                        return false;
                    }
                }
                else if(currentLineItemId == constantsLib.ONE_MONTH_DISCOUNT_ITEM)
                {
                     let associatedStorageUnitDataObj = getAssociatedStorageUnitDataObj(currentRecObj);
                     console.log(logTitle + "associatedStorageUnitDataObj : BEFORE", associatedStorageUnitDataObj);
                     if (associatedStorageUnitDataObj?.storageUnitId) {
                        if(Number(associatedStorageUnitDataObj?.storageUnitDurationMonth) >= 6 && Number(associatedStorageUnitDataObj?.storageUnitDurationMonth) < 12)
                        {
                            let discountCalculatedRate = (associatedStorageUnitDataObj?.storageUnitRate) * -1
                            currentRecObj.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "price",
                                value: constantsLib.PRICE_LEVEL_CUSTOM //CUSTOM
                            });
                            currentRecObj.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "rate",
                                value: discountCalculatedRate
                            });
                            currentRecObj.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "amount",
                                value: discountCalculatedRate
                            });
                        }
                     }
                }
                else if(currentLineItemId == constantsLib.TWO_MONTH_DISCOUNT_ITEM)
                {
                     let associatedStorageUnitDataObj = getAssociatedStorageUnitDataObj(currentRecObj);
                     console.log(logTitle + "associatedStorageUnitDataObj : BEFORE", associatedStorageUnitDataObj);
                     if (associatedStorageUnitDataObj?.storageUnitId) {
                        if(Number(associatedStorageUnitDataObj?.storageUnitDurationMonth) >= 12)
                        {
                            let discountCalculatedRate = Number(associatedStorageUnitDataObj?.storageUnitRate) * -2;
                            currentRecObj.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "price",
                                value: constantsLib.PRICE_LEVEL_CUSTOM //CUSTOM
                            });
                            currentRecObj.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "rate",
                                value: discountCalculatedRate
                            });
                            currentRecObj.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "amount",
                                value: discountCalculatedRate
                            });
                        }
                     }
                }
            } catch (error) {
                console.error("ERROR IN" + logTitle, error);
                log.error("ERROR IN" + logTitle, error);
                alert("ERROR IN" + logTitle, error);
                console.log(logTitle, "END!");
                return false;
            }
            console.log(logTitle, "END!");
            return true;
        }

        const getAssociatedStorageUnitDataObj = currentRecObj => {
            const logTitle = " getAssociatedStorageUnitDataObj() ";
            try {
                let associatedStorageUnitDataObj;

                const lineItemCount = currentRecObj.getLineCount({
                    sublistId: 'item'
                });
                const currentLineIndex = currentRecObj.getCurrentSublistIndex({
                    sublistId: 'item'
                });
                if (currentLineIndex > 0) {
                    for (let lineIndex = (currentLineIndex - 1); lineIndex >= 0; lineIndex--) {
                        var dataObj = {};
                        dataObj.itemId = currentRecObj.getSublistValue({
                            sublistId: "item",
                            fieldId: "item",
                            line: lineIndex
                        });
                        if (dataObj.itemId == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                            dataObj.storageUnitId = currentRecObj.getSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_dsc_storage_unit",
                                line: lineIndex
                            });
                            if (dataObj.storageUnitId) {
                                dataObj.taxCodeId = currentRecObj.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "taxcode",
                                    line: lineIndex
                                });
                                dataObj.taxRate = currentRecObj.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "taxrate1",
                                    line: lineIndex
                                });
                                dataObj.taxRate = dataObj.taxRate ? parseFloat(dataObj.taxRate) : 0;
                                dataObj.storageUnitDurationMonth = currentRecObj.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "quantity",
                                    line: lineIndex
                                });
                                dataObj.storageUnitDurationMonth = dataObj.storageUnitDurationMonth ? parseFloat(dataObj.storageUnitDurationMonth) : 0;
                                
                                dataObj.storageUnitAmount = currentRecObj.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "amount",
                                    line: lineIndex
                                });
                                dataObj.storageUnitAmount = dataObj.storageUnitAmount ? parseFloat(dataObj.storageUnitAmount) : 0;

                                dataObj.storageUnitRate = dataObj.storageUnitDurationMonth != 0 ? dataObj.storageUnitAmount / dataObj.storageUnitDurationMonth : dataObj.storageUnitAmount;

                                associatedStorageUnitDataObj = dataObj;
                                break;
                            }
                        }
                    }
                }
                return associatedStorageUnitDataObj;
            } catch (error) {
                console.error("ERROR IN" + logTitle, error);
                log.error("ERROR IN" + logTitle, error);
                
                throw error;
            }
        }
        
        return {
            pageInit,
            fieldChanged,
            saveRecord,
            lineInit,
            postSourcing,
            validateLine
        }
    }
)