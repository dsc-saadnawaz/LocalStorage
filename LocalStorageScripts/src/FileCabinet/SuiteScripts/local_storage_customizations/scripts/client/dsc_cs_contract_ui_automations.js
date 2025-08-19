/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../../lib/dsc_lib_constants.js'],
    (currentRecord, url, constantsLib) => {
        const pageInit = context => {
            const title = " pageInit() ";
            try {
                const recObj = context.currentRecord
                let queryString = window.location.search;
                // Parse the query string to get the parameters
                let urlParams = new URLSearchParams(queryString);
                // console.log('urlParams',urlParams)
                // let paramExistingContractLineID = urlParams.get('previousContractLineId');
                let paramExistingParentContractId = urlParams.get('contractId');
                // console.log('paramExistingContractLineID', paramExistingContractLineID);
                console.log('paramExistingParentContractId', paramExistingParentContractId);
                console.log('recObj.type', recObj.type)
                if (paramExistingParentContractId && recObj.type == constantsLib.RECORD_TYPES.CONTRACT_LINE) {
                    // recObj.setValue('custrecord_dsc_clf_prev_contract_line', paramExistingContractLineID);
                    recObj.setValue('custrecord_dsc_clf_parent_contract', paramExistingParentContractId);
                    recObj.setValue('custrecord_dsc_clf_contract_type', constantsLib.FIELD_VALUES.CONTRACT_TYPE_RENEWAL);
                    recObj.setValue('custrecord_dsc_clf_status', constantsLib.FIELD_VALUES.CONTRACT_LINE_STATUS_OPEN);
                }
                if (paramExistingParentContractId && recObj.type == constantsLib.RECORD_TYPES.CHECKOUT) {
                    recObj.setValue('custrecord_dsc_cf_agreement_no', paramExistingParentContractId);
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }
        const generateContractPdf = () => {
            const title = " generateContractPdf() ";
            try {
                const recObj = currentRecord.get();
                const contractId = recObj.id;

                const suiteletUrl = url.resolveScript({
                    scriptId: constantsLib.SUITELET_SCRIPTS.GENERATE_CONTRACT_PDF.SCRIPT_ID,
                    deploymentId: constantsLib.SUITELET_SCRIPTS.GENERATE_CONTRACT_PDF.DEPLOY_ID,
                    returnExternalUrl: false
                });
                window.open(suiteletUrl + '&recid=' + contractId);
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }
        const manualRenewalProcess = (contractObj) => {
            const title = " manualRenewalProcess() ";
            try {
                const recObj = currentRecord.get();
                const contractId = recObj.id;

                // log.debug('contractLineObj CSSS', contractLineObj);
                let contractLinePath = constantsLib.RECORDS_LINKS.CONTRACT_LINE
                // console.log('contractLinePath', contractLinePath)
                console.log('contractObj CSSS', contractObj);
                if (contractObj.contractId && contractObj.previousContractLineId) {
                    // window.open(contractLinePath + '&contractId=' + contractObj.contractId + '&previousContractLineId=' + contractObj.previousContractLineId);
                    window.open(contractLinePath + '&contractId=' + contractObj.contractId);
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }
        const createSalesOrder = (contractObj) => {
            const title = " createSalesOrder() ";
            try {
                const recObj = currentRecord.get();
                const contractId = recObj.id;

                console.log('contractObj createSalesOrder', contractObj);
                if (contractObj.contractLineId && contractObj.contractCustomer) {
                    // window.open(constantsLib.SALES_ORDER_LINK + '&contractLineId=' + contractObj.contractLineId +'&customerId='+contractObj.contractCustomer);
                    window.open(constantsLib.SALES_ORDER_LINK);
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }
        const startContractCheckout = (contractObj) => {
            const title = " startContractCheckout() ";
            try {
                const recObj = currentRecord.get();
                const contractId = recObj.id;

                let checkoutPath = constantsLib.RECORDS_LINKS.CHECKOUT
                console.log('contractObj startContractCheckout', contractObj);
                if (contractObj.contractId && checkoutPath) {
                    window.open(checkoutPath + '&contractId=' + contractObj.contractId);
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }

        return {
            pageInit,
            generateContractPdf,
            manualRenewalProcess,
            startContractCheckout,
            createSalesOrder
        }
    }
)