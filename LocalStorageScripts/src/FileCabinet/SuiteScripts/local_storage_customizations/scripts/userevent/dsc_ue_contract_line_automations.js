/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js','N/format'],
    (record, search, n_error, utilsLib, constantsLib,format) => {
        const beforeSubmit = context => {
            const logTitle = " beforeSubmit() ";
            try {
                const recObj = context.newRecord;
                const parentContractId = recObj.getValue("custrecord_dsc_clf_parent_contract");
                const contractStartDate = recObj.getValue("custrecord_dsc_clf_start_date");
                if (parentContractId) {
                    const contractSearchLookup = search.lookupFields({
                        type: constantsLib.RECORD_TYPES.CONTRACT,
                        id: parentContractId,
                        columns: ['custrecord_dsc_cf_status']
                    });
                    log.debug(logTitle + "contractSearchLookup", contractSearchLookup);
                    const parentContractStatusId = contractSearchLookup?.custrecord_dsc_cf_status?.[0]?.value;
                    log.debug(logTitle + "parentContractStatusId", parentContractStatusId);
                    if ([constantsLib.FIELD_VALUES.CONTRACT_STATUS_CHECKOUT_IN_PROGRESS, constantsLib.FIELD_VALUES.CONTRACT_STATUS_CLOSED].includes(parentContractStatusId)) {
                        throw n_error.create({
                            name: 'DSC_UPDATING_CONTRACT_LINE_AFTER_CHECKOUT_ERROR',
                            message: 'Cannot create/update Contract Line record after initiating the checkout process.',
                            notifyOff: false
                        });
                    }
                }

                let sameDateContractExist = getSameDateContractNumbers(parentContractId,contractStartDate)
                if(sameDateContractExist)
                {
                    throw n_error.create({
                        name: 'CONTRACT_NUMBER_ERROR',
                        message: 'Contract Number Already Exist with that Date, Please change Contract Dates',
                        notifyOff: false
                    });
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
                throw error.message
            }
        }

        const afterSubmit = context => {
            const logTitle = "afterSubmit";
            try {
                const recObj = context.newRecord;
                let recordId = recObj.id;
                const parentContractId = recObj.getValue("custrecord_dsc_clf_parent_contract");
                const contractTypeId = recObj.getValue("custrecord_dsc_clf_contract_type");
                if (context.type == context.UserEventType.CREATE) {
                    if (parentContractId && contractTypeId == constantsLib.FIELD_VALUES.CONTRACT_TYPE_STANDARD) {
                        const contractSearchLookup = search.lookupFields({
                            type: constantsLib.RECORD_TYPES.CONTRACT,
                            id: parentContractId,
                            columns: ['custrecord_dsc_cf_status']
                        });
                        log.debug(logTitle + "contractSearchLookup", contractSearchLookup);
                        const parentContractStatusId = contractSearchLookup?.custrecord_dsc_cf_status?.[0]?.value;
                        if (parentContractStatusId == constantsLib.FIELD_VALUES.CONTRACT_STATUS_OPEN) {
                            const updatedParentContractId = record.submitFields({
                                type: constantsLib.RECORD_TYPES.CONTRACT,
                                id: parentContractId,
                                values: {
                                    custrecord_dsc_cf_status: constantsLib.FIELD_VALUES.CONTRACT_STATUS_PENDING_SIGNATURE
                                }
                            });
                            log.debug(logTitle + "updatedParentContractId", updatedParentContractId);
                        }
                    }

                    getRenewalContracts(parentContractId,contractTypeId,recordId);
                }
                if(context.type == context.UserEventType.EDIT)
                {
                    // getRenewalContracts(parentContractId,contractTypeId,recordId);
                }
            } catch (error) {
                log.error("ERROR IN" + logTitle, error);
            }
        }

        const getRenewalContracts =(parentContractId,contractTypeId,recordId) => {
            const logTitle = "getRenewalContracts";
            try
            {
                log.debug('parentContractId',parentContractId)
                log.debug('recordId',recordId)
                let contractLineSearch = search.create({
                    type: "customrecord_dsc_contract_line",
                    filters:
                    [
                    //    ["custrecord_dsc_clf_contract_type","anyof","2"], 
                    //    "AND", 
                       ["custrecord_dsc_clf_parent_contract","anyof", parseInt(parentContractId)], 
                       "AND", 
                       ["internalid","noneof",parseInt(recordId)], 
                       "AND", 
                       ["custrecord_dsc_cn_renewal_generate","is","F"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                 });

                //  log.debug('contractLineSearchObj',contractLineSearch)
                 const searchResults = contractLineSearch.run().getRange({
                    start: 0,
                    end: 100
                });
                log.debug('searchResults1111 conractslines',searchResults)
                // let contractLinesData = [];
                for (let i = 0; i < searchResults.length; i++) {
                    const contractSearchResult = searchResults[i];
                    const contractLineId = contractSearchResult.getValue({
                        name: "internalid"
                    });
                    if(contractLineId)
                    {
                        record.submitFields({
                            type: constantsLib.RECORD_TYPES.CONTRACT_LINE,
                            id: parseInt(contractLineId),
                            values: {
                                custrecord_dsc_cn_renewal_generate : true
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }
                }

                // return contractLinesData;

                } catch (error) {
                    log.error("ERROR IN" + logTitle, error);
                }
        }
        const getSameDateContractNumbers = (contractID, contractStartDate) => {
            const logTitle = "getSameDateContractNumbers";
            try {
                // log.debug('contractStartDate',contractStartDate)
                let dateFormat = format.format({
                    value: contractStartDate,
                    type: format.Type.DATE
                });
                let dsc_contract_lineSearchObj = search.create({
                    type: "customrecord_dsc_contract_line",
                    filters:
                    [
                       ["custrecord_dsc_clf_parent_contract","anyof",contractID], 
                       "AND", 
                       ["custrecord_dsc_clf_start_date","on",dateFormat]
                    ],
                    columns:
                    [
                       search.createColumn({name: "internalid", label: "ID"}),
                       search.createColumn({name: "custrecord_dsc_clf_parent_contract", label: "Parent Contract"}),
                       search.createColumn({name: "custrecord_dsc_clf_contract_type", label: "Contract Type"}),
                       search.createColumn({name: "custrecord_dsc_clf_customer", label: "Customer"}),
                       search.createColumn({name: "custrecord_dsc_clf_so_reference", label: "Sales Order Reference"}),
                       search.createColumn({name: "custrecord_dsc_clf_payment_mode", label: "Payment Mode"}),
                       search.createColumn({name: "custrecord_dsc_clf_status", label: "Status"}),
                       search.createColumn({name: "custrecord_dsc_clf_start_date", label: "Start Date"}),
                       search.createColumn({name: "custrecord_dsc_clf_end_date", label: "End Date"}),
                       
                    ]
                 });
                //  log.debug('dsc_contract_lineSearchObj',dsc_contract_lineSearchObj)
                const searchResults = dsc_contract_lineSearchObj.run().getRange({
                    start: 0,
                    end: 100
                });
                // log.debug('searchResults',searchResults)
                if (searchResults && searchResults.length > 0) {
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                log.error("ERROR IN getSameDateContractNumbers", error);
            }
        }

        return {
            afterSubmit,
            beforeSubmit
        }
    }
)