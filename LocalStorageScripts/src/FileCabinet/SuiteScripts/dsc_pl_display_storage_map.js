/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 * @NModuleScope Public
 */
define(['N/url'], (url) => {

    const render = (params) => {
        try {
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_floor_storage_map', 
                deploymentId: 'customdeploy_dep_floor_storage_map'
            });

            const iframeHTML = `
                <iframe src="${suiteletUrl}" 
                        width="100%" 
                        height="400px" 
                        frameborder="0"></iframe>`;

            // Set the iframe inside the portlet
            params.portlet.html = iframeHTML;


        } catch (error) {
            params.portlet.html = `<p>Error loading Suitelet data: ${error.message}</p>`;
        }
    };

    return {
        render: render
    };
});
