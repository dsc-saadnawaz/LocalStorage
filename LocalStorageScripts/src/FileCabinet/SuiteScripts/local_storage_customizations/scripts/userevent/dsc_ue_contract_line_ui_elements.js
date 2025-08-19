/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (utilsLib, constantsLib) => {

        const beforeLoad = context => {
            const logTitle = " beforeLoad() ";
            log.debug(logTitle, "<--------------- USER_EVENT_BEFORE_LOAD - START--------------->");
            try {
                // log.debug(logTitle+"utilsLib", utilsLib);
                // log.debug(logTitle+"constantsLib", constantsLib);
                let recordObj = context.newRecord;
                let contractLineObj = {};
                contractLineObj.previousContractLine = recordObj.getValue('custrecord_dsc_clf_prev_contract_line');
                contractLineObj.contractLineSalesOrder = recordObj.getValue('custrecord_dsc_clf_so_reference');
                const formObj = context.form;

                let status = recordObj.getValue({
                    fieldId: 'custrecord_dsc_clf_status'
                })

                formObj.clientScriptFileId = utilsLib.getFileId(constantsLib.FILE_PATHS.CLIENT_SCRIPTS.CONTRACT_LINE_UI_AUTOMATIONS);
                if (context.type == context.UserEventType.VIEW && !contractLineObj.previousContractLine && contractLineObj.contractLineSalesOrder) {
                    contractLineObj.contractLineId = recordObj.id;
                    contractLineObj.parentContract = recordObj.getValue('custrecord_dsc_clf_parent_contract');
                    contractLineObj.contractLineEndDate = recordObj.getValue('custrecord_dsc_clf_end_date');
                    contractLineObj.contractLineSoRef = recordObj.getValue('custrecord_dsc_clf_so_reference');

                    // formObj.addButton({
                    //     id: 'custpage_dsc_btn_contract_line_renewal',
                    //     label: 'Renewal Contract',
                    //     functionName: 'manualRenewalProcess(' + JSON.stringify(contractLineObj) + ')'
                    // });

                    // add status check custrecord_dsc_clf_status:"4"
                    if ( status == '4') {
                        formObj.addButton({
                            id: 'custpage_dsc_btn_generate_inspection_checklist',
                            label: 'Generate Inspection Checklist',
                            functionName: 'generateInspectionChecklist()'
                        });
                    }

                    
                }
            } catch (error) {
                log.error("ERROR in " + logTitle, error);

            }
            log.debug(logTitle, "<--------------- USER_EVENT_BEFORE_LOAD - END --------------->");
        }

        return {
            beforeLoad
        }
    }
);