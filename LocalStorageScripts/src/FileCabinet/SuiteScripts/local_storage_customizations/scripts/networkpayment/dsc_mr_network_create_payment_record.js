/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/url', 'N/https'],
    (record, search, utilsLib, constantsLib, url, https) => {
        const getInputData = (context) => {
            const title = "getInputData ::";
            try {
                let invoiceData = getInvoicesData();
                log.debug('invoiceData', invoiceData)
                return invoiceData;
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
                let invoiceDataObj = JSON.parse(context.value);
                log.debug('invoiceDataObj', invoiceDataObj);
                if (invoiceDataObj.invoiceId && invoiceDataObj.netwrokOrderRef) {
                    let getAccessToken = generateAccessToken();
                    if (getAccessToken && getAccessToken.access_token) {
                        let getPaymentApiStatus = networkPaymentApi(getAccessToken.access_token, invoiceDataObj.netwrokOrderRef);
                        if (getPaymentApiStatus) {
                            if (getPaymentApiStatus && getPaymentApiStatus._embedded && getPaymentApiStatus._embedded.payment && getPaymentApiStatus._embedded.payment[0] && getPaymentApiStatus._embedded.payment[0].state && getPaymentApiStatus._embedded.payment[0].state == "CAPTURED") {

                                let createPayment = record.transform({
                                    fromType: record.Type.INVOICE,
                                    fromId: parseInt(invoiceDataObj.invoiceId),
                                    toType: record.Type.CUSTOMER_PAYMENT,
                                    // isDynamic: true,
                                });
                                createPayment.setValue('custbody_dsc_contract_line',invoiceDataObj.invoiceContractLine);
                                createPayment.setValue('custbody_dsc_network_payment_received',true);
                                let paymentSavedId = createPayment.save({
                                    ignoreMandaotryFields: true
                                });
                                log.debug('paymentSavedId', paymentSavedId)
                            }
                        }
                    }
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                });
            }
        };

        const getInvoicesData = () => {
            const logTitle = " getInvoicesData() ";
            try {
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
                        ["status", "anyof", "CustInvc:A"],
                        "AND",
                        ["custbody_dsc_network_status", "anyof", constantsLib.NETWORK_PAYMENT_INVOICE_STATUS.SYNECD]
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
                        }),
                        search.createColumn({
                            name: "custbody_dsc_network_order_ref",
                            label: "Network Order Reference"
                        }),
                        search.createColumn({
                            name: "custbody_dsc_contract_line"
                        })
                        
                    ]
                });
                let invoiceDataObj = {};
                const searchResults = utilsLib.getAllSearchResults(invoiceSearchObj);
                // log.debug(logTitle + "searchResults", searchResults);
                if (searchResults && searchResults.length > 0) {
                    searchResults.forEach((result) => {
                        let invoiceId = result.getValue({
                            name: 'internalid'
                        });

                        let netwrokOrderRef = result.getValue({
                            name: 'custbody_dsc_network_order_ref'
                        });
                        if (invoiceId && netwrokOrderRef) {
                            let invoiceStatus = result.getValue({
                                name: 'statusref'
                            });
                            let invoiceContractLine = result.getValue({
                                name: 'custbody_dsc_contract_line'
                            });
                            if (!invoiceDataObj[invoiceId]) {
                                invoiceDataObj[invoiceId] = {
                                    invoiceId,
                                    invoiceStatus,
                                    netwrokOrderRef,
                                    invoiceContractLine
                                }
                            }
                        }
                    })
                }
                return invoiceDataObj;
            } catch (error) {
                log.error({
                    title: logTitle + 'Error',
                    details: error
                })
            }

        }
        const generateAccessToken = () => {
            const title = "generateAccessToken ::"
            try {
                const response = https.post({
                    url: constantsLib.NETWORK_PAYMENT.API_ACCESS_TOKEN,
                    headers: {
                        "Content-Type": constantsLib.NETWORK_PAYMENT.CONTENT_TYPE,
                        "Accept": constantsLib.NETWORK_PAYMENT.ACCEPT,
                        "Authorization": constantsLib.NETWORK_PAYMENT.API_KEY
                    },
                    body: JSON.stringify({}),
                });

                let responseBody = JSON.parse(response.body);

                log.debug({
                    title: title + 'response',
                    details: responseBody
                })
                if (responseBody && responseBody.access_token) {
                    return responseBody;
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const networkPaymentApi = (accessToken, invoiceOrderRef) => {
            const logTitle = " networkPaymentApi() ";
            try {
                let paymentApiResponse = https.get({
                    // url: "https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/ca864e35-0852-434d-b750-2faa99d376ad/orders/" + invoiceOrderRef,
                    url: "https://api-gateway.ngenius-payments.com/transactions/outlets/a035ea01-7650-4a40-bc33-5644d23fa834/orders/" + invoiceOrderRef,
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        // "Content-Type": "application/vnd.ni-invoice.v1+json",
                        "Accept": "*/*"
                    }
                });
                let responseBody = JSON.parse(paymentApiResponse.body);
                // log.debug("payment responseBody", responseBody)
                return responseBody;
            } catch (error) {
                log.error({
                    title: logTitle + 'Error',
                    details: error
                })
            }
        }
        return {
            getInputData,
            map
        };

    });