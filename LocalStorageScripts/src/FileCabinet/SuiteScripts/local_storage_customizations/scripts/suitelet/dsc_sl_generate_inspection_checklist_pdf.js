/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define (['N/render', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js' , 'N/format'],
    (render, utilsLib, constantsLib , format) => {
        const onRequest = context => {
            const title = " onRequest() ";
            log.debug(title, "<--------------- SUITELET SCRIPT - START --------------->");
            const request = context.request;
            const response = context.response;
            try {
                if (request.method == "GET") {
                    const contractId = request.parameters?.recid;
                    if (contractId) {
                        const inputDataObj = getPdfInputData(contractId);
                        // response.writeLine(JSON.stringify(inputDataObj));
                        let pdfXml = utilsLib.generatePdfXml(inputDataObj, constantsLib.FILE_PATHS.PDF_TEMPLATES.GENERATE_INSPECTION_CHECKLIST_TEMPLATE);
                        if (pdfXml) {
                            pdfXml = pdfXml.replace(/&amp;/g, "&");
                            pdfXml = pdfXml.replace(/&lt;/g, "<");
                            pdfXml = pdfXml.replace(/&/g, '&amp;');
                            const pdfFile = render.xmlToPdf({
                                xmlString: pdfXml
                            });
                            response.writeFile({
                                file: pdfFile,
                                isInline: true
                            });
                        }
                    }
                }
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
            log.debug(title, "<--------------- SUITELET SCRIPT - END --------------->");
        }

        const getPdfInputData = contractId => {
            const title = " getPdfInputData() ";
            try {
                const inputDataObj = {
                  

                };
                
                return inputDataObj;
            } catch (error) {
                log.error("ERROR IN" + title, error);
            }
        }

        return {
            onRequest
        }
    }
);