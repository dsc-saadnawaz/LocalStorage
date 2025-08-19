/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error', '../../lib/dsc_lib_utils.js', '../../lib/dsc_lib_constants.js'],
    (record, search, n_error, utils, constantsLib) => {
        const beforeSubmit = (context) => {
            const title = "beforeSubmit ::"
            try {
                if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    let recordObj = context.newRecord;
                    // log.debug('recordObj', recordObj);
                    if (recordObj.type == constantsLib.RECORD_TYPES.CONTRACT) {
                        const contractLinesCount = recordObj.getLineCount({
                            sublistId: 'recmachcustrecord_dsc_clf_parent_contract'
                        });
                        // log.debug('contractLinesCount', contractLinesCount);
                        if (contractLinesCount && contractLinesCount > 0) {
                            for (let i = 0; i < contractLinesCount; i++) {
                                const getLineStartDate = recordObj.getSublistValue({
                                    sublistId: 'recmachcustrecord_dsc_clf_parent_contract',
                                    fieldId: 'custrecord_dsc_clf_start_date',
                                    line: i
                                });
                                const getLineDuration = recordObj.getSublistValue({
                                    sublistId: 'recmachcustrecord_dsc_clf_parent_contract',
                                    fieldId: 'custrecord_dsc_clf_duration',
                                    line: i
                                });
                                if (getLineStartDate && constantsLib.DURATION_VALUES[getLineDuration]) {
                                    // let getEndDate = addMonths(getLineStartDate, constantsLib.DURATION_VALUES[getLineDuration]);
                                    let getEndDate = calculateEndDate(getLineStartDate, constantsLib.DURATION_VALUES[getLineDuration]);
                                    if (getEndDate) {
                                        recordObj.setSublistValue({
                                            sublistId: "recmachcustrecord_dsc_clf_parent_contract",
                                            fieldId: "custrecord_dsc_clf_end_date",
                                            line: i,
                                            value: new Date(getEndDate)
                                        })
                                    }
                                }
                            }
                        }
                    } else if (recordObj.type == constantsLib.RECORD_TYPES.CONTRACT_LINE) {
                        let startDate = recordObj.getValue('custrecord_dsc_clf_start_date');
                        let contractDuration = recordObj.getValue('custrecord_dsc_clf_duration');
                        if (startDate && startDate != "" && contractDuration) {
                            let getEndDate = calculateEndDate(startDate, constantsLib.DURATION_VALUES[contractDuration]);

                            // let getEndDate = addMonths(startDate, constantsLib.DURATION_VALUES[contractDuration]);
                            if (getEndDate) {
                                recordObj.setText('custrecord_dsc_clf_end_date', new Date(getEndDate));
                            }
                        }
                    }

                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const calculateEndDate = (startDate, duration) => {
            const title = "calculateEndDate ::"
            try {
                let calculateMonth = new Date(startDate.setMonth(startDate.getMonth() + duration));
                log.debug('calculateMonth',calculateMonth)
                let calculateDate = new Date(calculateMonth - 1);
                if (calculateDate) {
                    log.debug('calculateDate', calculateDate)
                    return calculateDate;
                }
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const isLastDay = (dt) => {
            const title = "isLastDay ::";
            try {
                const date = new Date(dt);
                const year = date.getFullYear();
                const month = date.getMonth() + 1; // JavaScript months are 0-indexed
                const day = date.getDate();
                const lastDayOfMonth = new Date(year, month, 0).getDate();
                return day === lastDayOfMonth;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }

        const addMonths = (date, amount) => {
            const title = "addMonths ::";
            try {
                const endDate = new Date(date.getTime());
                const originalTimeZoneOffset = endDate.getTimezoneOffset();
                endDate.setMonth(endDate.getMonth() + amount);
                while (monthDiff(date, endDate) > amount) {
                    endDate.setDate(endDate.getDate() - 1);
                }
                const endTimeZoneOffset = endDate.getTimezoneOffset();
                const diff = endTimeZoneOffset - originalTimeZoneOffset;
                const finalDate = diff ? endDate.setMinutes(endDate.getMinutes() - diff) : endDate;
                let finalDateCalculate = new Date(finalDate);
                let calculateDate;
                if ((isLastDay(finalDateCalculate) && isLastDay(date))) {
                    calculateDate = finalDateCalculate;
                } else {
                    calculateDate = new Date(finalDateCalculate.setDate(finalDateCalculate.getDate() - 1));
                }
                log.debug('calculateDate', calculateDate)
                return calculateDate;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        const monthDiff = (from, to) => {
            const title = "monthDiff ::"
            try {
                const years = to.getFullYear() - from.getFullYear();
                const months = to.getMonth() - from.getMonth();
                return 12 * years + months;
            } catch (error) {
                log.error({
                    title: title + 'error',
                    details: error
                })
            }
        }
        return {
            beforeSubmit
        }
    });