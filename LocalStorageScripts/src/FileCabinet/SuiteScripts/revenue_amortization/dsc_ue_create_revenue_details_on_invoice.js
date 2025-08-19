/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/runtime', '../local_storage_customizations/lib/dsc_lib_constants.js', '../local_storage_customizations/lib/dsc_lib_utils.js', 'N/format'], (record, runtime, constants, utils, format) => {
    const afterSubmit = context => {
        const title = 'afterSubmit :: ';
        try {
            const { type, newRecord, UserEventType } = context;
            if (type == UserEventType.CREATE || type == UserEventType.EDIT) {
                const params = getScriptParams();
                log.debug({ title: title + 'params', details: params });

                if (params.storageUnitItemId) {
                    const storageUnitData = getStorageUnitInformation(newRecord, params.storageUnitItemId);
                    log.debug({ title: title + 'storageUnitData', details: storageUnitData });

                    // generateAmortizationSchedules(storageUnitData, newRecord.id);
                    generateSchedules(storageUnitData, newRecord.id);
                }
            }
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }


    function generateSchedules(storageUnitData, invoiceId) {
        const title = 'generateSchedules :: ';
        try {
            let schedules = [];


            let currentDate = storageUnitData.contractStartDate;
            let end = storageUnitData.contractEndDate;
            const totalNumberOfDays = getRemainingDays(end, currentDate);
            log.debug({ title: title + 'totalNumberOfDays', details: totalNumberOfDays });
            const perDayAmount = storageUnitData.amount / totalNumberOfDays;
            log.debug({ title: title + 'perDayAmount', details: perDayAmount });
            let sumOfDays = 0;
            const invoiceRec = record.load({
                type: record.Type.INVOICE,
                id: invoiceId,
                isDynamic: true
            });
            log.debug({ title: title + 'currentDate <= end', details: currentDate <= end });
            while (currentDate <= end && sumOfDays <= totalNumberOfDays) {
                let year = currentDate.getFullYear();
                let month = currentDate.getMonth();
                let monthName = currentDate.toLocaleString('default', { month: 'short' });

                let daysInMonth = new Date(year, month + 1, 0).getDate();;
                let remainingDays = totalNumberOfDays - sumOfDays;
                let numberOfDays = Math.min(daysInMonth - currentDate.getDate() + 1, remainingDays);
                let scheduleEndDate = new Date(year, month, new Date(year, month + 1, 0).getDate());

                const revenueAmount = +perDayAmount * +numberOfDays;

                schedules.push({
                    Date: scheduleEndDate.toISOString().split('T')[0],
                    NumberOfDays: numberOfDays,
                    MonthName: monthName
                });

                invoiceRec.selectNewLine({
                    sublistId: 'recmachcustrecord_dsc_ras_invoice_ref'
                });
                invoiceRec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_dsc_ras_invoice_ref',
                    fieldId: 'custrecord_dsc_ras_date',
                    value: scheduleEndDate
                });
                invoiceRec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_dsc_ras_invoice_ref',
                    fieldId: 'custrecord_dsc_ras_days',
                    value: numberOfDays
                });
                invoiceRec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_dsc_ras_invoice_ref',
                    fieldId: 'custrecord_dsc_ras_month',
                    value: currentDate.getMonth() + 1
                });
                invoiceRec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_dsc_ras_invoice_ref',
                    fieldId: 'custrecord_dsc_ras_per_day_rate',
                    value: perDayAmount
                });
                invoiceRec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_dsc_ras_invoice_ref',
                    fieldId: 'custrecord_dsc_ras_rev_amount',
                    value: revenueAmount
                });

                invoiceRec.commitLine({
                    sublistId: 'recmachcustrecord_dsc_ras_invoice_ref',
                });

                sumOfDays += numberOfDays;

                // Move to the next month's first date
                currentDate.setMonth(month + 1, 1);
            }

            log.debug({ title: title + 'schedules', details: schedules });
            const updatedInovoice = invoiceRec.save();
            log.debug({ title: title + 'updatedInovoice', details: updatedInovoice });
            return schedules;

        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }


    const getStorageUnitInformation = (invoiceRec, storageUnitItemId) => {
        const title = 'getStorageUnitInformation :: ';
        try {
            const tranDate = invoiceRec.getValue({
                fieldId: 'trandate'
            });
            const contractNumber = invoiceRec.getValue({
                fieldId: 'custbody_dsc_contract_line'
            });
            // log.debug({ title: title + 'contractNumber', details: contractNumber });
            if (contractNumber) {


                const contractNumObj = getContractInformation(contractNumber);
                log.debug({ title: title + 'contractNumObj', details: contractNumObj });
                const lineCount = invoiceRec.getLineCount({
                    sublistId: 'item'
                });

                // log.debug({ title: title + 'lineCount', details: lineCount });
                for (let i = 0; i < lineCount; i++) {
                    const itemId = invoiceRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    const quantity = invoiceRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });

                    let amount = invoiceRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    });

                    if (itemId == storageUnitItemId) {

                        const nextLineType = invoiceRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i + 1
                        });

                        if (nextLineType == 'Discount') {
                            const discountAmount = invoiceRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i + 1
                            });

                            amount = +amount + +discountAmount;
                        }

                        return {
                            ...contractNumObj,
                            tranDate,
                            quantity,
                            amount
                        }
                    }
                }
            }
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    const getContractInformation = contractNumberId => {
        const title = 'getContractInformation :: ';
        try {
            const contractNumRec = record.load({
                type: 'customrecord_dsc_contract_line',
                id: contractNumberId,
            });

            let contractStartDate = contractNumRec.getValue({
                fieldId: 'custrecord_dsc_clf_start_date'
            });
            let contractEndDate = contractNumRec.getValue({
                fieldId: 'custrecord_dsc_clf_end_date'
            });

            contractStartDate = format.parse({
                value: format.format({
                    value: contractStartDate,
                    type: format.Type.DATE
                }),
                type: format.Type.DATE
            });

            contractEndDate = format.parse({
                value: format.format({
                    value: contractEndDate,
                    type: format.Type.DATE
                }),
                type: format.Type.DATE
            });

            return {
                contractNumberId,
                contractEndDate,
                contractStartDate
            }
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    const getRemainingDays = (dateOne, dateTwo) => {
        const logTitle = " getRemainingDays() ";
        try {
            if (dateOne instanceof Date && !isNaN(dateOne)) {
                const difference = dateOne.getTime() - dateTwo.getTime();   //returns negative values. we can use abs.
                const remainingDays = Math.round(difference / (1000 * 60 * 60 * 24));
                return remainingDays + 1;
            }
            return null;
        } catch (error) {
            log.error("ERROR IN" + logTitle, error);
            throw error;
        }
    };


    const getScriptParams = () => {
        const title = 'getScriptParams :: ';
        try {
            const scriptObj = runtime.getCurrentScript();
            const storageUnitItemId = scriptObj.getParameter({
                name: 'custscript_dsc_storage_unit_item'
            });

            return {
                storageUnitItemId
            }
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    return {
        afterSubmit
    }
})