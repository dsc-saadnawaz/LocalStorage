/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/format', 'N/email', 'N/config', 'N/url'],

    (record, search, utilsLib, constantsLib, format, email, config, url) => {

        const getInputData = (context) => {
            const title = "getInputData ::";
            try {
                let contractSalesOrderIds = []
                let contractSearchResults = searchContracts();
                let contractDetails = {};
                contractSearchResults.forEach((contract) => {
                    let salesOrderReferenceId = contract.getValue({
                        name: "custrecord_dsc_clf_so_reference",
                        join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                    }) || '';

                    if (salesOrderReferenceId) {
                        contractSalesOrderIds.push(salesOrderReferenceId);
                    }
                });
                const salesOrdeMapObj = contractSalesOrderIds?.length > 0 ? getSalesOrderMapping(contractSalesOrderIds) : {};
                let { companyEmail } = getCompanyInformation() // getting company info.
                let contractRenewalLink = getSuiteletUrl()
                log.debug({ title: title + 'contractRenewalLink 2', details: contractRenewalLink});
                log.debug({ title: title + 'salesOrdeMapObj', details: salesOrdeMapObj});

                contractSearchResults.forEach((contract) => {
                    let parentContractId = contract.getValue({ name: 'internalid' });
                    let storageUnitName = contract.getText({ name: 'custrecord_dsc_cf_storage_unit' }); //10-Feb-2025 ticket # LS-148 
                    let customerId = contract.getValue({ name: 'custrecord_dsc_cf_customer' });
                    let customerName = contract.getText({ name: 'custrecord_dsc_cf_customer' });  //add in placeholder value
                    let startDate = contract.getValue({
                        name: "custrecord_dsc_clf_start_date",
                        join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT"
                    }) || '';
                    let endDate = contract.getValue({
                        name: 'custrecord_dsc_clf_end_date',
                        join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT"
                    }) || '';
                    let contractLineId = contract.getValue({
                        name: 'internalid',
                        join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT"
                    }) || '';
                    let salesOrderReferenceId = contract.getValue({
                        name: "custrecord_dsc_clf_so_reference",
                        join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                    }) || '';
                    let contractNumber = contract.getValue({
                        name: "name"
                    })

                    const contractSalesOrderData = salesOrdeMapObj[salesOrderReferenceId]
                    if (!contractDetails[customerId]) {
                        contractDetails[customerId] = []
                    }

                    if (endDate && contractLineId) {
                        contractDetails[customerId].push({
                            storageUnitName, //10-Feb-2025 ticket # LS-148 
                            parentContractId,
                            customerId,
                            customerName,
                            startDate,
                            endDate,
                            contractLineId,
                            contractSalesOrderData,
                            contractNumber,
                            companyEmail,
                            contractRenewalLink
                        });
                    }
                });
                log.debug({ title: title + 'contractDetails 1', details: contractDetails});

                return contractDetails;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        };

        const map = (context) => {
            const title = "map ::";
            try {
                const expiryDates = constantsLib.CONTACT_EXPIRATION_DATES;
                let customerEmailDataArray = JSON.parse(context.value);
                const currentDate = new Date();
                // log.debug({ title: title + 'currentDate :: currentDate.getDate()/currentDate.getMonth()', details: currentDate + " :: " + currentDate.getDate() + "/" + currentDate.getMonth() });
                customerEmailDataArray.forEach((emailDataObj) => {
                    const endDate = utilsLib.formatNsDateStringToObject(emailDataObj.endDate);
                    let remainingDays = utilsLib.getRemainingDays(endDate, currentDate);
                    // remainingDays = 10; //harded coded please remove it once you are done testing
                    if (remainingDays != null) {
                        for (let expiryDay in expiryDates) {
                            if (remainingDays == expiryDates[expiryDay]) {
                                let emailTemplateDataObj = emailRecord()
                                sendRenewalEmailAlert(emailDataObj, emailTemplateDataObj)
                                break;
                            }
                        }
                    }

                });
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        };

        const searchContracts = () => {
            const title = "searchContracts ::";
            try {
                let contractSearch = search.create({
                    type: 'customrecord_dsc_contract',
                    filters: [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_dsc_cf_status", 'noneof', [constantsLib.FIELD_VALUES.CONTRACT_STATUS_CLOSED]],
                        "AND",
                        ["custrecord_dsc_clf_parent_contract.custrecord_dsc_clf_status", "noneof", [constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_CLOSED]],
                        "AND", 
                        [["custrecord_dsc_clf_parent_contract.custrecord_dsc_clf_end_date","onorbefore","daysfromnow10"],"AND",["custrecord_dsc_clf_parent_contract.custrecord_dsc_clf_end_date","after","today"]], 
                        "AND", 
                        ["custrecord_dsc_clf_parent_contract.custrecord_dsc_clf_so_reference","noneof","@NONE@"],
                        "AND", 
                        ["custrecord_dsc_clf_parent_contract.custrecord_dsc_cn_renewal_generate", "is", "F"]
                    ],
                    columns:
                        [
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({ name: "name" }),
                            search.createColumn({ name: "custrecord_dsc_cf_customer", label: "Customer" }),
                            search.createColumn({ name: "custrecord_dsc_cf_storage_unit", label: "Storage Unit" }), //10-Feb-2025 ticket # LS-148
                            search.createColumn({ name: "custrecord_dsc_cf_status", label: "Status" }),
                            search.createColumn({
                                name: "custrecord_dsc_clf_start_date",
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
                                name: "internalid",
                                join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                            }),
                            search.createColumn({
                                name: "name",
                                join: "CUSTRECORD_DSC_CLF_PARENT_CONTRACT",
                                label: "ID"
                            })
                        ]
                });
                return utilsLib.getAllSearchResults(contractSearch);
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
                return [];
            }
        };

        const getSalesOrderMapping = (contractSalesOrderIds) => {
            const logTitle = "getSalesOrderMapping"
            try {
                let salesOrderSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", contractSalesOrderIds],
                        "AND",
                        ["mainline", "is", ['F']],
                        "AND",
                        ["cogs", "is", ['F']],
                        "AND",
                        ["taxline", "is", ['F']],
                        "AND",
                        ["shipping", "is", ['F']],
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'location' }),
                        search.createColumn({ name: 'locationnohierarchy' }),
                        search.createColumn({ name: 'custcol_dsc_storage_unit' })
                    ]
                })
                let soSearchResults = utilsLib.getAllSearchResults(salesOrderSearch);
                log.debug(logTitle+"soSearchResults", soSearchResults);
                let salesOrderDataObj = {};
                soSearchResults.forEach((salesOrder) => {
                    let salesOrderId = salesOrder.getValue({ name: 'internalid' });
                    const locationId = salesOrder.getValue({ name: 'location' });
                    let location = salesOrder.getText({ name: 'location' });
                    let storageUnitId = salesOrder.getValue({ name: 'custcol_dsc_storage_unit' });
                    let storageUnit = salesOrder.getText({ name: 'custcol_dsc_storage_unit' });
                    salesOrderDataObj[salesOrderId] = { 
                        locationId,
                        location,
                        storageUnitId,
                        storageUnit
                    };
                })
                return salesOrderDataObj
            } catch (error) {
                log.error("ERROR IN"+logTitle, error);
            }
        }
        const emailRecord = () => {
            const title = "emailRecord :: "
            try {
                let emailRecordObj = record.load({
                    type: record.Type.EMAIL_TEMPLATE,
                    id: constantsLib.EMAIL_TEMPLATES.RENEWAL_ALERT_EMAIL_TEMPLATE_ID
                })
                let subject = emailRecordObj.getValue({ fieldId: 'subject' })
                let content = emailRecordObj.getValue({ fieldId: 'content' })

                return { subject, content }

            } catch (error) {
                log.error({ title: title + 'error', details: error });
            }
        }

        const sendRenewalEmailAlert = (emailDataObj, emailTemplateDataObj) => {
            const title = " sendRenewalEmailAlert ::";
            try {
                let authorId = constantsLib.EMAIL_AUTHOR_ID
                // let { companyEmail } = getCompanyInformation() // put it inside getinputdata function 

                let emailContent = emailTemplateDataObj.content;
                log.debug({ title: title + 'emailDataObj', details: emailDataObj});
                emailContent = emailContent.replace('{{customerName}}', emailDataObj.customerName);
                emailContent = emailContent.replace('{{startDate}}', emailDataObj.startDate);
                emailContent = emailContent.replace('{{expiryDate}}', emailDataObj.endDate);
                // emailContent = emailContent.replace('{{contractLineId}}', emailDataObj.contractLineId);
                emailContent = emailContent.replace('{{contractNumber}}', emailDataObj.contractNumber);
                emailContent = emailContent.replace('{{companyEmail}}', "saqib@localstorage.ae; aadil@localstorage.ae; rolly@localstorage.ae")//emailDataObj.companyEmail);
                emailContent = emailContent.replace('{{companyPhone}}', '+971 529 911 111');
                let uniqueKey = new Date().getTime();
                const contractRenewalLink = emailDataObj.contractRenewalLink + "&parentContractId=" + emailDataObj.parentContractId +"&uniqueKey=" + uniqueKey;
                emailContent = emailContent.replace('{{contractRenewalLink}}', contractRenewalLink);
                
                if (emailDataObj.contractSalesOrderData) {
                    emailContent = emailContent.replace('{{locationName}}', emailDataObj.contractSalesOrderData.location);
                    emailContent = emailContent.replace('{{storageUnitNumber}}', emailDataObj.storageUnitName); //10-Feb-2025 ticket # LS-148 
                }

                email.send({    
                    author: authorId,
                    recipients: emailDataObj.customerId,
                    cc : [1610,1611,1322,1321],//["saqib@localstorage.ae", "rolly@localstorage.ae", "zakievnail@gmail.com","aadil@localstorage.ae","renewalalert@localstorage.ae"],
                    subject: emailTemplateDataObj.subject,
                    body: emailContent,
                    relatedRecords: {
                        entityId: emailDataObj.customerId,
                        customRecord: {
                            id: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                            recordType: emailDataObj.contractLineId
                        }
                    }
                });
                if (emailDataObj.parentContractId) {
                    record.submitFields({
                        type: constantsLib.RECORD_TYPES.CONTRACT,
                        id: parseInt(emailDataObj.parentContractId),
                        values: {
                            custrecord_dsc_cf_email_unique_key: uniqueKey.toString()
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                }
                log.debug({ title: title + 'email', details: 'email has been send ' });
            } catch (error) {
                log.error({ title: title + 'error', details: error });
            }
        };

        const getCompanyInformation = () => {
            const title = "getCompanyInformation ::"
            try {
                let companyDetailsObj = {}
                const info = config.load({ type: config.Type.COMPANY_INFORMATION });
                companyDetailsObj.companyEmail = info.getValue({ fieldId: 'email' })
                return companyDetailsObj
            } catch (error) {
                log.error({ title: title + 'error', details: error })
            }
        }

        const getSuiteletUrl = () => { 
            const title = "getSuiteletUrl ::"
            try {
                let contractRenewalLink = url.resolveScript({
                    scriptId: constantsLib.SUITELET_SCRIPTS.CONTRACT_RENEWAL_PROCESS.SCRIPT_ID,
                    deploymentId: constantsLib.SUITELET_SCRIPTS.CONTRACT_RENEWAL_PROCESS.DEPLOY_ID,
                    returnExternalUrl: true
                });
                log.debug({ title: title + 'contractRenewalLink:: 1', details: contractRenewalLink });

                return contractRenewalLink
            } catch (error) {
                log.error({ title: title + 'error', details: error });

            }
        }

        return { getInputData, map };

    });
