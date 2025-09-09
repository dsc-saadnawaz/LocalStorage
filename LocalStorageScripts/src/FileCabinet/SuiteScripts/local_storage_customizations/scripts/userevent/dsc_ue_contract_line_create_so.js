/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', 'N/url', 'N/https', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (record, search, n_error, url, https, utils, constantsLib) => {
        const afterSubmit = (context) => {
            const title = "afterSubmit ::"
            try {
                const recObj = context.newRecord;
                let recordId = recObj.id;
                let params = {
                    parentContractId: recObj.getValue('custrecord_dsc_clf_parent_contract'),
                    contractCustomer: recObj.getValue('custrecord_dsc_clf_customer'),
                    contractDuration: recObj.getValue('custrecord_dsc_clf_duration'),
                    contractPadlock: recObj.getValue('custrecord_dsc_clf_padlock'),
                    contractPackingCharges: recObj.getValue('custrecord_dsc_clf_packing_charges'),
                    contractPackingChargesAmount: recObj.getValue('custrecord_dsc_clf_packing_charges_amoun'),
                    contractSecurityDeposit: recObj.getValue('custrecord_dsc_clf_security_deposit'),
                    contractSecurityDepositAmount: recObj.getValue('custrecord_dsc_clf_security_deposit_amou'),
                    contractOtherCharges: recObj.getValue('custrecord_dsc_clf_other_charges'),
                    contractOtherChargesAmount: recObj.getValue('custrecord_dsc_other_charges_amount'),
                    contractDiscountItem: recObj.getValue('custrecord_dsc_clf_discount_item'),
                    contractTypeId: recObj.getValue('custrecord_dsc_clf_contract_type'),
                    contractSoRef: recObj.getValue('custrecord_dsc_clf_so_reference'),
                    contractPaymentMode: recObj.getValue('custrecord_dsc_clf_payment_mode'),
                    recordId: recordId
                };

                if (context.type == context.UserEventType.CREATE) {
                    log.debug({
                        title: title + 'Creating Sales Order',
                        details: 'Parent ' + params.parentContractId + ' Contract Type: ' + params.contractTypeId
                    });
                    if (!params.contractSoRef && params.parentContractId) {

                        let suiteletUrl = url.resolveScript({
                            scriptId: constantsLib.SUITELET_SCRIPTS.CREATE_SALES_ORDER.SCRIPT_ID,
                            deploymentId: constantsLib.SUITELET_SCRIPTS.CREATE_SALES_ORDER.DEPLOY_ID,
                            returnExternalUrl: true
                        });

                        let response = https.post({
                            url: suiteletUrl,
                            body: JSON.stringify(params),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        // Call Suitelet via GET
                        // let response = https.get({
                        //     url: suiteletUrl
                        // });
                        log.debug('Suitelet Response111', response);

                    }

                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        return {
            afterSubmit
        }
    });