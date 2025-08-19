/**
* @NApiVersion 2.1
* @NScriptType Suitelet
*@NModuleScope SameAccount
*/

define(['N/file', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js', 'N/runtime', 'N/https'], (file, utilsLib, constantsLib, runtime, https) => {

    const htmlMapFileId = '1822'
    const onRequest = (context) => {
        const title = "<!--onRequest()::-->";

        const { request, response } = context;

        const scriptObj = runtime.getCurrentScript();
        const scriptId = scriptObj.id;
        const deploymentId = scriptObj.deploymentId;

        log.debug(title + ' scriptId', scriptId);
        log.debug(title + ' deploymentId', deploymentId);

        try {

            const parameters = request.parameters;
            log.debug(title + ' parameters', parameters);

            if (request.method.toUpperCase() == 'GET') {

                if (parameters.page != 'dashboard') {
                    response.sendRedirect({
                        identifier: scriptId,
                        id: deploymentId,
                        type: https.RedirectType.SUITELET,
                        parameters: {
                            page: 'dashboard'
                        }
                    })
                    return Promise.resolve('Redirected!');
                } else {

                    const mapFile = file.load({
                        id: htmlMapFileId
                    });

                    const htmlFileContent = mapFile.getContents();

                    if (htmlFileContent) {
                        context.response.write(htmlFileContent)
                    } else {
                        context.response.write('File not Found...!')
                    }

                }


            } else {
                const requestBodyJson = request.body;
                let requestBody = null;
                try {

                    requestBody = JSON.parse(requestBodyJson);
                    log.debug(title + ' requestBody', requestBody)

                } catch (error) {
                    log.dubug(title + ' requestBodyJson error', error.message)
                }

                if (requestBody) {
                    response.addHeader({
                        name: 'Content-Type',
                        value: 'application/json'
                    });

                    if (requestBody.page == 'dashboard') {
                        const storageUnitMapObj = utilsLib.getStorageUnitsAgainstFloor();
                        const mainLocationId = constantsLib.FIELD_VALUES.LOCATION_PRODUCTION_CITY
                        response.write({
                            output: JSON.stringify(storageUnitMapObj[mainLocationId])
                        });
                    }
                    //  else if (requestBody.page == 'storage_unit') {
                    //     const { floor, storageId } = requestBody
                    //     const storageUnitDetail = utilsLib.getDetailsAgainstStorageUnit(floor, storageId);
                    //     response.write({
                    //         output: JSON.stringify(storageUnitDetail)
                    //     });
                    // }
                    else {
                        response.write({
                            output: 'Page name is invalid'
                        })
                    }
                }
            }


        } catch (error) {
            log.debug(title + "catch error", error.message)
        }
    };

    return {
        onRequest
    };

});
