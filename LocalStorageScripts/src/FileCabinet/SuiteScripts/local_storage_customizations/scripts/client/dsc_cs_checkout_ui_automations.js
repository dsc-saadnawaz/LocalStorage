/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../../lib/dsc_lib_constants.js'],
    function (currentRecord, url, constantsLib) {

        const pageInit = (context) => {
            return true
        }

        const generateCheckOutPdf = () => {
            const title = "generateCheckOutPdf ::"
            try {
                const recObj = currentRecord.get();
                const contractId = recObj.id;

                const suiteletUrl = url.resolveScript({
                    scriptId: constantsLib.SUITELET_SCRIPTS.GENERATE_CHECKOUT_PDF.SCRIPT_ID,
                    deploymentId: constantsLib.SUITELET_SCRIPTS.GENERATE_CHECKOUT_PDF.DEPLOY_ID,
                    returnExternalUrl: false
                });
                window.open(suiteletUrl + '&recid=' + contractId);
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const createCreditMemo = () => {
            const title = "createCreditMemo ::"
            try {
                const recObj = currentRecord.get();
                const checkoutId = recObj.id;

                window.open("https://8977849.app.netsuite.com/app/accounting/transactions/custcred.nl");
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        return {
            pageInit: pageInit,
            generateCheckOutPdf: generateCheckOutPdf,
            createCreditMemo:createCreditMemo

        };

    });
