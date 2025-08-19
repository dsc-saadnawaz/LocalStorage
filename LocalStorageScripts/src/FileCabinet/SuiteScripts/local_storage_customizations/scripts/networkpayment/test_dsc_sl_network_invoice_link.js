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
            const accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIzOTVTT3NDdkZUY3NlRmpqNTNiZy1lbFBsUlJZci00OEUzWmN0eDloZnVRIn0.eyJleHAiOjE3MTQwNDYxNTQsImlhdCI6MTcxNDA0NTg1NCwianRpIjoiNmY0YmYxODctMWYwOS00ZmYzLWE1M2QtZWI3N2YwMTgzZDQ2IiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS5zYW5kYm94Lm5nZW5pdXMtcGF5bWVudHMuY29tL2F1dGgvcmVhbG1zL25pIiwic3ViIjoiMzY4YTE3YTMtNjdlNS00ODNlLTkxMWYtODg2MGM1ODJjYmY0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYzg1OGJlZTktZmUzZC00OGQ2LWE3YzMtMTc1ZjIxMDkzZmZmIiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJNUiIsIlZEUiIsIk1WIiwiRkxQIiwiQ08iLCJNRVJDSEFOVF9TWVNURU1TIiwiUkEiLCIwMDAiLCJDViIsIkNPU1MiLCJNQyIsIlZPIiwiVlAiLCJNSSIsIlZUIiwiQ1NBUiIsIkNBIl19LCJzY29wZSI6IiIsImNsaWVudElkIjoiYzg1OGJlZTktZmUzZC00OGQ2LWE3YzMtMTc1ZjIxMDkzZmZmIiwiY2xpZW50SG9zdCI6IjEwLjI0NC41MC4xMzAiLCJmb3IiOiJzZXJ2aWNlQWNjb3VudCIsInJlYWxtIjoibmkiLCJnaXZlbl9uYW1lIjoiTWVyY2hhbnQgc2VydmljZSBhY2NvdW50IiwiY2xpZW50QWRkcmVzcyI6IjEwLjI0NC41MC4xMzAiLCJoaWVyYXJjaHlSZWZzIjpbIjYxY2JiOWFkLTkzZTItNDNjNC05ZTNmLTliZGQ0MDBkNzI5ZSJdfQ.fbzKR_NPdh1t0Mnfi6jowc07DJ1sKkPOXxCrvUi8Am8H3lIl_KvA4oIuZcaF2yjx29Zzz_3VaYWax26ZyOAd99y8xVvvDMSdV6AjUk8-QpdD-Ws2FEDaSF7aILreQW2aksxDjOLz7anXI879ueWgQkC437FQDoqPrIHZL6I_Kure3jg1YYHi4ij-8NTSL9OQC3aGAyX6bgHYtlTrPzwAw_yemKkhUgxYhQix7dRusYFLZb9NJQDUUfwd8mPgbPnZot8UHcFdswbKxMxtBWBF_7N5wAi94vHIylcueSxiuxnQayeJcE3Ou0VtP5GQVuqCYOYx53p5fs27i4lUpDz5iA'
            try {


                networkPaymentApi(accessToken);

                let invoiceData = {
                    "firstName": "DSC TEST",
                    "lastName": "Saad",
                    "email": "saad@dynasoftcloud.com",
                    "transactionType": "SALE",
                    "emailSubject": "Invoice from ACME Services LLC",
                    "invoiceExpiryDate": "2025-04-28",
                    "items": [{
                        "description": "LS Storage Unit",
                        "totalPrice": {
                            "currencyCode": "AED",
                            "value": 50
                        },
                        "quantity": 1
                    }],
                    "total": {
                        "currencyCode": "AED",
                        "value": 50
                    },
                    "message": "Thank you for shopping with Us. Please visit the link provided below to pay your bill."
                }

                if (invoiceData && Object.keys(invoiceData).length != 0) {
                    // let invoiceApiHeader = {
                    //     "Authorization": `Bearer ${accessToken}`,
                    //     "Content-Type": `application/vnd.ni-invoice.v1+json`

                    // }
                    // log.debug("invoiceApiHeader", invoiceApiHeader)
                    // let invoiceApiResponse = https.post({
                    //     url: 'https://api-gateway.sandbox.ngenius-payments.com/invoices/outlets/877d7cf9-0a05-4630-9f34-f162e49e0071/invoice', 
                    //     headers: invoiceApiHeader,
                    //     body: JSON.stringify(invoiceData),
                    // });
                    // log.debug("invoice responseBody", invoiceApiResponse.body)

                    // let responseBody = JSON.parse(invoiceApiResponse.body);
                    // log.debug("invoice responseBody", responseBody)
                }

            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }


        const networkPaymentApi = (accessToken) => {
            const logTitle = " networkPaymentApi() ";
            try {
                let paymentApiHeader = {
                    "Authorization": `Bearer ${accessToken}`
                }
                let paymentApiResponse = https.get({
                    url: "https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/877d7cf9-0a05-4630-9f34-f162e49e0071/orders/ab51b07a-b354-43bf-82b0-2189f238cc89",
                    headers: {
                        "Authorization": `Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIzOTVTT3NDdkZUY3NlRmpqNTNiZy1lbFBsUlJZci00OEUzWmN0eDloZnVRIn0.eyJleHAiOjE3MTQxMTA3NzEsImlhdCI6MTcxNDExMDQ3MSwianRpIjoiNDhlNzM4ZjUtZDM0OC00NGY1LTliZTItZmUxMmIxZTlhNGU3IiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS5zYW5kYm94Lm5nZW5pdXMtcGF5bWVudHMuY29tL2F1dGgvcmVhbG1zL25pIiwic3ViIjoiMzY4YTE3YTMtNjdlNS00ODNlLTkxMWYtODg2MGM1ODJjYmY0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYzg1OGJlZTktZmUzZC00OGQ2LWE3YzMtMTc1ZjIxMDkzZmZmIiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJNUiIsIlZEUiIsIk1WIiwiRkxQIiwiQ08iLCJNRVJDSEFOVF9TWVNURU1TIiwiUkEiLCIwMDAiLCJDViIsIkNPU1MiLCJNQyIsIlZPIiwiVlAiLCJNSSIsIlZUIiwiQ1NBUiIsIkNBIl19LCJzY29wZSI6IiIsImNsaWVudElkIjoiYzg1OGJlZTktZmUzZC00OGQ2LWE3YzMtMTc1ZjIxMDkzZmZmIiwiY2xpZW50SG9zdCI6IjEwLjI0NC41MC4xMzAiLCJmb3IiOiJzZXJ2aWNlQWNjb3VudCIsInJlYWxtIjoibmkiLCJnaXZlbl9uYW1lIjoiTWVyY2hhbnQgc2VydmljZSBhY2NvdW50IiwiY2xpZW50QWRkcmVzcyI6IjEwLjI0NC41MC4xMzAiLCJoaWVyYXJjaHlSZWZzIjpbIjYxY2JiOWFkLTkzZTItNDNjNC05ZTNmLTliZGQ0MDBkNzI5ZSJdfQ.jmKQwK3gKTagPFhvts67ZCV0CjWwe9o1B8Db0vQ-1O_aoIke4N4yv-HeAKpC8Qxoj7J6kZyAXuZBTqMsCxEGvQoP7yk2_eIHIYzmMi9F7UFue1SSSd_bWzQ3ohdcKltPrAT29iCuVwl2dRKnjWacj8qkcRWgvOFQxR2giap_5jK7bLdqi1TyoHQrcUDX0VpUC5sdBkP5Kt_q0s3gO_NSJiMErtZQMF2ZWMFsca6UuP2GYzONp1j14qKQudLnPq7r6dFwbWr_j241SBOmirfCxixhw32qp-IQW_Cc4WJJu46k7_P16okU8t8c-sdJcZ0Rp_1m5QTGKgbSEVoc8_53-w`,                  
                        // "Content-Type": "application/vnd.ni-invoice.v1+json",
                        "Accept": "*/*"
                    }
                }); 
                let responseBody = JSON.parse(paymentApiResponse.body);
                log.debug("payment responseBody", responseBody)
            } catch (error) {
                log.error({
                    title: logTitle + 'Error',
                    details: error
                })
            }
        }

        return {
            onRequest
        }
    }
);