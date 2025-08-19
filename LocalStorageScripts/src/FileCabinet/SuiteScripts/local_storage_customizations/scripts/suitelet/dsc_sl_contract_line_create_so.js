/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/log', '../../lib/dsc_lib_constants.js'],
    (record, search, log, constantsLib) => {

        const onRequest = (context) => {
            const title = 'onRequest() :: ';
            let request = context.request;
            let response = context.response;
            try {
                log.debug('onRequest', 'Suitelet called with method: ' + context.request);
                if (request.method === 'POST') {
                    let requestData = JSON.parse(request.body);
                    // Get params from User Event call
                    log.debug('requestData', requestData)
                    let parentContractId = requestData.parentContractId;
                    let contractCustomer = requestData.contractCustomer;
                    let contractDuration = requestData.contractDuration;
                    let contractPadlock = requestData.contractPadlock;
                    let contractPackingCharges = requestData.contractPackingCharges;
                    let contractPackingChargesAmount = requestData.contractPackingChargesAmount;
                    let contractSecurityDeposit = requestData.contractSecurityDeposit;
                    let contractSecurityDepositAmount = requestData.contractSecurityDepositAmount;
                    let contractOtherCharges = requestData.contractOtherCharges;
                    let contractOtherChargesAmount = requestData.contractOtherChargesAmount;
                    let contractDiscountItem = requestData.contractDiscountItem;
                    let recordId = requestData.recordId;
                    let contractType = requestData.contractTypeId;
                    let contractPaymentMode = requestData.contractPaymentMode;

                    // Look up parent contract's storage unit
                    const contractSearchLookup = search.lookupFields({
                        type: constantsLib.RECORD_TYPES.CONTRACT,
                        id: parentContractId,
                        columns: ['custrecord_dsc_cf_storage_unit']
                    });

                    const parentContractStorageUnit = contractSearchLookup?.custrecord_dsc_cf_storage_unit?.[0]?.value;

                    let storageUnitPrice;
                    let storageUnitFloor;
                    log.debug(title + 'parentContractStorageUnit', parentContractStorageUnit);
                    if (parentContractStorageUnit) {
                        const storageUnitSearchLookup = search.lookupFields({
                            type: constantsLib.RECORD_TYPES.STORAGE_UNIT,
                            id: parentContractStorageUnit,
                            columns: [
                                'custrecord_dsc_suf_location_floor',
                                'custrecord_dsc_suf_storage_unit_price'
                            ]
                        });
                        storageUnitFloor = storageUnitSearchLookup?.custrecord_dsc_suf_location_floor?.[0]?.value || null;
                        storageUnitPrice = storageUnitSearchLookup?.custrecord_dsc_suf_storage_unit_price || null;
                    }
                    // log.debug(title + 'storageUnitPrice', storageUnitPrice);
                    // log.debug(title + 'storageUnitFloor', storageUnitFloor);

                    // Create Sales Order
                    let soRec = record.create({
                        type: record.Type.SALES_ORDER,
                        isDynamic: true
                    });

                    soRec.setValue({
                        fieldId: 'entity',
                        value: contractCustomer
                    });
                    soRec.setValue({
                        fieldId: 'custbody_dsc_contract_line',
                        value: recordId
                    });

                    if (parentContractStorageUnit && contractDuration) {
                        addSalesOrderItems(soRec, constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID, contractDuration, storageUnitPrice, parentContractStorageUnit, storageUnitFloor, constantsLib.FIELD_VALUES.LOCATION_PRODUCTION_CITY)
                    }
                    if (contractPadlock && contractType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD) {
                        addSalesOrderItems(soRec, constantsLib.PADLOCK_ITEM_ID, 1, null, null, null, null);
                    }
                    if (contractPackingCharges && contractPackingChargesAmount && contractType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD) {
                        addSalesOrderItems(soRec, constantsLib.PACKING_CHARGES_ITEM_ID, 1, contractPackingChargesAmount, null, null, null);
                    }
                    if (contractSecurityDeposit && contractSecurityDepositAmount && contractType == constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD) {
                        addSalesOrderItems(soRec, constantsLib.SECURITY_DEPOSIT_ID, 1, contractSecurityDepositAmount, null, null, null);
                    }
                    if (contractOtherCharges && contractOtherChargesAmount) {
                        addSalesOrderItems(soRec, constantsLib.OTHER_CHRAGES_ITEM, 1, contractOtherChargesAmount, null, null, null);
                    }
                    if (contractDiscountItem) {
                        addSalesOrderItems(soRec, contractDiscountItem, 1, null, null, null, null);
                    }

                    let soId = soRec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });

                    log.debug('Sales Order Created', 'Internal ID: ' + soId);
                    if (soId) {
                        let soRecLoad = record.load({
                            type: record.Type.SALES_ORDER,
                            id: soId
                        });

                        // Get status
                        let soStatus = soRecLoad.getValue({
                            fieldId: 'orderstatus'
                        });
                        log.debug('Sales Order Status', soStatus);
                        if (soStatus === 'B' || soStatus === 'D') { //pending fulfillment or partial fulfillment
                            let itemFulfillmentId = createItemFulfillment(soId);
                        }
                        // return;
                        if (contractPaymentMode != constantsLib.FIELD_VALUES.PAYMENT_METHOD_ONLINE) {
                            let invoiceId = createInvoice(soId);
                            log.debug('Invoice Created', 'Invoice ID: ' + invoiceId);
                            if (invoiceId) {

                                let result = {
                                    success: true,
                                    message: 'Invoice processed successfully!'
                                };

                                // Send response back to the User Event script
                                response.write(JSON.stringify(result));
                            }

                        } else {
                            let result = {
                                success: true,
                                message: 'Sales Order created successfully!',
                                soId: soId
                            };
                            response.write(JSON.stringify(result));
                        }
                    }
                } else {
                    response.write(JSON.stringify({
                        success: false,
                        message: 'Please send a POST request.'
                    }));
                }

            } catch (e) {
                log.error('Suitelet Error', e);
                context.response.write(JSON.stringify({
                    success: false,
                    message: e.message
                }));
            }
        }

        const addSalesOrderItems = (soRec, itemId, quantity, amount, storageUnit, storageFloor, location) => {
            const title = "addSalesOrderItems ::"
            try {
                soRec.selectNewLine({
                    sublistId: 'item'
                });
                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: itemId,
                    fireSlavingSync: true
                });
                // log.debug('location', location)

                if (location) {
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: location,
                        fireSlavingSync: true
                    });

                }
                // log.debug('storageFloor', storageFloor)

                if (storageFloor) {
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_dsc_location_floor',
                        value: storageFloor,
                        fireSlavingSync: true
                    });
                }
                // log.debug('storageUnit', storageUnit)

                if (storageUnit) {
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_dsc_storage_unit',
                        value: Number(storageUnit),
                        fireSlavingSync: true
                    });
                }
                if (quantity) {
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: quantity
                    });
                }
                if (amount && amount != null) {
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: Number(amount)
                    });
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: Number(quantity) * Number(amount)
                    });
                }
                // let checkStorage = soRec.getCurrentSublistValue({
                //     sublistId: 'item',
                //     fieldId: 'custcol_dsc_storage_unit'
                // });
                // log.debug(title + 'checkStorage', checkStorage);
                // if (!checkStorage) {
                //     throw new Error(`Storage unit still empty for item ${itemId}`);
                // }
                soRec.commitLine({
                    sublistId: 'item'
                });

            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const createInvoice = (soId) => {
            const title = "createInvoice :: ";
            try {
                let invoiceRec = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: soId,
                    toType: record.Type.INVOICE,
                    isDynamic: true
                });
                let invoiceId = invoiceRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: false
                });

                // log.debug('Invoice Created', 'Invoice ID: ' + invoiceId);
                return invoiceId;
            } catch (error) {
                log.error({
                    title: title + "error",
                    details: error
                });
            }
        }
        const createItemFulfillment = (soId) => {
            const title = "createItemFulfillment :: ";
            try {
                let itemFulfillmentRec = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: soId,
                    toType: record.Type.ITEM_FULFILLMENT,
                    isDynamic: true
                });
                itemFulfillmentRec.setValue({
                    fieldId: 'shipstatus',
                    value: 'C' // C = Shipped, A = Picked, B = Packed
                });
                let lineCount = itemFulfillmentRec.getLineCount({
                    sublistId: 'item'
                });
                log.debug('IFF Line Count', lineCount);
                for (let i = 0; i < lineCount; i++) {
                    itemFulfillmentRec.selectLine({
                        sublistId: 'item',
                        line: i
                    });

                    itemFulfillmentRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: constantsLib.FIELD_VALUES.LOCATION_PRODUCTION_CITY,
                    });
                    let itemId = itemFulfillmentRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });
                    if (itemId === constantsLib.PADLOCK_ITEM_ID) {
                        itemFulfillmentRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: 1
                        });
                    } else {
                        itemFulfillmentRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemreceive',
                            value: true
                        });
                    }
                    itemFulfillmentRec.commitLine({
                        sublistId: 'item'
                    });
                }
                let itemFulfillmentId = itemFulfillmentRec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.debug('Item Fulfillment Created', 'Item Fulfillment ID: ' + itemFulfillmentId);
                return itemFulfillmentId;
            } catch (error) {
                log.error({
                    title: title + "error",
                    details: error
                });
            }
        }

        return {
            onRequest: onRequest
        };
    });