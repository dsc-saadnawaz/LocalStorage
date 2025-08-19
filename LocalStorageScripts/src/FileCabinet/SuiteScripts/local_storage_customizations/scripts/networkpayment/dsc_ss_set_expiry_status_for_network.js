/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/search', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'], function (record, search, utilsLib, constantsLib) {
    const execute = context => {
        const title = 'execute :: ';
        try {
            let invoicesData = getInvoicesData();
            if (invoicesData && invoicesData.length > 0) {
                for (let i = 0; i < invoicesData.length; i++) {
                    record.submitFields({
                        type: search.Type.INVOICE,
                        id: parseInt(invoicesData[i]),
                        values: {
                            custbody_dsc_network_status: constantsLib.NETWORK_PAYMENT_INVOICE_STATUS.EXPIRED
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                }
            }
        } catch (error) {
            log.error({
                title: title + 'Error',
                details: error
            })
        }
    }
    const getInvoicesData = () => {
        const logTitle = " getInvoicesData() ";
        try {
            let invoiceIdsArr = [];
            var invoiceSearchObj = search.create({
                type: "invoice",
                filters: [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["cogs", "is", "F"],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["status", "noneof", "CustInvc:B"],
                    "AND",
                    ["custbody_dsc_network_expiry_date", "before", "today"],
                    "AND",
                    ["custbody_dsc_contract_end_date", "before", "today"], //10-Feb-2025 ticket # LS-148 
                    "AND",
                    ["custbody_dsc_network_status", "anyof", "1"]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "entity",
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "currency",
                        label: "Currency"
                    }),
                    search.createColumn({
                        name: "expensedate",
                        label: "Expense Date"
                    }),
                    search.createColumn({
                        name: "custbody_dsc_network_status",
                        label: "Network Status"
                    }),
                    search.createColumn({
                        name: "statusref",
                        label: "Status"
                    })
                ]
            });

            const searchResults = utilsLib.getAllSearchResults(invoiceSearchObj);
            log.debug(logTitle + "searchResults", searchResults);
            if (searchResults && searchResults.length > 0) {
                searchResults.forEach((result) => {
                    let invoiceId = result.getValue({
                        name: 'internalid'
                    });
                    if (invoiceId && invoiceId != "") {
                        invoiceIdsArr.push(invoiceId)
                    }
                })
            }
            return invoiceIdsArr;
        } catch (error) {
            log.error({
                title: logTitle + 'Error',
                details: error
            })
        }

    }
    return {
        execute
    }
});