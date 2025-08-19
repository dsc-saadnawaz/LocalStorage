/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/format', 'N/search', 'N/record'],
    (render, utilsLib, constantsLib, format, search, record) => {
        const onRequest = context => {
            const title = " onRequest() ";
            log.debug(title, "<--------------- SUITELET SCRIPT - START --------------->");
            const request = context.request;
            const response = context.response;
            try {
                if (request.method == "GET") {
                    const checkoutId = request.parameters?.recid;
                    if (checkoutId) {
                        const inputDataObj = getPdfInputData(checkoutId);
                        // response.writeLine(JSON.stringify(inputDataObj));
                        let pdfXml = utilsLib.generatePdfXml(inputDataObj, constantsLib.FILE_PATHS.PDF_TEMPLATES.CHECKOUT_PDF_TEMPALTE);
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

        const getPdfInputData = checkoutId => {
            const title = " getPdfInputData() ";
            try {
                const inputDataObj = {
                    agreementRef: undefined,
                    checkoutDate: undefined,
                    customer: undefined,
                    mobileNumber: undefined,
                    customerPhone: undefined,
                    customerEmail: undefined,
                    initialLeaseAgreementDetails: undefined,
                    padlockValue: undefined,
                    packingChargesValue: undefined,
                    leaseExtensionAgreementDetails: undefined,
                    RenewalValuesSum: undefined,
                    totalAgreementAmountDetails: undefined

                };
                // let checkoutDetailsData = getCheckoutDetails(checkoutId);
                let { checkoutAgreementText, checkoutCreatedDate, checkoutCustomerName, mobileNo, customerPhone, customerEmail, standardArr, renewalArr, totalSum, totalAgreementAmountArr, totalCreditMemoAmount, lateChargesAmount, lateChargestTax } = getCheckoutDetails(checkoutId)

                log.debug(title + "lateChargesAmount : lateChargestTax", lateChargesAmount + " : " + lateChargestTax);


                inputDataObj.agreementRef = checkoutAgreementText;
                inputDataObj.checkoutDate = checkoutCreatedDate;
                inputDataObj.customer = checkoutCustomerName;
                inputDataObj.mobileNumber = mobileNo;
                inputDataObj.customerPhone = customerPhone;
                inputDataObj.customerEmail = customerEmail;
                inputDataObj.initialLeaseAgreementDetails = standardArr
                inputDataObj.leaseExtensionAgreementDetails = renewalArr
                inputDataObj.RenewalValuesSum = totalSum
                inputDataObj.totalAgreementAmountDetails = totalAgreementAmountArr
                inputDataObj.padlockValue = standardArr[0]?.padlock || 0
                inputDataObj.packingChargesValue = standardArr[0]?.packingCharges || 0
                inputDataObj.vatAmount = standardArr[0]?.vatAmount || 0
                inputDataObj.refundDepositAmount = totalCreditMemoAmount

                //10-Feb-2025 ticket # LS-148 start
                inputDataObj.lateChargesAmount = lateChargesAmount || 0;
                inputDataObj.lateChargestTax = lateChargestTax || 0;
                //10-Feb-2025 ticket # LS-148 end

                log.debug({ title: title + 'inputDataObj', details: inputDataObj })
                return inputDataObj;
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }


        const getCheckoutDetails = (checkoutId) => {
            const title = "getCheckOutDetails :: "
            try {
                let lateChargesAmount = 0;
                let lateChargestTax = 0;

                let checkoutDetailsSearch = search.create({
                    type: 'customrecord_dsc_checkout',
                    filters: [
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['internalid', 'anyof', checkoutId]
                    ],
                    columns: [
                        search.createColumn({ name: 'name' }),
                        search.createColumn({ name: 'created' }),
                        search.createColumn({ name: 'custrecord_dsc_cf_agreement_no' }),
                        search.createColumn({
                            name: "custrecord_dsc_cf_customer",
                            join: "CUSTRECORD_DSC_CF_AGREEMENT_NO",
                            label: "Customer"
                        })
                    ]
                })

                let results = utilsLib.getAllSearchResults(checkoutDetailsSearch)
                let checkoutDetails = {}

                results.forEach((result) => {
                    let checkout = result.getValue({ name: 'name' })
                    let checkoutCreatedDate = result.getValue({ name: 'created' }).split(" ")[0]

                    let checkoutAgreementNo = result.getValue({ name: 'custrecord_dsc_cf_agreement_no' })
                    let checkoutAgreementText = result.getText({ name: 'custrecord_dsc_cf_agreement_no' })


                    let checkoutCustomerName = result.getText({ name: 'custrecord_dsc_cf_customer', join: 'CUSTRECORD_DSC_CF_AGREEMENT_NO' })
                    let checkoutCustomerValue = result.getValue({ name: 'custrecord_dsc_cf_customer', join: 'CUSTRECORD_DSC_CF_AGREEMENT_NO' })
                    log.debug('checkoutCustomerValue', checkoutCustomerValue)
                    let mobileNo, customerPhone, customerEmail;
                    if (checkoutCustomerValue) {
                        let customerData = getCustomerDetails(checkoutCustomerValue);
                        mobileNo = customerData.custentity_dsc_mobileno
                        customerPhone = customerData.phone
                        customerEmail = customerData.email
                    }
                    let totalCreditMemoAmount = getCreditMemoDetails(checkoutAgreementNo)  //wokrking on this one
                    //getting late charges values using parent contract == agreement No                    //
                    let lateChargesDetails = getLateChargesDetails(checkoutAgreementNo)
                    log.debug('lateChargesDetails :', lateChargesDetails)

                    let { standardArr, renewalArr } = getContractLineDetails(checkoutAgreementNo)
                    let totalSum = sumOfLeaseAgreementDetails(renewalArr);

                     //10-Feb-2025 ticket # LS-148 start
                     let tempLateAmount = lateChargesDetails.amount || 0;
                     let tempLateTaxAmount = lateChargesDetails.taxAmount || 0;
                     lateChargesAmount = parseFloat(lateChargesAmount) + parseFloat(tempLateAmount);
                     lateChargestTax = parseFloat(tempLateTaxAmount) + parseFloat(lateChargestTax);
                     
                     let lateChargesTotal = parseFloat(lateChargesAmount) + parseFloat(lateChargestTax);
 
 
                     log.debug(title + "lateChargesAmount : lateChargestTax", lateChargesAmount + " : " + lateChargestTax);
 
                     //10-Feb-2025 ticket # LS-148 end

                    let totalAgreementAmountArr = totalAgreementAmount(standardArr, totalSum, lateChargesTotal);
                    log.debug('totalAgreementAmountArr', totalAgreementAmountArr)

                   

                    checkoutDetails = {
                        checkout,
                        checkoutCreatedDate,
                        checkoutAgreementNo,
                        checkoutAgreementText,
                        checkoutCustomerName,
                        mobileNo,
                        customerPhone,
                        customerEmail,
                        standardArr,
                        renewalArr,
                        totalSum,
                        totalAgreementAmountArr,
                        totalCreditMemoAmount,
                        lateChargesAmount,
                        lateChargestTax
                    }

                })

                log.debug(title + "checkoutDetails:", JSON.stringify(checkoutDetails));
                return checkoutDetails
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const getCustomerDetails = (checkoutCustomerValue) => {
            const title = "getCustomerDetails ::"
            try {
                let customerData = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: parseInt(checkoutCustomerValue),
                    columns: ['phone', 'custentity_dsc_mobileno', 'email']
                })
                log.debug('customerData', customerData)
                return customerData
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }


        const getContractLineDetails = (checkoutAgreementNo) => {
            const title = "getContractLineDetails ::";
            try {
                let getContractLineDetailsSearch = search.create({
                    type: "customrecord_dsc_contract_line",
                    filters: [
                        ["custrecord_dsc_clf_parent_contract", "anyof", checkoutAgreementNo],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({ name: "custrecord_dsc_clf_contract_type" }),
                        search.createColumn({ name: "name" }),
                        search.createColumn({ name: "custrecord_dsc_clf_so_reference" }),
                        search.createColumn({ name: "custrecord_dsc_clf_start_date" }),
                        search.createColumn({ name: "custrecord_dsc_clf_end_date" }),
                        search.createColumn({
                            name: "custrecord_dsc_cf_storage_unit",
                            join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                        })
                    ]
                });

                let results = utilsLib.getAllSearchResults(getContractLineDetailsSearch);
                let renewalArr = [];
                let standardArr = [];
                results.forEach((result) => {
                    let contractType = result.getText({ name: 'custrecord_dsc_clf_contract_type' });
                    let salesOrderRef = result.getValue({ name: 'custrecord_dsc_clf_so_reference' });
                    let unit = result.getValue({ name: 'name' });
                    let startDate = result.getValue({ name: 'custrecord_dsc_clf_start_date' });
                    let endDate = result.getValue({ name: 'custrecord_dsc_clf_end_date' });
                    let storageUnitNumber = result.getValue({ name: 'custrecord_dsc_cf_storage_unit', join: 'CUSTRECORD_DSC_CLF_PARENT_CONTRACT' });
                    let storageUnitName = result.getText({ name: 'custrecord_dsc_cf_storage_unit', join: 'CUSTRECORD_DSC_CLF_PARENT_CONTRACT' });

                    if (salesOrderRef) {
                        let contractData = {
                            name: unit,
                            contractType: contractType,
                            startDate: startDate,
                            endDate: endDate,
                            storageUnitName: storageUnitName
                        };

                        if (storageUnitNumber) {
                            let { unitItem } = getLocalStorageUnitItem(salesOrderRef, storageUnitNumber);
                            contractData.leaseAmount = 0;
                            contractData.taxAmount = 0;

                            for (let i = 0; i < unitItem.length; i++) {
                                contractData.leaseAmount = parseFloat(Number(unitItem[i].amount)) || 0;
                                contractData.taxAmount = parseFloat(Number(unitItem[i].taxAmount)) || 0;
                            }


                            log.debug(`contractData.leaseAmount (iteration ${i})`, contractData.leaseAmount);   ///this is some times empty so it should be set to 0 and added then to avoid NAN

                            contractData.totalAmount = parseFloat(Number(contractData.leaseAmount) + Number(contractData.taxAmount)).toFixed(2) || 0;


                            log.debug('contractData.totalAmount ::', contractData.totalAmount);

                            let { otherItems } = getPadlockItem(salesOrderRef);
                            if (otherItems.length > 0) {
                                contractData.padlock = parseFloat(Number(otherItems[0].amount)).toFixed(2) || 0;
                            } else {
                                contractData.padlock = 0;
                            }

                            let { securityDepositItem } = getSecurityDeposit(salesOrderRef);
                            if (securityDepositItem.length > 0) {
                                contractData.securityDeposit = parseFloat(Number(securityDepositItem[0].amount)).toFixed(2) || 0;
                            } else {
                                contractData.securityDeposit = 0;
                            }

                            let { packingItem } = getPackingChargesItem(salesOrderRef);
                            if (packingItem.length > 0) {
                                contractData.packingCharges = parseFloat(packingItem[0].grossAmount) || 0;
                            } else {
                                contractData.packingCharges = 0;
                            }

                            let { vatAmount } = vatDetails(salesOrderRef, packingItem);
                            contractData.vatAmount = parseFloat(Number(vatAmount)).toFixed(2) || 0;

                            if (contractData.securityDeposit) {
                                contractData.totalAmount = parseFloat(Number(contractData.totalAmount) + Number(contractData.securityDeposit)).toFixed(2);
                            }

                            if (contractData.padlock) {
                                contractData.totalAmount = parseFloat(Number(contractData.totalAmount) + Number(contractData.padlock)).toFixed(2);
                            }

                            if (contractData.vatAmount) {
                                contractData.totalAmount = parseFloat(Number(contractData.totalAmount) + Number(contractData.vatAmount)).toFixed(2);
                            }

                        } else {
                            contractData.leaseAmount = 0;
                            contractData.taxAmount = 0;
                            contractData.padlock = 0;
                            contractData.packingCharges = 0;
                            contractData.customerDeposit = 0;
                            contractData.vatAmount = 0;
                            contractData.totalAmount = 0;
                        }

                        if (contractType === "Renewal") {
                            renewalArr.push(contractData);

                        } else if (contractType === "Standard") {
                            standardArr.push(contractData);

                        }
                    }
                });

                //log.debug({ title: title + 'standardArr', details: standardArr });

                return { renewalArr, standardArr };
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        };



        const getPackingChargesItem = (salesOrderRef) => {
            const title = " getPackingChargesItem ::"
            try {
                let getPackingChargesItemSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", salesOrderRef],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["item.internalid", "anyof", constantsLib.PACKING_CHARGES_ITEM_ID]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custcol_dsc_storage_unit" }),
                        search.createColumn({ name: "amount" }),
                        search.createColumn({ name: "trantaxtotal" }),
                        search.createColumn({ name: "taxamount" }),
                        search.createColumn({
                            name: "internalid",
                            join: "item"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "({amount}+{amount}*({taxitem.rate}/100))",
                            label: "GROSS AMOUNT"
                        }),
                    ]
                })
                let results = utilsLib.getAllSearchResults(getPackingChargesItemSearch)
                let getPackingChargesItemSearchDetails = {}
                let packingItem = []
                results.forEach((result) => {
                    let salesOrderId = result.getValue({ name: 'internalid' })
                    let storageUnitNumber = result.getValue({ name: 'custcol_dsc_storage_unit' })
                    let taxAmount = result.getValue({ name: 'trantaxtotal' })
                    let amount = parseInt(result.getValue({ name: 'amount' })) //10
                    let taxrateAmount = result.getValue({ name: 'taxamount' })
                    let itemId = result.getValue({ name: 'internalid', join: 'item' })
                    let grossAmount = result.getValue({ name: 'formulanumeric', formula: "({amount}+{amount}*({taxitem.rate}/100))" })

                    //log.debug({ title: title + 'grossAmount', details: grossAmount })

                    getPackingChargesItemSearchDetails = {
                        salesOrderId,
                        itemId,
                        storageUnitNumber,
                        amount,
                        taxAmount,
                        taxrateAmount,
                        grossAmount
                    }
                    packingItem.push(getPackingChargesItemSearchDetails)


                })
                //log.debug({ title: title + 'packingItem', details: packingItem })

                return {
                    packingItem
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const getLocalStorageUnitItem = (salesOrderRef, storageUnitNo) => {
            const title = "getLocalStorageUnitItem ::"
            try {
                let localStorageUnitSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", salesOrderRef],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["item.internalid", "anyof", constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custcol_dsc_storage_unit" }),
                        search.createColumn({ name: "amount" }),
                        search.createColumn({ name: "trantaxtotal" }),
                        search.createColumn({
                            name: "internalid",
                            join: "item"
                        })
                    ]
                })
                let results = utilsLib.getAllSearchResults(localStorageUnitSearch)
                let LocalStorageUnitItemDetails = {}
                let unitItem = []
                results.forEach((result) => {
                    let salesOrderId = result.getValue({ name: 'internalid' })
                    let storageUnitNumber = result.getValue({ name: 'custcol_dsc_storage_unit' })
                    let taxAmount = result.getValue({ name: 'trantaxtotal' })
                    let amount = result.getValue({ name: 'amount' })
                    let itemId = result.getValue({ name: 'internalid', join: 'item' })
                    LocalStorageUnitItemDetails = {
                        salesOrderId,
                        itemId,
                        storageUnitNumber,
                        amount,
                        taxAmount
                    }
                    if (storageUnitNumber == storageUnitNo) {
                        unitItem.push(LocalStorageUnitItemDetails)
                    }
                })
                return {
                    unitItem
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const getPadlockItem = (salesOrderRef) => {
            const title = "getPadlockItem ::"
            try {
                let getPadlockItemSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", salesOrderRef],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["item.internalid", "anyof", constantsLib.PADLOCK_ITEM_ID, constantsLib.PACKING_CHARGES_ITEM_ID]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custcol_dsc_storage_unit" }),
                        search.createColumn({ name: "amount" }),
                        search.createColumn({ name: "trantaxtotal" }),
                        search.createColumn({
                            name: "internalid",
                            join: "item"
                        })

                    ]
                })
                let results = utilsLib.getAllSearchResults(getPadlockItemSearch)
                let otherItemDetails = {}
                let otherItems = []
                results.forEach((result) => {
                    let salesOrderId = result.getValue({ name: 'internalid' })
                    let storageUnitNumber = result.getValue({ name: 'custcol_dsc_storage_unit' })
                    let taxAmount = result.getValue({ name: 'trantaxtotal' })
                    let amount = result.getValue({ name: 'amount' })
                    let itemId = result.getValue({ name: 'internalid', join: 'item' })


                    otherItemDetails = {
                        salesOrderId,
                        itemId,
                        storageUnitNumber,
                        amount,
                        taxAmount
                    }
                    otherItems.push(otherItemDetails)

                })
                return {
                    otherItems
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const getSecurityDeposit = (salesOrderRef) => {
            const title = "getSecurityDeposit ::"
            try {
                let securityDepositAmountSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", salesOrderRef],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["item.internalid", "anyof", constantsLib.SECURITY_DEPOSIT_ID]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custcol_dsc_storage_unit" }),
                        search.createColumn({ name: "amount" }),
                        search.createColumn({ name: "trantaxtotal" }),
                        search.createColumn({
                            name: "internalid",
                            join: "item"
                        })

                    ]
                })
                let results = utilsLib.getAllSearchResults(securityDepositAmountSearch)
                let otherItemDetails = {}
                let securityDepositItem = []
                results.forEach((result) => {
                    let salesOrderId = result.getValue({ name: 'internalid' })
                    let storageUnitNumber = result.getValue({ name: 'custcol_dsc_storage_unit' })
                    let taxAmount = result.getValue({ name: 'trantaxtotal' })
                    let amount = result.getValue({ name: 'amount' })
                    let itemId = result.getValue({ name: 'internalid', join: 'item' })


                    otherItemDetails = {
                        salesOrderId,
                        itemId,
                        storageUnitNumber,
                        amount,
                        taxAmount
                    }
                    securityDepositItem.push(otherItemDetails)

                })
                return {
                    securityDepositItem
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }


        const vatDetails = (salesOrderRef, packingItem) => {
            const title = "salesOrderDetails ::"
            try {
                let salesOrderDetailsSearch = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["internalid", "anyof", salesOrderRef]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "taxtotal", label: "Amount (Transaction Tax Total)" }),
                            search.createColumn({ name: "total", label: "Amount (Transaction Total)" }),
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({ name: "taxamount", label: "Tax Amount" })
                        ]
                })

                let results = utilsLib.getAllSearchResults(salesOrderDetailsSearch)
                let details = {}
                let lateFeeAmount = 0;

                results.forEach((result) => {
                    let itemId = result.getValue({ name: 'item' });
                    let itemTaxAmount = result.getValue({ name: 'taxamount' }) || 0;
                    const totalTaxAmount = result.getValue({ name: 'taxtotal' });

                    log.debug(title + "itemId : itemTaxAmount", itemId + " : " + itemTaxAmount)
                    const packingItemtaxAmount = packingItem.reduce((acc, item) => acc + item.taxrateAmount, 0);
                    if(itemId == '8'){

                        lateFeeAmount = parseFloat(itemTaxAmount);

                    }
                    const vatAmount = totalTaxAmount - packingItemtaxAmount - lateFeeAmount || 0;

                   

                    details = {
                        vatAmount
                    }
                })
                //log.debug({ title: title + 'details', details: details })
                return details
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const sumOfLeaseAgreementDetails = (renewalArr) => {
            const title = "sumOfLeaseAgreementDetails ::"
            try {
                let totalSum = []
                let totalSumDetails = {}


                let totalLeaseAmount = 0
                let totalAmount = 0
                let totalCustomerDeposit = 0
                let totalVatAmount = 0

                if (renewalArr.length > 0) {
                    renewalArr.forEach((renewalValues) => {
                        let renewalValuesLeaseAmount = Number(renewalValues?.leaseAmount) || 0
                        let renewalValuesTotalAmount = Number(renewalValues?.totalAmount) || 0
                        let renewalValuesCustomerDeposit = Number(renewalValues?.customerDeposit) || 0
                        let renewalValuesVatAmount = Number(renewalValues?.vatAmount) || 0
                        totalLeaseAmount = Number(totalLeaseAmount) + renewalValuesLeaseAmount
                        totalAmount = Number(totalAmount) + renewalValuesTotalAmount
                        totalCustomerDeposit = renewalValuesCustomerDeposit
                        totalVatAmount = Number(totalVatAmount) + renewalValuesVatAmount

                        totalSumDetails = {
                            totalLeaseAmount: totalLeaseAmount || 0,
                            totalAmount: totalAmount || 0,
                            totalCustomerDeposit: totalCustomerDeposit || 0,
                            totalVatAmount: totalVatAmount || 0
                        }
                    })
                } else {
                    totalSumDetails = {
                        totalLeaseAmount: totalLeaseAmount || 0,
                        totalAmount: totalAmount || 0,
                        totalCustomerDeposit: totalCustomerDeposit || 0,
                        totalVatAmount: totalVatAmount || 0
                    }
                }
                totalSum.push(totalSumDetails)
                return totalSum
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }


        const totalAgreementAmount = (standardArr, totalSum, lateChargesTotal) => {
            const title = "totalAgreementAmount :: ";
            try {
                log.debug({ title: title + 'standardArr', details: standardArr });
                log.debug({ title: title + 'totalSum', details: totalSum });

                let totalAgreementAmountArr = [];
                let totalAgreementAmountDetails = {};

                const leaseAmountSum = standardArr.reduce((acc, item) => acc + parseFloat(item.leaseAmount) || 0, 0);
                const totalLeaseAmountSum = totalSum.reduce((acc, item) => acc + parseFloat(item.totalLeaseAmount) || 0, 0);

                const securityDepositSumStandardArr = standardArr.reduce((acc, item) => acc + parseFloat(item.securityDeposit) || 0, 0);

                // const totalCustomerDepositSum = totalSum.reduce((acc, item) => acc + parseFloat(item.totalCustomerDeposit) || 0, 0);

                const totalAmountSumStandardArr = standardArr.reduce((acc, item) => acc + parseFloat(item.totalAmount) || 0, 0);
                log.debug({
                    title: title + 'totalAmountSumStandardArr',
                    details: totalAmountSumStandardArr
                });
                

                const totalAmountSumStandardArrWithOutSecurityDeposit = totalAmountSumStandardArr - securityDepositSumStandardArr;

                

                const totalAmountSumTotalSum = totalSum.reduce((acc, item) => acc + parseFloat(item.totalAmount) || 0, 0);

                const taxAmountStandardArr = standardArr.reduce((acc, item) => acc + parseFloat(item.vatAmount) || 0, 0);
                const taxAmountTotalSum = totalSum.reduce((acc, item) => acc + parseFloat(item.totalVatAmount) || 0, 0);

                log.debug({
                    title: title + 'totalAmountSumStandardArrWithOutSecurityDeposit',
                    details: totalAmountSumStandardArrWithOutSecurityDeposit
                });
                log.debug({
                    title: title + 'totalAmountSumTotalSum',
                    details: totalAmountSumTotalSum
                });
                log.debug({
                    title: title + 'securityDepositSumStandardArr',
                    details: securityDepositSumStandardArr
                });

                const totalAgreementAmount = (+totalAmountSumStandardArrWithOutSecurityDeposit + +totalAmountSumTotalSum + +securityDepositSumStandardArr) || 0;
                const totalCustomerDeposit = securityDepositSumStandardArr || 0;
                const totalLeaseAmount = (leaseAmountSum + totalLeaseAmountSum) || 0;
                const totalTaxAmount = (Number(taxAmountStandardArr) + Number(taxAmountTotalSum)) || 0;

                const packingChargesValueStandardArr = standardArr.reduce((acc, item) => acc + parseFloat(item.packingCharges) || 0, 0);
                const totalExcessAmount = 0; //need to get this value
                let totalAmountCollected = parseFloat(totalAgreementAmount) + parseFloat(lateChargesTotal);

              

    
                log.debug({
                    title: title + 'totalAgreementAmount',
                    details: totalAgreementAmount
                });
                log.debug({
                    title: title + 'totalAmountCollected',
                    details: totalAmountCollected
                });

                totalAgreementAmountDetails = {
                    totalAgreementAmount: totalAgreementAmount.toFixed(2),
                    totalCustomerDeposit: totalCustomerDeposit.toFixed(2),
                    totalLeaseAmount: totalLeaseAmount.toFixed(2),
                    totalTaxAmount: totalTaxAmount.toFixed(2),
                    totalAmountCollected: totalAmountCollected.toFixed(2),
                    totalSecurityDeposit: securityDepositSumStandardArr.toFixed(2)
                };
                totalAgreementAmountArr.push(totalAgreementAmountDetails);

                return totalAgreementAmountArr;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        };


        const getCreditMemoDetails = (checkoutAgreementNo) => {
            const title = "getCreditMemo ::"
            try {
                let totalCreditMemoAmount = 0
                let creditMemoSearch = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", "CustCred"],
                            "AND",
                            ["custbody_dsc_deposit_contract", "anyof", checkoutAgreementNo],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "entity", label: "Name" }),
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "total", label: "Amount (Transaction Total)" })
                        ]
                });

                let results = utilsLib.getAllSearchResults(creditMemoSearch)
                results.forEach((res) => {
                    let creditAmount = res.getValue({ name: 'total' })  //creditAmount will be negative here always.
                    creditAmount = Number(creditAmount) || 0;
                    totalCreditMemoAmount = parseFloat(totalCreditMemoAmount - creditAmount).toFixed(2)
                })
                log.debug({
                    title: title + 'totalCreditMemoAmount',
                    details: totalCreditMemoAmount
                })
                return totalCreditMemoAmount;

            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }


        const getLateChargesDetails = (checkoutAgreementNo) => {
            const title = "getLateChargesDetails ::"

            log.debug('checkoutAgreementNo :: BBBBB', checkoutAgreementNo)
            try {
                let detailsObj = {}
                let lateChargesDetailsSearchObj = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["custbody_dsc_so_parent_contract", "anyof", checkoutAgreementNo],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["shipping", "is", "F"],
                            "AND",
                            ["cogs", "is", "F"],
                            "AND",
                            ["item.internalid", "anyof", '8']
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "invoicenum", label: "Invoice Number" }),
                            search.createColumn({ name: "custbody_dsc_contract_line", label: "Contract Number" }),
                            search.createColumn({ name: "custbody_dsc_so_parent_contract", label: "Parent Contract" }),
                            search.createColumn({ name: "total", label: "Amount (Transaction Total)" }),
                            search.createColumn({ name: "taxtotal", label: "Amount (Transaction Tax Total)" }),
                            search.createColumn({ name: "custbody_dsc_late_checkout_penalty", label: "Late Checkout Penalty" }),
                            search.createColumn({ name: "custbody_dsc_late_renewal_penalty", label: "Late Renewal Penalty" }),
                            search.createColumn({ name: "amount", label: "Amount" }),
                            search.createColumn({ name: "taxamount", label: "Tax Amount" })
                        ]
                });
                let results = utilsLib.getAllSearchResults(lateChargesDetailsSearchObj)
                results.forEach((details) => {
                    let invoiceId = details.getValue({ name: 'internalid' })
                    let invoiceNumber = details.getValue({ name: 'invoicenum' })
                    let parentContract = details.getValue({ name: 'custbody_dsc_so_parent_contract' })
                    let total = details.getValue({ name: 'total' })
                    let isLateCheckoutPenalty = details.getValue({ name: 'custbody_dsc_late_checkout_penalty' })
                    let isLateRenewalPenalty = details.getValue({ name: 'custbody_dsc_late_renewal_penalty' })
                    let amount = details.getValue({ name: 'amount' }) || 0;
                    let taxAmount = details.getValue({ name: 'taxamount' }) || 0;

                    detailsObj = {
                        invoiceId,
                        invoiceNumber,
                        parentContract,
                        total,
                        amount,
                        taxAmount,
                        isLateCheckoutPenalty,
                        isLateRenewalPenalty
                    }
                })

                log.debug(title + 'detailsObj', detailsObj);

                return {
                    amount: detailsObj?.amount,
                    taxAmount: detailsObj?.taxAmount

                }

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