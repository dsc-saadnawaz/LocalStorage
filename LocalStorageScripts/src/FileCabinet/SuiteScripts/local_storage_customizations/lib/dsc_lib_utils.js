/**
 * @NApiVersion 2.1
 */

define(['N/search', 'N/file', 'N/render', 'N/error', 'N/ui/serverWidget', 'N/url', './dsc_lib_constants.js'],
    (search, file, render, n_error, serverWidget, url, constantsLib) => {
        var totalNotAvailable = 0;
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

        const getFileId = (filePath) => {
            const logTitle = " getFileId() ";
            try {
                log.debug(logTitle + "filePath", filePath);
                var fileObj = file.load({
                    id: filePath
                });
                log.debug(logTitle + "fileObj.id", fileObj.id);
                return fileObj.id;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }

        const getFileObject = filePath => {
            const title = " getFileObject() ";
            try {
                var fileObj = file.load({
                    id: filePath
                });
                return fileObj;
            } catch (error) {
                log.error("ERROR IN" + title, error);
                throw error;
            }
        }

        const generatePdfXml = (inputDataObj, filePath) => {
            const logTitle = " generatePdfXml() ";
            try {

                let pdfXml;
                const fileObject = getFileObject(filePath);
                const xmlTemplateContents = fileObject?.getContents();
                if (xmlTemplateContents) {
                    var renderer = render.create();
                    renderer.templateContent = xmlTemplateContents;
                    renderer.addCustomDataSource({
                        format: render.DataSource.OBJECT,
                        alias: "inputData",
                        data: inputDataObj
                    });
                    pdfXml = renderer.renderAsString();
                }
                return pdfXml;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }

        const generateRecordName = (recObj, recordFieldsSequence, namePrefix, nameSuffix) => {
            const logTitle = " generateRecordName() ";
            try {
                let recordName = "";
                recordName += namePrefix;
                for (let fieldDataObj of recordFieldsSequence) {
                    const fieldValue = recObj[fieldDataObj.method](fieldDataObj.fieldId);
                    if (fieldValue) {
                        if (recordName && recordName != namePrefix) recordName += "-";
                        recordName += fieldValue;
                    }
                }
                recordName += nameSuffix;
                return recordName;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }

        const getRemainingDays = (dateOne, dateTwo) => {
            const logTitle = " getRemainingDays() ";
            try {
                if (dateOne instanceof Date && !isNaN(dateOne)) {
                    const difference = dateOne.getTime() - dateTwo.getTime();   //returns negative values. we can use abs.
                    const remainingDays = Math.floor(difference / (1000 * 60 * 60 * 24));
                    return remainingDays;
                }
                return null;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        };

        const createExpiredLinkSlForm = () => {
            const logTitle = " createLinkExpiredSlForm() ";
            try {
                const formObj = serverWidget.createForm({
                    title: 'Expired Link',
                    hideNavBar: true
                });
                const screenTextFldObj = formObj.addField({
                    id: 'custpage_dsc_elf_screen_text',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Screen Text',
                });
                screenTextFldObj.defaultValue = "<h2>Sorry, this link has expired. Please contact support team.</h2>";
                return formObj;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }

        const formatNsDateStringToObject = nsDateString => {
            const logTitle = " formatNsDateStringToObject() ";
            try {
                const nsDateContent = nsDateString.split("/");
                const nsDateDays = nsDateContent[0];
                const nsDateMonthIndex = nsDateContent[1] - 1;
                const nsDateYears = nsDateContent[2];
                let dateObj = new Date(nsDateYears, nsDateMonthIndex, nsDateDays);
                return dateObj;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }

        const getStorageUnitsMapping = () => {
            const logTitle = " getStorageUnitsMapping() ";
            try {
                const mapObj = {};
                let storageUnitSearchObj = search.create({
                    tyep: "customrecord_dsc_storage_unit",
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
        
        const getStorageUnitDetailsMapping = salesOrderIdsArray => {
            const title = " getStorageUnitDetailsMapping() ";
            try {
                let storageUnitDetailsMapObj = {};
                const salesOrderSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        ["internalid", "anyof", salesOrderIdsArray],
                        "AND",
                        ["mainline", "is", ['F']],
                        "AND",
                        ["taxline", "is", ['F']],
                        "AND",
                        ["cogs", "is", ['F']],
                        "AND",
                        ["shipping", "is", ['F']]
                    ],
                    columns: [
                        search.createColumn({
                            name: "name",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_length",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_width",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_unit_price",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_location_floor",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_storage_unit_rpsf",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_area_square_feet",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_unit_area_open_space",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_type",
                            join: "CUSTCOL_DSC_STORAGE_UNIT",
                        })
                    ]
                });

                const searchResults = salesOrderSearch.run().getRange({
                    start: 0,
                    end: 1000
                });
                for (let i = 0; i < searchResults.length; i++) {
                    const salesOrderSearchResult = searchResults[i];
                    const storageUnitId = salesOrderSearchResult.getValue({
                        name: "internalid",
                        join: "CUSTCOL_DSC_STORAGE_UNIT"
                    });
                    if (storageUnitId) {
                        if (!storageUnitDetailsMapObj[storageUnitId]) {
                            let storageUnitDataObj = {};
                            storageUnitDataObj.storageUnitId = storageUnitId;
                            storageUnitDataObj.storageUnitType = salesOrderSearchResult.getValue({
                                name: "custrecord_dsc_suf_storage_type",
                                join: "CUSTCOL_DSC_STORAGE_UNIT"
                            });
                            storageUnitDataObj.storageUnitName = salesOrderSearchResult.getValue({
                                name: "name",
                                join: "CUSTCOL_DSC_STORAGE_UNIT"
                            });

                            storageUnitDataObj.storageUnitLength = salesOrderSearchResult.getValue({
                                name: "custrecord_dsc_suf_length",
                                join: "CUSTCOL_DSC_STORAGE_UNIT"
                            });
                            storageUnitDataObj.storageUnitLength = storageUnitDataObj.storageUnitLength ? parseFloat(storageUnitDataObj.storageUnitLength) : 0;
                            storageUnitDataObj.storageUnitWidth = salesOrderSearchResult.getValue({
                                name: "custrecord_dsc_suf_width",
                                join: "CUSTCOL_DSC_STORAGE_UNIT"
                            });
                            storageUnitDataObj.storageUnitWidth = storageUnitDataObj.storageUnitWidth ? parseFloat(storageUnitDataObj.storageUnitWidth) : 0;

                            storageUnitDataObj.storageUnitPrice = salesOrderSearchResult.getValue({
                                name: "custrecord_dsc_suf_storage_unit_price",
                                join: "CUSTCOL_DSC_STORAGE_UNIT"
                            });
                            storageUnitDataObj.storageUnitPrice = storageUnitDataObj.storageUnitPrice ? parseFloat(storageUnitDataObj.storageUnitPrice).toFixed(2) : 0;

                            storageUnitDataObj.storageUnitRatePerSqftNew = salesOrderSearchResult.getValue({
                                name: "custrecord_dsc_storage_unit_rpsf",
                                join: "CUSTCOL_DSC_STORAGE_UNIT"
                            });
                            storageUnitDataObj.storageUnitRatePerSqftNew = storageUnitDataObj.storageUnitRatePerSqftNew ? parseFloat(storageUnitDataObj.storageUnitRatePerSqftNew).toFixed(2) : 0;

                            storageUnitDataObj.storageUnitAreatNew = salesOrderSearchResult.getValue({
                                name: "custrecord_dsc_area_square_feet",
                                join: "CUSTCOL_DSC_STORAGE_UNIT"
                            });
                            storageUnitDataObj.storageUnitAreatOpenSpace = salesOrderSearchResult.getValue({
                                name: "custrecord_dsc_unit_area_open_space",
                                join: "CUSTCOL_DSC_STORAGE_UNIT"
                            }) || 0;
                            
                            storageUnitDataObj.storageUnitAreatNew = storageUnitDataObj.storageUnitAreatNew ? storageUnitDataObj.storageUnitAreatNew : 0;


                            storageUnitDataObj.storageUnitFloorName = salesOrderSearchResult.getText({
                                name: "custrecord_dsc_suf_location_floor",
                                join: "CUSTCOL_DSC_STORAGE_UNIT"
                            });
                            // storageUnitDataObj.storageUnitRatePerSqft = storageUnitDataObj.storageUnitPrice / (storageUnitDataObj.storageUnitLength * storageUnitDataObj.storageUnitWidth);
                            storageUnitDataObj.storageUnitRatePerSqft = storageUnitDataObj.storageUnitRatePerSqftNew;//parseFloat(storageUnitDataObj.storageUnitRatePerSqft).toFixed(2)
                            storageUnitDetailsMapObj[storageUnitId] = storageUnitDataObj;
                        }
                    }
                }
                return storageUnitDetailsMapObj;
            } catch (error) {
                log.error({ title: title + 'error', details: error })
            }
        }

        const getStorageUnitsAgainstFloor = () => {
            const logTitle = " getStorageUnitsAgainstFloor() ";
            try {

                let storeUnitsLocationsMapObj = {};
                const storageUnitsSearch = search.create({
                    type: 'customrecord_dsc_storage_unit',
                    filters: [
                        ["isinactive", "is", "F"],
                        'AND',
                        ["custrecord_dsc_suf_storage_type", "anyof", 1], //Storage Unit
                        'AND',
                        ["custrecord_dsc_suf_unit_on_mapp", "is", "T"]

                    ],
                    columns: [
                        search.createColumn({ name: "name" }),
                        search.createColumn({ name: "custrecord_dsc_suf_storage_type" }),
                        search.createColumn({ name: "custrecord_dsc_suf_length" }),
                        search.createColumn({ name: "custrecord_dsc_suf_width" }),
                        search.createColumn({ name: "custrecord_dsc_suf_height" }),
                        search.createColumn({ name: "custrecord_dsc_suf_location_floor" }),
                        search.createColumn({ name: "custrecord_dsc_suf_availability_status" }),
                        search.createColumn({ name: "custrecord_dsc_suf_out_of_order" }),
                        search.createColumn({ name: "custrecord_dsc_suf_storage_unit_price" }),
                        search.createColumn({ name: "custrecord_dsc_suf_location" }),
                        search.createColumn({ name: "custrecord_dsc_suf_x_coordinate" }),
                        search.createColumn({ name: "custrecord_dsc_suf_y_coordinate" }),
                        search.createColumn({ name: "custrecord_dsc_storage_unit_door_positio" }),
                        search.createColumn({ name: "custrecord_dsc_area_square_feet" }),
                        search.createColumn({ name: "custrecord_dsc_unit_area_open_space" }),

                    ]
                });
                const searchResults = getAllSearchResults(storageUnitsSearch);

                const storageUnitIdsArray = searchResults.map(result => result.id);
                const soStorageUnitMapObj = getSaleDetailAgainstStorageUnit(storageUnitIdsArray);
                // const storageUnitObj = getDetailOfStorageUnit(storageUnitIdsArray);
                // log.debug(logTitle + 'storageUnitObj', storageUnitObj)
                const storageUnitDetailObj = getDetailOfStorageUnit(storageUnitIdsArray);

                searchResults.forEach(result => {

                    const locationId = result.getValue({ name: 'custrecord_dsc_suf_location' });
                    const floorId = result.getValue({ name: 'custrecord_dsc_suf_location_floor' });
                    const outOfOrder = result.getValue({ name: 'custrecord_dsc_suf_out_of_order' })
                    const storageUnitAvailabilityStatus = result.getValue({ name: 'custrecord_dsc_suf_availability_status' });
                    const storageUnitAvailabilityText = result.getText({ name: 'custrecord_dsc_suf_availability_status' });

                    if (locationId) {
                        storeUnitsLocationsMapObj[locationId] ??= {
                            storeUnitsFloorMapObj: {},
                            floorDetailsMapObj: {}
                        };
                    }
                    storeUnitsLocationsMapObj[locationId].storeUnitsFloorMapObj[floorId] ??= [];

                    const storageUnitId = result.id;
                    const salesOrderDetails = soStorageUnitMapObj[storageUnitId] || [];
                    let storageUnitUrl;
                    if (storageUnitId) {
                        storageUnitUrl = url.resolveRecord({
                            recordType: 'customrecord_dsc_storage_unit',
                            recordId: storageUnitId,
                            isEditMode: false
                        })
                    }
                    const status = getStatus(storageUnitAvailabilityStatus, storageUnitAvailabilityText, outOfOrder, salesOrderDetails);

                    storeUnitsLocationsMapObj[locationId].storeUnitsFloorMapObj[floorId].push({
                        ...getStatus(storageUnitAvailabilityStatus, storageUnitAvailabilityText, outOfOrder, salesOrderDetails),
                        storageType: result.getText({ name: 'custrecord_dsc_suf_storage_type' }),
                        length: parseFloat(result.getValue({ name: 'custrecord_dsc_suf_length' })) || 0,
                        width: parseFloat(result.getValue({ name: 'custrecord_dsc_suf_width' })) || 0,
                        height: parseFloat(result.getValue({ name: 'custrecord_dsc_suf_height' })) || 0,
                        xCoordinate: parseFloat(result.getValue({ name: 'custrecord_dsc_suf_x_coordinate' })) || 0,
                        yCoordinate: parseFloat(result.getValue({ name: 'custrecord_dsc_suf_y_coordinate' })) || 0,
                        doorPosition: {
                            label: result.getText({ name: 'custrecord_dsc_storage_unit_door_positio' }),
                            value: result.getValue({ name: 'custrecord_dsc_storage_unit_door_positio' }) || 0,
                        },
                        outOforder: outOfOrder,
                        price: result.getValue({ name: 'custrecord_dsc_suf_storage_unit_price' }),
                        location: result.getText({ name: 'custrecord_dsc_suf_location' }),
                        areaInFeet: result.getValue({ name: 'custrecord_dsc_area_square_feet' }),
                        areaInFeetOpenSpace: result.getValue({ name: 'custrecord_dsc_unit_area_open_space' }),
                        label: {
                            label: result.getValue({ name: 'name' }),
                            value: storageUnitId
                        },
                        floor: {
                            label: result.getText({ name: 'custrecord_dsc_suf_location_floor' }),
                            value: floorId,
                        },
                        storageUnitUrl: storageUnitUrl,
                        salesOrder: salesOrderDetails
                    });

                    if (!storeUnitsLocationsMapObj[locationId].floorDetailsMapObj[floorId]) {
                        storeUnitsLocationsMapObj[locationId].floorDetailsMapObj[floorId] = {
                            floorName: result.getText({ name: 'custrecord_dsc_suf_location_floor' }),
                            totalUnits: 0,
                            availableUnits: 0,
                            occupiedUnits: 0,
                            availableWithinTwoWeeks: 0,
                            notAvailable: 0,
                            expired: 0
                        };
                    }

                    storeUnitsLocationsMapObj[locationId].floorDetailsMapObj[floorId].totalUnits++;
                    if (status.availabilityStatus.value == constantsLib.FIELD_VALUES.AVAILABILITY_STATUS_AVAILABLE) storeUnitsLocationsMapObj[locationId].floorDetailsMapObj[floorId].availableUnits++;
                    if (status.availabilityStatus.value == constantsLib.FIELD_VALUES.AVAILABILITY_STATUS_OCCUPIED) storeUnitsLocationsMapObj[locationId].floorDetailsMapObj[floorId].occupiedUnits++;
                    if (status.availabilityStatus.value == 'AVAILABLE_IN_TWO_WEEKS') storeUnitsLocationsMapObj[locationId].floorDetailsMapObj[floorId].availableWithinTwoWeeks++;
                    if (status.availabilityStatus.value == 'NOT_AVAILABLE') storeUnitsLocationsMapObj[locationId].floorDetailsMapObj[floorId].notAvailable++;
                    if (status.availabilityStatus.value == 'EXPIRE') storeUnitsLocationsMapObj[locationId].floorDetailsMapObj[floorId].expired++;
                });

                return storeUnitsLocationsMapObj;

            } catch (error) {
                log.error({ title: logTitle + 'error', details: error.message })
            }
        }

        function getStatus(availabilityStatus, availabilityText, outOfOrder, salesOrderDetails) {
            if (outOfOrder) {
                totalNotAvailable++
                return { availabilityStatus: { label: 'NOT_AVAILABLE', value: 'NOT_AVAILABLE' } };
            }

            if (salesOrderDetails.length > 0) {
                const currentDate = new Date();
                const formattedEndDate = formatNsDateStringToObject(salesOrderDetails[0].endDate);
                log.debug({ title: 'formattedEndDate', details: formattedEndDate });
                const daysDifference = formattedEndDate ? Number(Math.floor((formattedEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))) : 15;
                log.debug("daysDifference", daysDifference)
                if (daysDifference > 0 && daysDifference <= 14) {
                    return { availabilityStatus: { label: 'AVAILABLE_IN_TWO_WEEKS', value: 'AVAILABLE_IN_TWO_WEEKS' } };
                } else if (daysDifference < 0) {
                    return { availabilityStatus: { label: 'EXPIRE', value: 'EXPIRE' } };
                } else {
                    return { availabilityStatus: { label: availabilityText, value: availabilityStatus } };
                }
            }

            return { availabilityStatus: { label: availabilityText, value: availabilityStatus } };
        }

        const getDetailOfStorageUnit = (storageUnitIdsArray) => {
            const logTitle = ' getDetailOfStorageUnit()::';

            try {
                let mapObj = {};

                const storageUnitSearch = search.create({
                    type: 'customrecord_dsc_storage_unit',
                    filters: [
                        ["internalid", "anyof", storageUnitIdsArray],
                        "AND",
                        ["isinactive", "is", ['F']]
                    ],
                    columns: [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "custrecord_dsc_suf_storage_type", label: "Storage Type" }),
                        search.createColumn({ name: "custrecord_dsc_suf_storage_unit_group", label: "Storage Unit Group" }),
                        search.createColumn({ name: "custrecord_dsc_suf_storage_width_m", label: "Width (m)" }),
                        search.createColumn({ name: "custrecord_dsc_suf_storage_height_m", label: "Height (m)" }),
                        search.createColumn({ name: "custrecord_dsc_suf_location", label: "Location" }),
                        search.createColumn({ name: "custrecord_dsc_suf_storage_unit_price", label: "Storage Unit Price " }),
                    ]
                });

                const searchResult = getAllSearchResults(storageUnitSearch);

                searchResult.forEach((result) => {

                    const storageUnitId = result.id;
                    const unitName = result.getValue({ name: 'name' });
                    const storageType = result.getValue({ name: 'custrecord_dsc_suf_storage_type' });
                    const unitPrice = result.getValue({ name: 'custrecord_dsc_suf_storage_unit_price' });
                    const unitLocation = result.getValue({ name: 'custrecord_dsc_suf_location' });
                    const unitWidth = result.getValue({ name: 'custrecord_dsc_suf_storage_width_m' });
                    const unitHeight = result.getValue({ name: 'custrecord_dsc_suf_storage_height_m' });

                    if (!mapObj[storageUnitId]) {
                        mapObj[storageUnitId] = [];
                    }

                    mapObj[storageUnitId] = {
                        unitName,
                        storageType,
                        unitPrice,
                        unitLocation,
                        unitWidth,
                        unitHeight
                    }
                });

                return mapObj;

            } catch (error) {
                log.error(logTitle + ' Error', error);
            }
        }


        const getSaleDetailAgainstStorageUnit = (storageUnitIdsArray) => {
            const logTitle = ' getDetailsAgaintStorageUnit() ';

            try {
                let mapObj = {};
                let detailOfStorageUnitObj = {};
                let salesOrderUrl = '';

                const storageUnitSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        search.createFilter({
                            name: 'mainline',
                            operator: 'is',
                            values: 'F'
                        }),
                        search.createFilter({
                            name: 'taxline',
                            operator: 'is',
                            values: 'F'
                        }),
                        search.createFilter({
                            name: 'cogs',
                            operator: 'is',
                            values: 'F'
                        }),
                        search.createFilter({
                            name: 'shipping',
                            operator: 'is',
                            values: 'F'
                        }),
                        search.createFilter({
                            name: 'custcol_dsc_storage_unit',
                            operator: 'anyof',
                            values: storageUnitIdsArray
                        }),
                        search.createFilter({
                            name: 'custrecord_dsc_cf_status',
                            operator: 'noneof',
                            join: "custbody_dsc_so_parent_contract" ,
                            values: ['5'] //Closed
                        }),
                        // search.createFilter({
                        //     name: 'custcol_dsc_location_floor',
                        //     operator: 'anyof',
                        //     values: floorId
                        // }),
                        // search.createFilter({
                        //     name: 'location',
                        //     operator: 'is',
                        //     values: locationId
                        // })
                    ],
                    columns: [
                        search.createColumn({ name: "entity" }),
                        search.createColumn({ name: "custbody_dsc_so_parent_contract" }),
                        search.createColumn({ name: "custbody_dsc_contract_line" }),
                        search.createColumn({ name: "custrecord_dsc_clf_start_date", join: "custbody_dsc_contract_line" }),
                        search.createColumn({ name: "custrecord_dsc_clf_end_date", join: "custbody_dsc_contract_line" }),
                        search.createColumn({ name: "custcol_dsc_storage_unit" }),
                        search.createColumn({ name: "custcol_dsc_location_floor" }),
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "tranid" }),
                    ]
                });

                const searchResults = getAllSearchResults(storageUnitSearch);

                searchResults.forEach(result => {
                    const saleOrderId = result.id;

                    if (saleOrderId) {
                        salesOrderUrl = url.resolveRecord({
                            recordType: 'salesorder',
                            recordId: saleOrderId,
                            isEditMode: false
                        })
                    }
                    const storageUnitId = result.getValue({ name: 'custcol_dsc_storage_unit' });

                    const orderId = result.getValue({ name: 'tranid' })
                    const storageUnitName = result.getText({ name: 'custcol_dsc_storage_unit' });
                    const customerName = result.getText({ name: 'entity' });
                    const contract = result.getText({ name: 'custbody_dsc_so_parent_contract' });
                    const startDate = result.getValue({ name: "custrecord_dsc_clf_start_date", join: "custbody_dsc_contract_line" });
                    const endDate = result.getValue({ name: "custrecord_dsc_clf_end_date", join: "custbody_dsc_contract_line" });

                    if (storageUnitId && !mapObj[storageUnitId]) {
                        mapObj[storageUnitId] = [];

                        mapObj[storageUnitId].push({
                            storageUnitId,
                            storageUnitName,
                            orderId,
                            customerName,
                            contract,
                            startDate,
                            endDate,
                            salesOrderUrl,

                        });

                    } else {

                        let tempSoEndDate = mapObj[storageUnitId][0].endDate ? formatNsDateStringToObject(mapObj[storageUnitId][0].endDate) : '';
                        let tempCurrentEndDate = endDate ? formatNsDateStringToObject(endDate) : '';

                        if (saleOrderId == 11821) {
                            log.audit(logTitle + "mapObj before:", JSON.stringify(mapObj))
                            log.audit(logTitle + "tempSoEndDate : tempCurrentEndDate", tempSoEndDate + " : " + tempCurrentEndDate)
                            if(tempSoEndDate && tempCurrentEndDate){
                            log.audit(logTitle + "tempSoEndDate.getTime() : tempCurrentEndDate.getTime()", tempSoEndDate.getTime() + " : " + tempCurrentEndDate.getTime())
                            }

                        }
                        if (tempSoEndDate && tempCurrentEndDate) {

                            if (tempCurrentEndDate.getTime() > tempSoEndDate.getTime()) {
                                mapObj[storageUnitId][0] = {
                                    storageUnitId,
                                    storageUnitName,
                                    orderId,
                                    customerName,
                                    contract,
                                    startDate,
                                    endDate,
                                    salesOrderUrl,

                                };
                            }

                            if (saleOrderId == 11821) {
                                log.audit(logTitle + "mapObj after:", JSON.stringify(mapObj))
    
                            }
                        }

                    }
                    // if (startDate && endDate) {

                    //     // const currentDate = new Date();
                    //     // const otherDate = new Date(endDate);

                    //     // log.debug(logTitle + ' currentDate', currentDate);
                    //     // log.debug(logTitle + ' otherDate', otherDate);

                    //     //const differenceMs = otherDate - currentDate;
                    //     //const daysDifference = Math.floor(differenceMs / (1000 * 60 * 60 * 24));

                    //     //log.debug(logTitle + ' daysDifference', orderId + daysDifference)



                    // }


                    // const orderId = result.getValue({ name: 'tranid' })

                    // if (!detailOfStorageUnitObj[orderId]) {
                    //     detailOfStorageUnitObj[orderId] = []
                    // }

                    // detailOfStorageUnitObj[orderId].push({
                    //     customerName: result.getText({ name: 'entity' }),
                    //     contract: result.getText({ name: 'custbody_dsc_so_parent_contract' }),
                    //     startDate: result.getValue({ name: 'startdate' }),
                    //     endDate: result.getValue({ name: 'enddate' }),
                    // })
                });

                // log.debug(logTitle + ' detailOfStorageUnitObj', detailOfStorageUnitObj)

                // const keys = Object.keys(detailOfStorageUnitObj);
                // return keys.length > 0 ? detailOfStorageUnitObj[keys[0]][0] : detailOfStorageUnitObj;
                return mapObj;

            } catch (error) {
                log.debug(logTitle + ' error', error.message);
                throw error;
            }

        }

        const calculateExpiryDateforNetwork = (getDate, addDays) => {
            const logTitle = ' calculateExpiryDateforNetwork() ';
            try {
                // log.debug('getDate Lib',getDate)
                if (getDate && addDays) {
                    let getFormatDate = getDate;//formatNsDateStringToObject(getDate);
                    // log.debug('getFormatDate',getFormatDate)
                    if (getFormatDate) {
                        let newDate = new Date(getFormatDate);
                        newDate.setDate(newDate.getDate() + addDays);
                        return newDate;
                    }

                }
            } catch (error) {
                log.debug(logTitle + ' error', error.message);
            }
        }

        const formatDate = (date) => {
            const logTitle = ' formatDate() ';

            try {
                var d = new Date(date),
                    month = '' + (d.getMonth() + 1),
                    day = '' + d.getDate(),
                    year = d.getFullYear();

                if (month.length < 2)
                    month = '0' + month;
                if (day.length < 2)
                    day = '0' + day;
                return [year, month, day].join('-');
            } catch (error) {
                log.debug(logTitle + ' error', error.message);
            }
        }

        const addDays = (dateObj, days) => {
            let date = new Date(dateObj.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }

        const subtractDays = (dateObj, days) => {
            let date = new Date(dateObj.valueOf());
            date.setDate(date.getDate() - days);
            return date;
        }
        return {
            getAllSearchResults,
            getFileId,
            getFileObject,
            generatePdfXml,
            generateRecordName,
            getRemainingDays,
            createExpiredLinkSlForm,
            formatNsDateStringToObject,
            getStorageUnitsMapping,
            getStorageUnitDetailsMapping,
            getStorageUnitsAgainstFloor,
            getDetailOfStorageUnit,
            getSaleDetailAgainstStorageUnit,
            calculateExpiryDateforNetwork,
            formatDate,
            addDays,
            subtractDays
        }
    });