/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/render', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/format', 'N/search'],
    (render, utilsLib, constantsLib, format, search) => {
        const onRequest = context => {
            const title = " onRequest() ";
            log.debug(title, "<--------------- SUITELET SCRIPT - START --------------->");
            const request = context.request;
            const response = context.response;
            try {
                if (request.method == "GET") {
                    const contractId = request.parameters?.recid;
                    if (contractId) {
                        const inputDataObj = getPdfInputData(contractId);
                        log.debug(title + "inputDataObj", inputDataObj);
                        // response.writeLine(JSON.stringify(inputDataObj));
                        let pdfXml = utilsLib.generatePdfXml(inputDataObj, constantsLib.FILE_PATHS.PDF_TEMPLATES.CONTRACT_PDF_TEMPLATE);
                        if (pdfXml) {
                            pdfXml = pdfXml.replace(/&amp;/g, "&");
                            pdfXml = pdfXml.replace(/&lt;/g, "<");
                            pdfXml = pdfXml.replace(/&/g, '&amp;');
                            const pdfFile = render.xmlToPdf({
                                xmlString: pdfXml
                            });
                            response.writeFile({
                                file: pdfFile,
                                isInline: true
                            });
                        }
                    }
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
            log.debug(title, "<--------------- SUITELET SCRIPT - END --------------->");
        }


        const getPdfInputData = contractId => {
            const title = " getPdfInputData() ";
            try {
                let inputDataObj = {
                    printDate: undefined,
                    contracts: []
                };
                const printDateObj = new Date();
                log.debug(title + "printDateObj", printDateObj);

                const formattedPrintDate = format.format({
                    value: printDateObj,
                    type: format.Type.DATE
                });
                inputDataObj.printDate = formattedPrintDate
                // this is the custom function i made for both renewal and standard , its a bit different data strucutre it 
                let allContracts = getContractDetails(contractId)
                log.debug('testContractDetails :', allContracts)

                if (allContracts.length > 0) {
                    let data = {
                        customerDetails: {},
                        storageUnitDetails: [],
                        salesOrderDetails: []
                    };
                    allContracts.forEach(contract => {
                        data.customerDetails = {
                            contractName: contract.customerDetails.contractName,
                            customerId: contract.customerDetails.customerId,
                            customerName: contract.customerDetails.customer,
                            customerAddress: contract.customerDetails.customerAddress,
                            customerMobileNo: contract.customerDetails.customerMobileNo,
                            customerPhoneNo: contract.customerDetails.customerPhoneNo,
                            customerEmail: contract.customerDetails.customerEmail,

                        }

                        data.storageUnitDetails.push(...contract.storageUnitDetails)
                        data.salesOrderDetails.push({
                            storageUnitName: contract.salesOrderDetails.storageUnitName,
                            storageUnitSize: contract.salesOrderDetails.storageUnitSize,
                            salesOrderNo: contract.salesOrderDetails.salesOrderNo,
                            payableAmout: contract.salesOrderDetails.payableAmout,
                            totalAmount: contract.salesOrderDetails.totalAmount,
                            padlockAmount: contract.salesOrderDetails.padlockAmount,
                            taxTotal: contract.salesOrderDetails.taxTotal,
                            packingCharges: contract.salesOrderDetails.packingCharges,
                            discountAmount: contract.salesOrderDetails.discountAmount,
                            securityDepositAmount: contract.salesOrderDetails.securityDepositAmount
                        })



                    });
                    log.debug('data final:', data)
                    return data;
                }
                return { customerDetails: {}, storageUnitDetails: [], salesOrderDetails: [] };

            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }

        const getContractDetails = contractId => {
            const title = " testContractDetails() ";
            try {
                log.debug({ title: title + 'contractId', details: contractId });

                let allContractDetails = [];

                let contractDetailsSearch = search.create({
                    type: 'customrecord_dsc_contract',
                    filters: [
                        ["custrecord_dsc_clf_parent_contract.custrecord_dsc_clf_contract_type", "anyof", constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD, constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL],
                        "AND",
                        ["internalid", "anyof", contractId],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({ name: "name" }),
                        search.createColumn({ name: "custrecord_dsc_cf_customer" }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_contract_type",
                            join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                            label: "Contract Type"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_start_date",
                            join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_end_date",
                            join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_so_reference",
                            join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                        }),
                        search.createColumn({
                            name: 'custrecord_dsc_clf_duration',
                            join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                        }),
                        search.createColumn({
                            name: "custentity_dsc_mobileno",
                            join: "CUSTRECORD_DSC_CF_CUSTOMER"
                        }),
                        search.createColumn({
                            name: "phone",
                            join: "CUSTRECORD_DSC_CF_CUSTOMER"
                        }),
                        search.createColumn({
                            name: "email",
                            join: "CUSTRECORD_DSC_CF_CUSTOMER"
                        }),
                        search.createColumn({
                            name: "address",
                            join: "CUSTRECORD_DSC_CF_CUSTOMER",
                        }),
                        search.createColumn({
                            name: "name",
                            join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                        }),
                    ]
                });

                let contractResults = utilsLib.getAllSearchResults(contractDetailsSearch);
                log.debug({ title: title + 'contractResults', details: contractResults });

                contractResults.forEach((contract) => {
                    let contractDetails = {
                        contractName: contract.getValue("name"), //10-Feb-2025 ticket # LS-148 
                        contractInternalId: contract.getValue({ name: "internalid", join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT" }),
                        contractType: contract.getValue({ name: 'custrecord_dsc_clf_contract_type', join: 'CUSTRECORD_DSC_CLF_PARENT_CONTRACT' }),
                        contractStartDate: contract.getValue({ name: "custrecord_dsc_clf_start_date", join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT" }),
                        contractEndDate: contract.getValue({ name: "custrecord_dsc_clf_end_date", join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT" }),
                        contractDuration: contract.getValue({ name: "custrecord_dsc_clf_duration", join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT" }),
                        customerDetails: {
                            contractName: contract.getValue("name"), //10-Feb-2025 ticket # LS-148 
                            customerId: contract.getValue("custrecord_dsc_cf_customer"),
                            customer: contract.getText("custrecord_dsc_cf_customer"),
                            customerMobileNo: contract.getValue({ name: 'custentity_dsc_mobileno', join: 'CUSTRECORD_DSC_CF_CUSTOMER' }),
                            customerPhoneNo: contract.getValue({ name: 'phone', join: 'CUSTRECORD_DSC_CF_CUSTOMER' }),
                            customerEmail: contract.getValue({ name: 'email', join: 'CUSTRECORD_DSC_CF_CUSTOMER' }),
                            customerAddress: contract.getValue({ name: 'address', join: 'CUSTRECORD_DSC_CF_CUSTOMER' }),
                        },
                        storageUnitDetails: [], // Handle this separately if needed
                        salesOrderDetails: {},
                        customerDeposit: 0
                    };

                    let salesOrderId = contract.getValue({ name: "custrecord_dsc_clf_so_reference", join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT" });
                    contractDetails.salesOrderId = salesOrderId;

                    if (salesOrderId) {
                        const storageUnitDetailsMapObj = utilsLib.getStorageUnitDetailsMapping([salesOrderId]) //it will return empty if the Storage unit is not set up on sales order
                        // log.debug('storageUnitDetailsMapObj',storageUnitDetailsMapObj)
                        if (storageUnitDetailsMapObj) {
                            contractDetails.storageUnitDetails = Object.values(storageUnitDetailsMapObj);
                        }

                        const { totalAmount, padlockAmount, payableAmout, taxTotal, packingCharges, securityDepositAmount, discountAmount, itemRateMapping } = getSalesOrderDetails(salesOrderId) // get the security deposit amount from here.
                        if (contractDetails.storageUnitDetails.length > 0) {
                            log.debug(title + "contractDetails.storageUnitDetails[0]:", contractDetails.storageUnitDetails[0])
                            const storageUnitName = contractDetails.storageUnitDetails[0].storageUnitName;
                            let storageUnitType = contractDetails.storageUnitDetails[0].storageUnitType;
                            const storageUnitArea = contractDetails?.storageUnitDetails[0]?.storageUnitAreatNew
                            const storageUnitAreaOpenSpace = contractDetails?.storageUnitDetails[0]?.storageUnitAreatOpenSpace
                            contractDetails.storageUnitDetails[0].contractInternalId = contractDetails.contractInternalId
                            contractDetails.storageUnitDetails[0].startDate = contractDetails.contractStartDate
                            contractDetails.storageUnitDetails[0].endDate = contractDetails.contractEndDate
                            contractDetails.storageUnitDetails[0].contractType = contractDetails.contractType
                            contractDetails.storageUnitDetails[0].storageUnitType = storageUnitType

                   

                            contractDetails.storageUnitDetails[0].storageUnitSize = storageUnitType == "3" ? storageUnitAreaOpenSpace : storageUnitArea
                            contractDetails.salesOrderDetails.storageUnitName = storageUnitName;
                            contractDetails.salesOrderDetails.storageUnitType = storageUnitType;
                            contractDetails.salesOrderDetails.storageUnitSize = storageUnitType == "3" ? storageUnitAreaOpenSpace : storageUnitArea;

                            let ratePerSqrFt = 0;
                            if (itemRateMapping[contractDetails.contractInternalId]) {
                                contractDetails.storageUnitDetails[0].storageUnitPrice = itemRateMapping[contractDetails.contractInternalId];

                                    log.debug(title + "storageUnitPrice:", contractDetails.storageUnitDetails[0].storageUnitPrice)
                                    log.debug(title + "storageUnitSize:", contractDetails.storageUnitDetails[0].storageUnitSize)

                                if (parseFloat(contractDetails.storageUnitDetails[0].storageUnitSize) > 0) {
                                    ratePerSqrFt = contractDetails.storageUnitDetails[0].storageUnitPrice / contractDetails.storageUnitDetails[0].storageUnitSize;
                                }

                                if (ratePerSqrFt > 0) {
                                    contractDetails.storageUnitDetails[0].storageUnitRatePerSqft = parseFloat(ratePerSqrFt).toFixed(2);
                                }
                            }
                        }


                        contractDetails.salesOrderDetails.payableAmout = parseFloat(payableAmout).toFixed(2);
                        contractDetails.salesOrderDetails.totalAmount = parseFloat(totalAmount).toFixed(2);
                        contractDetails.salesOrderDetails.padlockAmount = parseFloat(padlockAmount).toFixed(2);
                        contractDetails.salesOrderDetails.taxTotal = parseFloat(taxTotal).toFixed(2);
                        contractDetails.salesOrderDetails.packingCharges = parseFloat(packingCharges).toFixed(2);
                        contractDetails.salesOrderDetails.discountAmount = parseFloat(discountAmount).toFixed(2);
                        contractDetails.salesOrderDetails.securityDepositAmount = parseFloat(securityDepositAmount).toFixed(2);
                    }


                    allContractDetails.push(contractDetails);
                });

                log.debug({ title: title + 'allContractDetails', details: allContractDetails });
                return allContractDetails;

            } catch (error) {
                log.error({
                    title: "ERROR IN" + title,
                    details: error
                });
            }
        };



        const getSalesOrderDetails = (salesOrderId) => {
            const title = "getSalesOrderDetails ::"
            try {
                let itemRateMapping = {};
                let salesOrderSearch = search.create({
                    type: 'salesorder',
                    filters: [

                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", salesOrderId],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custcol_dsc_storage_unit" }),
                        search.createColumn({ name: "custbody_dsc_contract_line" }),
                        search.createColumn({ name: "taxamount" }),
                        search.createColumn({ name: "item" }),
                        search.createColumn({ name: "amount" }),
                        search.createColumn({ name: "fxamount" }),
                        search.createColumn({ name: "taxtotal" }),
                        search.createColumn({ name: "fxrate" }),
                        search.createColumn({ name: "quantity" })
                    ]
                })

                let results = utilsLib.getAllSearchResults(salesOrderSearch)
                let salesOrderDetails = {}
                let items = []
                log.debug(title+"DISCOUNT : TEST results", results);
                results.forEach((result) => {
                    let salesOrderId = result.getValue({ name: 'internalid' })
                    let storageUnitNumber = result.getValue({ name: 'custcol_dsc_storage_unit' })
                    let contractLineId = result.getValue({ name: 'custbody_dsc_contract_line' })
                    let taxAmount = result.getValue({ name: 'taxamount' })
                    let amount = result.getValue({ name: 'fxamount' })
                    let itemId = result.getValue({ name: "item" })
                    let totalTax = result.getValue({ name: "taxtotal" })
                    let itemRate = result.getValue({ name: "fxrate" })
                    let itemQty = result.getValue({ name: "quantity" })
                    let finalItemAmount = Number(itemRate) * Number(itemQty)

                    if (itemId == '11') {
                        amount = Number(itemRate) * Number(itemQty);
                    }

                    if (constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID == itemId && !itemRateMapping[contractLineId]) {
                        itemRateMapping[contractLineId] = itemRate;

                    }
                    salesOrderDetails = {
                        salesOrderId,
                        storageUnitNumber,
                        taxAmount,
                        amount,
                        itemId,
                        totalTax,
                        itemRate,
                        itemQty,
                        finalItemAmount
                    }
                    items.push(salesOrderDetails)
                });
                let discountSoItemsArray = items.filter((value) => constantsLib.LOCAL_STORAGE_DISCOUNT_ITEMS_IDS.includes(value.itemId));
                let discountAmount = 0;
                // log.debug(title+"DISCOUNT TEST : discountSoItemsArray", discountSoItemsArray);
                discountSoItemsArray.forEach((discountItem) => {
                    let discountItemAmount = discountItem?.amount;
                    discountItemAmount = discountItemAmount ? parseFloat(discountItemAmount) : 0;
                    discountAmount += discountItemAmount;
                });
                
                log.debug('items to test ', items)
                let storageItem = items.filter((value) => value.itemId === constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID)
                let payableAmout = storageItem[0]?.finalItemAmount//(storageItem[0]?.amount - parseFloat(discountAmount)) || 0;
                // log.debug(title+"DISCOUNT TEST : storageItem[0]?.amount - parseFloat(discountAmount)", storageItem[0]?.amount+" - " + parseFloat(discountAmount));
                // log.debug(title+"DISCOUNT TEST : payableAmout", payableAmout);
                let payableAmoutSimple = (storageItem[0]?.finalItemAmount) || 0;
                let taxTotal = storageItem[0]?.totalTax || 0
                let padlockitem = items.filter((value) => value.itemId === constantsLib.PADLOCK_ITEM_ID);
                let padlockAmount = padlockitem[0]?.amount || 0

                let packingItem = items.filter((value) => value.itemId === constantsLib.PACKING_CHARGES_ITEM_ID);
                let packingCharges = packingItem[0]?.amount || 0

                //getting security deposit here from sales order;
                let securityDeposit = items.filter((value) => value.itemId === constantsLib.SECURITY_DEPOSIT_ID)
                let securityDepositAmount = securityDeposit[0]?.finalItemAmount || 0


                // log.debug('itemRateMapping', itemRateMapping)


                let totalAmount = parseFloat(payableAmoutSimple) + parseFloat(discountAmount) + parseFloat(padlockAmount) + parseFloat(taxTotal) + parseFloat(packingCharges) || 0
                if (securityDepositAmount) totalAmount += parseFloat(securityDepositAmount)


                return { totalAmount, padlockAmount, payableAmout, taxTotal, packingCharges, securityDepositAmount, discountAmount, itemRateMapping }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }



        return {
            onRequest
        }
    }
);