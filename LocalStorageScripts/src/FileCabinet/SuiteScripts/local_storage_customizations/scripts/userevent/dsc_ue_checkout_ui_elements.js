/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],

    (utilsLib, constantsLib) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (context) => {
            const title = "beforeLoad ::"
            try {
                const formObj = context.form
                let recordObj = context.newRecord;
                formObj.clientScriptFileId = utilsLib.getFileId(constantsLib.FILE_PATHS.CLIENT_SCRIPTS.CHECKOUT_UI_AUTOMATIONS); 
                let checkoutStatus = recordObj.getValue('custrecord_dsc_cf_checkout_status');             
                if (context.type == context.UserEventType.VIEW) {
                    formObj.addButton({
                        id: 'custpage_dsc_btn_checkout_pdf',
                        label: 'Generate Checkout Pdf',
                        functionName: 'generateCheckOutPdf()'
                    })

                    if(constantsLib.FIELD_VALUES.CHECKOUT_STATUS_REFUND_PENDING == checkoutStatus)
                    {
                        formObj.addButton({
                            id: 'custpage_dsc_btn_create_credit_memo',
                            label: 'Create Credit Memo',
                            functionName: 'createCreditMemo()'
                        });
                    }
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }



        return { beforeLoad }

    });
