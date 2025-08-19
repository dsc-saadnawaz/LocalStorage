/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/serverWidget', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/search', 'N/ui/message', 'N/https'],
    (record, serverWidget, utilsLib, constantsLib, search, message, https) => {
        const onRequest = context => {
            const title = " onRequest() ";
            log.debug(title, "<--------------- SUITELET SCRIPT - START --------------->");
            const request = context.request;
            const response = context.response;
            try {
                if (request.method == "POST") {
                    response.setHeader({
                        name: "Content-Type",
                        value: "application/json",
                    });

                    const reqBody = JSON.parse(request.body);
                    log.debug({
                        title: title + "reqBody",
                        details: reqBody,
                    });
                    if (reqBody && reqBody.action == "INVOICE_LINK" && reqBody.invoiceObj) {
                        let invoiceId = reqBody.invoiceObj.invoiceId;
                        let daysforLinkExpire = reqBody.invoiceObj.daysforLinkExpire;
                        let getAccessToken = generateAccessToken();

                        let invoiceRecord = record.load({
                            type: record.Type.INVOICE,
                            id: parseInt(invoiceId),
                            isDynamic: false
                        });
                        let invoiceDate = invoiceRecord.getValue("trandate");
                        if (invoiceDate) {
                            // log.debug('invoiceDate', invoiceDate)
                            let getExpiryDate = utilsLib.calculateExpiryDateforNetwork(invoiceDate, daysforLinkExpire);
                            log.debug("getExpiryDate", getExpiryDate)
                            if (getExpiryDate) {
                                let invoiceDataObj = getInvoiceData(invoiceId, getExpiryDate);
                                log.debug('invoiceDataObj', invoiceDataObj)
                                if (invoiceDataObj && Object.keys(invoiceDataObj).length != 0) {
                                    invoiceRecord.setValue('custbody_dsc_network_expiry_date', new Date(getExpiryDate));
                                    if (getAccessToken.access_token) {
                                        let getInvoiceLinkRef = generateInvoiceLink(getAccessToken.access_token, invoiceDataObj);
                                        if (getInvoiceLinkRef && getInvoiceLinkRef.orderReference) {
                                            invoiceRecord.setValue('custbody_dsc_network_order_ref', getInvoiceLinkRef.orderReference);
                                            invoiceRecord.setValue('custbody_dsc_network_status', constantsLib.NETWORK_PAYMENT_INVOICE_STATUS.SYNECD);
                                            invoiceRecord.setValue('custbody_dsc_resend_netowrk_link', false);
                                            
                                        } else {
                                            invoiceRecord.setValue('custbody_dsc_network_error_msg', getInvoiceLinkRef);
                                            invoiceRecord.setValue('custbody_dsc_network_status', constantsLib.NETWORK_PAYMENT_INVOICE_STATUS.ERRORED);
                                        }
                                    }
                                }
                            }

                        }

                        let invoiceSave = invoiceRecord.save({
                            ignoreMandaotryFields: true
                        });

                        response.write(JSON.stringify(invoiceSave))
                    }
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);

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
        const generateInvoiceLink = (accessToken, invoiceDataObj) => {
            const title = "generateInvoiceLink ::"
            try {
                if (invoiceDataObj && accessToken) {
                    let invoiceData = invoiceDataObj; //getInvoiceData(invoiceId, getExpiryDate);
                    if (invoiceData && Object.keys(invoiceData).length != 0) {
                        let invoiceApiHeader = {
                            "Content-Type": `application/vnd.ni-invoice.v1+json`,
                            "Accept": `application/vnd.ni-invoice.v1+json`,
                            "Authorization": `Bearer ${accessToken}`
                        }
                        // log.debug("invoiceApiHeader", invoiceApiHeader)
                        let invoiceApiResponse = https.post({
                            url: constantsLib.NETWORK_PAYMENT.API_INVOICE_LINK,
                            headers: invoiceApiHeader,
                            body: JSON.stringify(invoiceData),
                        });
                        // log.debug("invoice responseBody", invoiceApiResponse.body)
                        let responseBody = JSON.parse(invoiceApiResponse.body);
                        log.debug("invoice responseBody", responseBody)
                        if (responseBody) {
                            return responseBody;
                        } else {
                            return "";
                        }
                    }
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const getInvoiceData = (invoiceId, getExpiryDate) => {
            const title = "getInvoiceData ::"
            try {
                let setDateFormat = utilsLib.formatDate(getExpiryDate);
                log.debug("setDateFormat", setDateFormat)
                let invoiceApiObj = {};
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters: [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["internalid", "anyof", invoiceId],
                        "AND",
                        ["custbody_dsc_contract_line.custrecord_dsc_clf_payment_mode", "anyof", constantsLib.FIELD_VALUES.PAYMENT_METHOD_ONLINE]
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
                            name: "firstname",
                            join: "customer",
                            label: "First Name"
                        }),
                        search.createColumn({
                            name: "lastname",
                            join: "customer",
                            label: "Last Name"
                        }),
                        search.createColumn({
                            name: "isperson",
                            join: "customer",
                            label: "Is Individual"
                        }),
                        search.createColumn({
                            name: "email",
                            join: "customer",
                            label: "Email"
                        }),
                        search.createColumn({
                            name: "item",
                            label: "Item"
                        }),
                        search.createColumn({
                            name: "fxamount",
                            label: "Amount (Foreign Currency)"
                        }),
                        search.createColumn({
                            name: "salesdescription",
                            join: "item",
                            label: "Description"
                        }),
                        search.createColumn({
                            name: "quantity",
                            label: "Quantity"
                        }),
                        search.createColumn({
                            name: "total",
                            label: "Amount (Transaction Total)"
                        }),
                        search.createColumn({
                            name: "currency",
                            label: "Currency"
                        }),
                        search.createColumn({
                            name: "altname",
                            join: "customer",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "taxamount",
                            label: "Amount (Tax)"
                        })
                    ]
                });
                const searchResults = invoiceSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });
                log.debug('searchResults', searchResults)
                let customerFirstName, customerLastName;
                if (searchResults && searchResults.length > 0) {


                    let individualCustomer = searchResults[0].getValue({
                        name: "isperson",
                        join: "customer",
                    });
                    if (individualCustomer || individualCustomer == "T") {
                        customerFirstName = searchResults[0].getValue({
                            name: "firstname",
                            join: "customer",
                        });
                        customerLastName = searchResults[0].getValue({
                            name: "lastname",
                            join: "customer",
                        });
                    } else {
                        customerFirstName = searchResults[0].getValue({
                            name: "altname",
                            join: "customer",
                        });
                        customerLastName = "Company"
                    }

                    let customerEmail = searchResults[0].getValue({
                        name: "email",
                        join: "customer",
                    });
                    let invoioceTotal = searchResults[0].getValue({
                        name: "total"
                    });
                    let invoioceTaxTotal = searchResults[0].getValue({
                        name: "taxamount"
                    });
                    invoiceApiObj.firstName = customerFirstName
                    invoiceApiObj.lastName = customerLastName
                    invoiceApiObj.email = customerEmail
                    invoiceApiObj.transactionType = 'SALE'
                    invoiceApiObj.emailSubject = "Invoice from Local Self Storage"
                    invoiceApiObj.invoiceExpiryDate = setDateFormat
                    invoiceApiObj.items = []
                    invoiceApiObj.total = {
                        "currencyCode": "AED",
                        "value": Number(parseFloat(invoioceTotal).toFixed(2)) * 100
                    }
                    invoiceApiObj.message = "Thank you for shopping with Us. Please visit the link provided below to pay your bill.";
                    for (let i = 0; i < searchResults.length; i++) {
                        let itemDescription = searchResults[i].getValue({
                            name: "salesdescription",
                            join: "item",
                        });
                        let itemQuantity = searchResults[i].getValue({
                            name: "quantity",
                        });
                        let itemAmount = searchResults[i].getValue({
                            name: "fxamount",
                        });
                        let itemName = searchResults[i].getText({
                            name: "item",
                        });
                        if (itemAmount > 0) {
                            invoiceApiObj.items.push({
                                description: itemName,
                                totalPrice: {
                                    "currencyCode": "AED",
                                    "value": Number(parseFloat(itemAmount).toFixed(2)) * 100
                                },
                                quantity: parseInt(itemQuantity) > 0 ? parseInt(itemQuantity) : 1,
                            })
                        }
                    }
                    if(invoioceTaxTotal > 0)
                    {
                        invoiceApiObj.items.push({
                            description: "Tax",
                            totalPrice: {
                                "currencyCode": "AED",
                                "value": Number(parseFloat(invoioceTaxTotal).toFixed(2)) * 100
                            },
                            quantity: 1,
                        })
                    }
                }
                return invoiceApiObj;
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