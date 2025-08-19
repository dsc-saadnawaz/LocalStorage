/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/serverWidget', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/search', 'N/ui/message', 'N/file'],
    (record, serverWidget, utilsLib, constantsLib, search, message, file) => {
        const onRequest = context => {
            const title = " onRequest() ";
            log.debug(title, "<--------------- SUITELET SCRIPT - START --------------->");
            const request = context.request;
            const response = context.response;
            try {
                let contractLineDataObj;
                let contractUniqueKey;
                const parentContractId = request.parameters && request.parameters.parentContractId ? request.parameters.parentContractId : "";
                if (parentContractId) {
                    const contractSearchLookup = search.lookupFields({
                        type: constantsLib.RECORD_TYPES.CONTRACT,
                        id: parentContractId,
                        columns: ['custrecord_dsc_cf_email_unique_key']
                    });
                    contractUniqueKey = contractSearchLookup.custrecord_dsc_cf_email_unique_key ? contractSearchLookup.custrecord_dsc_cf_email_unique_key : "";

                }
                const emailUniqueKey = request.parameters && request.parameters.uniqueKey ? request.parameters.uniqueKey : "";
                if (request.method == "GET") {
                    if (parentContractId && emailUniqueKey) {
                        // const contractSearchLookup = search.lookupFields({
                        //     type: constantsLib.RECORD_TYPES.CONTRACT,
                        //     id: parentContractId,
                        //     columns: ['custrecord_dsc_cf_email_unique_key']
                        // });
                        // let contractUniqueKey = contractSearchLookup.custrecord_dsc_cf_email_unique_key ? contractSearchLookup.custrecord_dsc_cf_email_unique_key : "";
                        if (!contractUniqueKey) {
                            let messageObj = null;
                            messageObj = message.create({
                                title: 'Success',
                                message: `Your Renewal Request already submitted.`,
                                type: message.Type.WARNING,
                                // duration: 20000
                            })
                            const form = alreadySubmittedForm(messageObj);
                            response.writePage({
                                pageObject: form
                            })
                            return;
                        }
                        let existingContractLineData = getContractLines(parentContractId);
                        log.debug('existingContractLineData', existingContractLineData)
                        if (existingContractLineData && existingContractLineData.contractLine && existingContractLineData.contractLineEndDate) {
                            let existingContractLineId = existingContractLineData.contractLine;
                            // const existingContractLineId = request.parameters && request.parameters.previousContractLineId ? request.parameters.previousContractLineId : "";

                            // const contractEndDateTime = request.parameters && request.parameters.contractLineEndDateTime ? request.parameters.contractLineEndDateTime : "";

                            // log.debug(title+"contractEndDateTime", contractEndDateTime);

                            // if (contractEndDateTime){
                            //     const endDateObj = new Date(contractEndDateTime);
                            //     const currentDateObj = new Date();
                            //     let remainingDays = utilsLib.getRemainingDays(currentDateObj, endDateObj);
                            //     log.debug(title+"endDateObj - currentDateObj = remainingDays", endDateObj+" - "+currentDateObj+" = "+remainingDays);
                            // }


                            let isComplete = false;
                            if (parentContractId && existingContractLineId) {
                                contractLineDataObj = getContractLineData(existingContractLineId);
                                let contractData = getContractData(parentContractId);
                                log.debug('contractData', contractData);
                                log.debug('contractLineDataObj', contractLineDataObj);
                                if (contractLineDataObj.endDateObj) {
                                    const currentDateObj = new Date();
                                    let remainingDays = utilsLib.getRemainingDays(currentDateObj, contractLineDataObj.endDateObj);
                                    log.debug(title + "remainingDays", remainingDays);
                                    if (remainingDays > 3) {
                                        const formObj = utilsLib.createExpiredLinkSlForm();
                                        response.writePage({
                                            pageObject: formObj
                                        });
                                        return;
                                    } else {

                                        ///load html form

                                        const htmlFile = file.load({
                                            id: parseInt(constantsLib.CONTRACT_RENEWAL_HTML_FORM)
                                        });
                                        let htmlContent = htmlFile.getContents();

                                        response.write(htmlContent);

                                        // let form = createForm(parentContractId, existingContractLineId, null, existingContractLineData.contractLineEndDate);
                                        // response.writePage({
                                        //     pageObject: form
                                        // })
                                    }
                                }

                            }
                        } else {
                            const formObj = utilsLib.createExpiredLinkSlForm();
                            response.writePage({
                                pageObject: formObj
                            });
                            return;
                        }
                    }
                } else {
                    let messageObj = null;

                    const body = JSON.parse(request.body);
                    const {
                        contractId,
                        actionType
                    } = body;

                    log.debug('body', body)
                    if (actionType == "GET_CONTRACT_DETAIL") {
                        const htmlContractId = contractId;
                        // log.debug('htmlContractId', htmlContractId)
                        if (htmlContractId) {
                            let getContractDetails = getContractData(htmlContractId);
                            // log.debug('getContractDetails',getContractDetails)
                            let calculateStartDate;
                            let existingContractLineData = getContractLines(htmlContractId);
                            if (existingContractLineData && existingContractLineData.contractLine && existingContractLineData.contractLineEndDate) {
                                let existingContractLineId = existingContractLineData.contractLine;
                                const endDateContent = existingContractLineData.contractLineEndDate.split("/");
                                const endDateDays = endDateContent[0];
                                const endDateMonthIndex = endDateContent[1] - 1;
                                const endDateYears = endDateContent[2];
                                let contractLineEndDateFormat = new Date(endDateYears, endDateMonthIndex, endDateDays);
                                log.debug('contractLineEndDateFormat', contractLineEndDateFormat)
                                // console.log('getDate', getDate)
                                if (contractLineEndDateFormat) {
                                    getContractDetails.calculateStartDate = new Date(contractLineEndDateFormat.setDate(contractLineEndDateFormat.getDate() + 1));
                                }
                                log.debug('getContractDetails', getContractDetails)
                            }
                            response.write(JSON.stringify({
                                stauts: 200,
                                data: getContractDetails,
                                message: 'Fetch Record'
                            }))
                        }

                    }
                    if (actionType == "SUBMIT_RENEWAL_REQUEST") {
                        let parentContractId = body.renewalContractId;

                        const contractSearchLookup = search.lookupFields({
                            type: constantsLib.RECORD_TYPES.CONTRACT,
                            id: parentContractId,
                            columns: ['custrecord_dsc_cf_email_unique_key']
                        });
                        let contractUniqueKey2 = contractSearchLookup.custrecord_dsc_cf_email_unique_key ? contractSearchLookup.custrecord_dsc_cf_email_unique_key : "";

                        let existingContractLineID;
                        let existingContractLineData = getContractLines(parentContractId);
                        if (existingContractLineData && existingContractLineData.contractLine) {
                            existingContractLineID = existingContractLineData.contractLine
                        }
                        let contractLineDuration = constantsLib.DURATION_VALUES[body.renewalMonths];
                        let formStartDate = new Date(body.renewalStartDate);
                        let contractStartDate = new Date(formStartDate.setDate(formStartDate.getDate() + 1))
                        // let existingContractLineID = request.parameters.custpage_parent_existing_contract_line_id;
                        let contractLinePaymentMode = constantsLib.PAYMENT_METHOD[body.selectedPaymentMethod] ///request.parameters.custpage_contract_line_payment_mode;
                        let storageUnitRate = Number(body.renewalAmount) //10 //request.parameters.custpage_contract_line_payment_mode;
                        if (parentContractId && contractLineDuration && contractStartDate && contractLinePaymentMode) {
                            let savedData = {}
                            log.debug('contractLinePaymentMode', contractLinePaymentMode);
                            if (emailUniqueKey && contractUniqueKey2 && parseInt(contractUniqueKey2) == parseInt(emailUniqueKey)) {
                                let createdContractLineRecord = createContractLine(parentContractId, contractLineDuration, contractStartDate, contractLinePaymentMode);
                                savedData.createdContractLineRecord = createdContractLineRecord;
                                log.debug('createdContractLineRecord', createdContractLineRecord);
                                if (createdContractLineRecord) {
                                    record.submitFields({
                                        type: constantsLib.RECORD_TYPES.CONTRACT,
                                        id: parseInt(parentContractId),
                                        values: {
                                            custrecord_dsc_cf_email_unique_key: ''
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                    record.submitFields({
                                        type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                                        id: parseInt(existingContractLineID),
                                        values: {
                                            custrecord_dsc_cn_renewal_generate: true
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                    if(existingContractLineData.contractLineSO && existingContractLineData.contractLineSO != "")
                                    {
                                        record.submitFields({
                                            type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                                            id: parseInt(existingContractLineID),
                                            values: {
                                                custrecord_dsc_clf_status: 2 // contract Line status closed
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });
                                    }
                                    let createdSalesOrderRecord = createSalesOrder(createdContractLineRecord, existingContractLineID, contractLinePaymentMode, parentContractId, storageUnitRate);
                                    log.debug('createdSalesOrderRecord', createdSalesOrderRecord);
                                    savedData.createdSalesOrderRecord = createdSalesOrderRecord;
                                    if (createdSalesOrderRecord) {
                                        response.write(JSON.stringify({
                                            stauts: 200,
                                            data: savedData,
                                            message: 'Submitted Request'
                                        }));
                                    }
                                    // if (!messageObj) {
                                    //     messageObj = message.create({
                                    //         title: 'Success',
                                    //         message: `We have Received your Renewal Request. We will inform you shortly`,
                                    //         type: message.Type.CONFIRMATION,
                                    //         // duration: 20000
                                    //     })
                                    //     isComplete = true;
                                    // }
                                    // // const form = createForm(parentContractId, existingContractLineID, messageObj, contractStartDate);
                                    // const form = savedForm(messageObj);

                                }
                            }

                        }
                        log.debug(title, "<--------------- SUITELET SCRIPT - END --------------->");
                    }
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }
        const createForm = (parentContractRecordId, existingContractLineId, messageObj, contractEndDate) => {
            const title = " createForm() ";
            try {
                let calculateStartDate
                const form = serverWidget.createForm({
                    title: 'Contract Renewal Process',
                    hideNavBar: true
                });
                if (contractEndDate) {
                    let getDate = formatNsDateStringToObject(contractEndDate)
                    // console.log('getDate', getDate)
                    if (getDate) {
                        calculateStartDate = new Date(getDate.setDate(getDate.getDate() + 1));
                    }
                }

                if (calculateStartDate) {
                    const contractStartDate = form.addField({
                        id: 'custpage_contract_start_date',
                        type: serverWidget.FieldType.DATE,
                        label: 'Start Date'
                    });
                    contractStartDate.isMandatory = true;
                    contractStartDate.updateLayoutType({
                        layoutType: serverWidget.FieldLayoutType.STARTROW
                    });
                    contractStartDate.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    })
                    contractStartDate.defaultValue = calculateStartDate;
                }
                const contractLineDuration = form.addField({
                    id: 'custpage_contract_line_duration',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Duration',
                    source: constantsLib.LIST_TYPES.CONTRACT_LINE_DURATION,
                });
                contractLineDuration.isMandatory = true;
                contractLineDuration.updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.STARTROW
                });

                const contractLinePaymentMode = form.addField({
                    id: 'custpage_contract_line_payment_mode',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Payment Mode',
                    source: 'paymentmethod',
                });
                contractLinePaymentMode.isMandatory = true;
                contractLinePaymentMode.updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.STARTROW
                });
                // contractLineDuration.updateBreakType({
                //     breakType: serverWidget.FieldBreakType.STARTCOL
                // })


                // contractStartDate.updateBreakType({
                //     breakType: serverWidget.FieldBreakType.STARTCOL
                // })


                let parentContractId = form.addField({
                    id: 'custpage_parent_contract_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Parent Contract'
                });

                parentContractId.defaultValue = parentContractRecordId;

                parentContractId.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                })

                let lineContractId = form.addField({
                    id: 'custpage_parent_existing_contract_line_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Parent Contract'
                });

                lineContractId.defaultValue = existingContractLineId;

                lineContractId.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                })

                // log.debug('isComplete', isComplete)
                // if (isComplete || isComplete == 'true') {

                //     const scriptField = form.addField({
                //         id: 'custpage_script_field',
                //         type: serverWidget.FieldType.INLINEHTML,
                //         label: 'Script Field'
                //     });

                //     scriptField.defaultValue = `<script>
                //             setTimeout(function() {
                //                 window.close();
                //                 // window.opener.location.reload();
                //             }, 3000)
                //     </script>`;
                //     // scriptField.updateDisplayType({
                //     //     displayType: serverWidget.FieldDisplayType.HIDDEN
                //     // })

                // }

                form.addSubmitButton({
                    label: 'Submit'
                });

                if (messageObj) {
                    form.addPageInitMessage({
                        message: messageObj
                    })
                }

                return form;

            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }
        const savedForm = (messageObj) => {
            let logTitle = " savedForm :  ";
            try {
                const formObj = serverWidget.createForm({
                    title: 'Renewal Request',
                    hideNavBar: true
                });
                const screenTextFldObj = formObj.addField({
                    id: 'custpage_contract_renewal_screen_text',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Screen Text',
                });
                screenTextFldObj.defaultValue = "<h2>Thanks for your Contract Renewal Request</h2>";
                if (messageObj) {
                    formObj.addPageInitMessage({
                        message: messageObj
                    })
                }
                return formObj;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }
        const alreadySubmittedForm = (messageObj) => {
            let logTitle = " alreadySubmittedForm :  ";
            try {
                const formObj = serverWidget.createForm({
                    title: 'Renewal Request Form',
                    hideNavBar: true
                });
                const screenTextFldObj = formObj.addField({
                    id: 'custpage_contract_renewal_submitted',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Screen Text',
                });
                screenTextFldObj.defaultValue = "<h2>Request Already Submitted</h2>";
                if (messageObj) {
                    formObj.addPageInitMessage({
                        message: messageObj
                    })
                }
                return formObj;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }
        const createContractLine = (parentContractId, contractLineDuration, contractStartDate, paymentMode) => {
            const title = " createContractLine() ";
            try {

                let contractLineRecord = record.create({
                    type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                    isDynamic: true
                })
                contractLineRecord.setValue('custrecord_dsc_clf_parent_contract', parentContractId);
                contractLineRecord.setValue('custrecord_dsc_clf_duration', contractLineDuration);
                contractLineRecord.setValue('custrecord_dsc_clf_payment_mode', paymentMode);
                contractLineRecord.setText('custrecord_dsc_clf_start_date', contractStartDate);
                contractLineRecord.setValue('custrecord_dsc_clf_contract_type', constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL);
                // contractLineRecord.setValue('custrecord_dsc_clf_status', constantsLib.FIELD_VALUES.CONTRACT_STATUS_OPEN);

                let createdRecordId = contractLineRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return createdRecordId;
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }

        const createSalesOrder = (newcontractLineId, existingContractLineId, contractLinePaymentMode, parentContractId, storageUnitRate) => {
            const title = " createContractLine() ";
            try {
                let contractLineDurationMonth;
                if (existingContractLineId) {
                    let searchObj = search.lookupFields({
                        type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                        id: parseInt(existingContractLineId),
                        columns: ['custrecord_dsc_clf_so_reference']
                    });
                    log.debug('searchObj', searchObj)
                    let contractLineSalesOrderRef = searchObj.custrecord_dsc_clf_so_reference && searchObj.custrecord_dsc_clf_so_reference[0] ? searchObj.custrecord_dsc_clf_so_reference[0].value : "";
                    if (contractLineSalesOrderRef) {

                        if (newcontractLineId) {
                            let searchLookUpObj = search.lookupFields({
                                type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                                id: parseInt(newcontractLineId),
                                columns: ['custrecord_dsc_clf_duration', 'custrecord_dsc_clf_start_date', 'custrecord_dsc_clf_payment_mode']
                            });
                            let contractLineDuration = searchLookUpObj?.custrecord_dsc_clf_duration[0]?.value;
                            contractLineDurationMonth = contractLineDuration ? constantsLib.DURATION_VALUES[contractLineDuration] : "";
                        }

                        let newSalesOrder = record.copy({
                            type: record.Type.SALES_ORDER,
                            id: parseInt(contractLineSalesOrderRef),
                            // isDynamic: true
                        });
                        newSalesOrder.setValue('custbody_dsc_contract_line', newcontractLineId);
                        newSalesOrder.setValue('trandate', new Date());
                        //set payment mode;
                        // newSalesOrder.setValue('paymentoption', contractLinePaymentMode);
                        // newSalesOrder.setValue('custbody_dsc_payment_method', contractLinePaymentMode);


                        //remove padlock and packing line item item 
                        let getLineCount = newSalesOrder.getLineCount({
                            sublistId: 'item'
                        })
                        for (let i = getLineCount - 1; i >= 0; i--) {
                            let itemId = newSalesOrder.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            })
                            if (itemId != constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                                newSalesOrder.removeLine({
                                    sublistId: 'item',
                                    line: i
                                });
                            }
                            if (itemId == constantsLib.LOCAL_STORAGE_UNIT_ITEM_ID) {
                                if (contractLineDurationMonth) {
                                    newSalesOrder.setSublistValue({
                                        sublistId: "item",
                                        fieldId: "quantity",
                                        line: i,
                                        value: contractLineDurationMonth
                                    })
                                }

                                //10-Feb-2025 ticket # LS-148 start
                                if (contractLineDurationMonth) {
                                    let rateValue = parseFloat(storageUnitRate) / parseFloat(contractLineDurationMonth);
                                        newSalesOrder.setSublistValue({
                                            sublistId: "item",
                                            fieldId: "rate",
                                            line: i,
                                            value: parseFloat(rateValue).toFixed(2)
                                        })
                                }
                                //10-Feb-2025 ticket # LS-148 end
                            }
                            // if (itemId == constantsLib.PADLOCK_ITEM_ID || itemId == constantsLib.PACKING_CHARGES_ITEM_ID) {
                            //     newSalesOrder.removeLine({
                            //         sublistId: 'item',
                            //         line: i
                            //     });
                            // }
                        }

                        let createdRecordId = newSalesOrder.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });

                        return createdRecordId;
                    }
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }

        const getContractLineData = contractLineId => {
            const title = " getContractLineData() ";
            try {
                const dataObj = {};
                const contractLineSearchLookup = search.lookupFields({
                    type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                    id: contractLineId,
                    columns: ['custrecord_dsc_clf_end_date']
                });
                // log.debug(title + "contractLineSearchLookup", contractLineSearchLookup);
                if (contractLineSearchLookup.custrecord_dsc_clf_end_date) {
                    const endDateContent = contractLineSearchLookup.custrecord_dsc_clf_end_date.split("/");
                    const endDateDays = endDateContent[0];
                    const endDateMonthIndex = endDateContent[1] - 1;
                    const endDateYears = endDateContent[2];
                    dataObj.endDateObj = new Date(endDateYears, endDateMonthIndex, endDateDays);
                }
                return dataObj;
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }
        const getContractData = (contractId) => {
            const title = " getContractData() ";
            try {
                var contractSearchObj = search.create({
                    type: "customrecord_dsc_contract",
                    filters: [
                        ["internalid", "anyof", contractId]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "ID"
                        }),
                        search.createColumn({
                            name: "name",
                            label: "ID"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_cf_customer",
                            label: "Customer"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_cf_status",
                            label: "Status"
                        }),
                        // search.createColumn({
                        //     name: "custrecord_dsc_cf_customer_deposit",
                        //     label: "Customer Deposit"
                        // }),
                        search.createColumn({
                            name: "custrecord_dsc_cf_storage_unit",
                            label: "Storage Unit"
                        }),
                        search.createColumn({
                            name: "email",
                            join: "CUSTRECORD_DSC_CF_CUSTOMER",
                            label: "Email"
                        }),
                        search.createColumn({
                            name: "custentity_dsc_mobileno",
                            join: "CUSTRECORD_DSC_CF_CUSTOMER",
                            label: "Mobile Phone"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_unit_price",
                            join: "CUSTRECORD_DSC_CF_STORAGE_UNIT",
                            label: "Storage Unit Price "
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_length_m",
                            join: "CUSTRECORD_DSC_CF_STORAGE_UNIT",
                            label: "Length (m)"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_width_m",
                            join: "CUSTRECORD_DSC_CF_STORAGE_UNIT",
                            label: "Width (m)"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_height_m",
                            join: "CUSTRECORD_DSC_CF_STORAGE_UNIT",
                            label: "Height (m)"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_suf_storage_type",
                            join: "CUSTRECORD_DSC_CF_STORAGE_UNIT",
                            label: "Unit Type"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_area_square_feet",
                            join: "CUSTRECORD_DSC_CF_STORAGE_UNIT",
                            label: "Storage Area"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_unit_area_open_space",
                            join: "CUSTRECORD_DSC_CF_STORAGE_UNIT",
                            label: "Open Space Area"
                        })
                    ]
                });
                const searchResults = contractSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                // console.log('searchResults', searchResults)
                let contractSearchDataObj = {}
                if (searchResults && searchResults.length > 0) {
                    contractSearchDataObj.contractId = searchResults[0].getValue(({
                        name: 'internalid'
                    }));
                    contractSearchDataObj.contractName = searchResults[0].getValue(({
                        name: 'name'
                    }));
                    contractSearchDataObj.contractCustomerId = searchResults[0].getValue(({
                        name: 'custrecord_dsc_cf_customer'
                    }));
                    contractSearchDataObj.contractCustomerName = searchResults[0].getText(({
                        name: 'custrecord_dsc_cf_customer'
                    }));
                    contractSearchDataObj.contractCustomerPhone = searchResults[0].getValue(({
                        name: "custentity_dsc_mobileno",
                        join: "CUSTRECORD_DSC_CF_CUSTOMER",
                    }));
                    contractSearchDataObj.contractCustomerEmail = searchResults[0].getValue(({
                        name: "email",
                        join: "CUSTRECORD_DSC_CF_CUSTOMER",
                    }));
                    contractSearchDataObj.contractStorageUnitId = searchResults[0].getValue(({
                        name: 'custrecord_dsc_cf_storage_unit'
                    }));
                    contractSearchDataObj.contractStorageUnitName = searchResults[0].getText(({
                        name: 'custrecord_dsc_cf_storage_unit'
                    }));
                    contractSearchDataObj.contractStorageUnitPrice = searchResults[0].getValue(({
                        name: "custrecord_dsc_suf_storage_unit_price",
                        join: "CUSTRECORD_DSC_CF_STORAGE_UNIT",
                    }));
                    contractSearchDataObj.contractStorageUnitLength = searchResults[0].getValue(({
                        name: "custrecord_dsc_suf_length_m",
                        join: "CUSTRECORD_DSC_CF_STORAGE_UNIT",
                    }));
                    contractSearchDataObj.contractStorageUnitWidth = searchResults[0].getValue(({
                        name: 'custrecord_dsc_suf_storage_width_m',
                        join: "CUSTRECORD_DSC_CF_STORAGE_UNIT"
                    }));
                    contractSearchDataObj.contractStorageUnitHeight = searchResults[0].getValue(({
                        name: 'custrecord_dsc_suf_storage_height_m',
                        join: "CUSTRECORD_DSC_CF_STORAGE_UNIT"
                    }));
                    //10-Feb-2025 ticket # LS-148 start
                    contractSearchDataObj.contractStorageType = searchResults[0].getValue(({
                        name: 'custrecord_dsc_suf_storage_type',
                        join: "CUSTRECORD_DSC_CF_STORAGE_UNIT"
                    }));
                    contractSearchDataObj.contractStorageTypeArea = searchResults[0].getValue(({
                        name: 'custrecord_dsc_area_square_feet',
                        join: "CUSTRECORD_DSC_CF_STORAGE_UNIT"
                    }));
                    contractSearchDataObj.contractStorageOpenSpace = searchResults[0].getValue(({
                        name: 'custrecord_dsc_unit_area_open_space',
                        join: "CUSTRECORD_DSC_CF_STORAGE_UNIT"
                    }));
                    //10-Feb-2025 ticket # LS-148 end
                    return contractSearchDataObj;
                } else {
                    return '';
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }
        const getContractLines = (contractId) => {
            const logTitle = " getContractLines() ";
            try {
                let contractLineStatus = constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_CLOSED;
                var contractLineSearchObj = search.create({
                    type: "customrecord_dsc_contract_line",
                    filters: [
                        ["custrecord_dsc_clf_parent_contract", "anyof", contractId],
                        "AND",
                        ["custrecord_dsc_clf_status", "noneof", contractLineStatus]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID",
                            sort: search.Sort.DESC
                        }),
                        search.createColumn({
                            name: "name",
                            label: "ID"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_parent_contract",
                            label: "Parent Contract"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_status",
                            label: "Status"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_so_reference",
                            label: "Sales Order Reference"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_end_date",
                            label: "End Date"
                        }),
                        search.createColumn({
                            name: "custrecord_dsc_clf_start_date",
                            label: "Start Date"
                        })

                    ]
                });
                const searchResults = contractLineSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                // console.log('searchResults', searchResults)
                let contractLinesObj = {}
                if (searchResults && searchResults.length > 0) {
                    contractLinesObj.contractLine = searchResults[0].getValue(({
                        name: 'internalid'
                    }));
                    contractLinesObj.contractLineSO = searchResults[0].getValue(({
                        name: 'custrecord_dsc_clf_so_reference'
                    }));
                    contractLinesObj.contractLineEndDate = searchResults[0].getValue(({
                        name: 'custrecord_dsc_clf_end_date'
                    }));
                    return contractLinesObj;
                } else {
                    return '';
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                console.log("ERROR IN" + logTitle, error);
            }
        }
        const formatNsDateStringToObject = (nsDateString) => {
            const logTitle = " formatNsDateStringToObject() ";
            try {
                const nsDateContent = nsDateString.split("/");
                const nsDateDays = nsDateContent[0];
                const nsDateMonthIndex = nsDateContent[1] - 1;
                const nsDateYears = nsDateContent[2];
                let dateObj = new Date(nsDateYears, nsDateMonthIndex, nsDateDays);
                // console.log(logTitle + ' dateObj', dateObj)
                return dateObj;
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error;
            }
        }
        return {
            onRequest
        }
    }
);