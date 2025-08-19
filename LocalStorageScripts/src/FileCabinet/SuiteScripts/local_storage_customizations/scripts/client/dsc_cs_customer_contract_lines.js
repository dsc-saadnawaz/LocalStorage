/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search',  '../../lib/dsc_lib_constants.js' ],

    function (currentRecord, search , constantsLib ) {

        function pageInit(context) {
            console.log('running')
        }

        function fieldChanged(context) {
            const title = "fieldChanged ::"
            try {
                if (context.fieldId == 'entity') {
                    const contractLineDetails = filteredContractLines()
                    log.debug({ title: title + 'contractLineDetails', details: contractLineDetails })
                    updateContractLinesField(contractLineDetails);
                    
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }


        const filteredContractLines = () => {
            const title = "filteredContractLines ::"
            try {
                const record = currentRecord.get()
                const customerId = record.getValue({ fieldId: 'entity' })
                let contractLineDetails = getCustomerContractsLine(customerId)
                return contractLineDetails
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const getCustomerContractsLine = customerId => {
            const title = "getCustomerContractsLine ::"
            try {
                let contractLineSearch = search.create({
                    type: 'customrecord_dsc_contract_line',
                    filters: [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_dsc_clf_status", "anyof", constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_INPROGRESS],
                        "AND",
                        ["custrecord_dsc_clf_parent_contract.custrecord_dsc_cf_customer", "anyof", customerId]
                    ],
                    columns: [
                        search.createColumn({ name: "name" })
                       
                    ]
                })
                let results = contractLineSearch.run().getRange({ start: 0 , end: 99})
                let contractLineDetails = []
                results.forEach((result) => {
                    let contractLineId = result.getValue({ name: 'name' })
                    contractLineDetails.push(contractLineId)
                })
                return contractLineDetails
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const updateContractLinesField = (contractLineDetails) => {
            const title = "updateContractLineField ::"
            try {
                console.log('inside updateContractLinesField ')
                const record = currentRecord.get()
                record.setValue({
                    fieldId: 'custbody_dsc_contract_line',
                    value: contractLineDetails 
                });
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        return {
            pageInit,
            fieldChanged
        };

    });
