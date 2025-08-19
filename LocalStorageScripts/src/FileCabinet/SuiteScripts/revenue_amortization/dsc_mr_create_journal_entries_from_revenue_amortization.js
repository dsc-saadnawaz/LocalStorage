/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/runtime', 'N/record', 'N/search', 'N/format', '../local_storage_customizations/lib/dsc_lib_constants.js', '../local_storage_customizations/lib/dsc_lib_utils.js'], (runtime, record, search, format, constants, utils) => {
    const getInputData = context => {
        const title = 'getInputData :: ';
        try {
            const params = getScriptParams();
            log.debug({ title: title + 'params', details: params });
            if (params.revenueAccountId && params.unearnedRevAccountId) {
                const revScheduleDataMapObj = getRevenueAmortizationSchedules() || {};
                log.debug({ title: title + 'revScheduleDataMapObj', details: revScheduleDataMapObj });

                return revScheduleDataMapObj;
            }
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    const reduce = context => {
        const title = 'reduce :: ';
        const key = context.key;
        const values = context.values;
        const revDataJson = values[0];
        try {
            const revDataObj = JSON.parse(revDataJson);
            log.debug({ title: title + 'revDataObj', details: revDataObj });
            const params = getScriptParams();
            log.debug({ title: title + 'params', details: params });
            if (params.revenueAccountId && params.unearnedRevAccountId) {
                const journalEntry = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true
                });
                journalEntry.setText({
                    fieldId: 'trandate',
                    text: revDataObj.revRecDate
                })
                journalEntry.setValue({
                    fieldId: 'custbody_dsc_rev_amortization_sch_id',
                    value: key
                })
                journalEntry.selectNewLine({
                    sublistId: 'line'
                });
                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: params.unearnedRevAccountId
                })
                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: revDataObj.revAmount
                })
                journalEntry.commitLine({
                    sublistId: 'line'
                });
                journalEntry.selectNewLine({
                    sublistId: 'line'
                });
                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: params.revenueAccountId
                })
                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: revDataObj.revAmount
                })
                journalEntry.commitLine({
                    sublistId: 'line'
                });
                const journalEntryId = journalEntry.save();
                log.debug({ title: title + 'journalEntryId', details: journalEntryId });
                record.submitFields({
                    type: 'customrecord_dsc_inv_rev_amrt_schedule',
                    id: key,
                    values: {
                        'custrecord_dsc_ras_journal_entry': journalEntryId,
                        'custrecord_dsc_ras_error_message': ``,
                        'custrecord_dsc_ras_status': constants.RevenueAmortizationScheduleStatus.RECOGNIZED
                    }
                })
            }

        } catch (error) {
            log.error({ title: title + 'error', details: error });
            record.submitFields({
                type: 'customrecord_dsc_inv_rev_amrt_schedule',
                id: key,
                values: {
                    'custrecord_dsc_ras_error_message': `${error.message}\n----------------\n\nPAYLOAD=>${revDataJson}`,
                    'custrecord_dsc_ras_status': constants.RevenueAmortizationScheduleStatus.ERRORED
                }
            })
        }
    }

    const getRevenueAmortizationSchedules = () => {
        const title = 'getRevenueAmortizationSchedules :: ';
        try {
            const revAmortizationScheduleDataMapObj = {};
            const revScheduleSearch = search.create({
                type: 'customrecord_dsc_inv_rev_amrt_schedule',
                columns: [
                    search.createColumn({
                        name: 'internalid'
                    }),
                    search.createColumn({
                        name: 'name'
                    }),
                    search.createColumn({
                        name: 'custrecord_dsc_ras_days'
                    }),
                    search.createColumn({
                        name: 'custrecord_dsc_ras_month'
                    }),
                    search.createColumn({
                        name: 'custrecord_dsc_ras_per_day_rate'
                    }),
                    search.createColumn({
                        name: 'custrecord_dsc_ras_rev_amount'
                    }),
                    search.createColumn({
                        name: 'custrecord_dsc_ras_invoice_ref'
                    }),
                    search.createColumn({
                        name: 'custrecord_dsc_ras_status'
                    }),
                    search.createColumn({
                        name: 'custrecord_dsc_ras_date'
                    }),
                ],
                filters: [
                    ['isinactive', 'is', ['F']],
                    'AND',
                    // ['custrecord_dsc_ras_date', 'on', 'today'],
                    // 'AND',
                    ['custrecord_dsc_ras_status', 'anyof', [constants.RevenueAmortizationScheduleStatus.PENDING]]
                ]
            });

            const results = utils.getAllSearchResults(revScheduleSearch);
            log.debug({ title: title + 'results.length', details: results.length });

            for (let i = 0; i < results.length; i++) {
                const scheduleId = results[i].getValue({
                    name: 'internalid'
                });
                const scheduleName = results[i].getValue({
                    name: 'name'
                });
                const numberOfDays = results[i].getValue({
                    name: 'custrecord_dsc_ras_days'
                });
                const monthName = results[i].getValue({
                    name: 'custrecord_dsc_ras_month'
                });
                const perDayRate = results[i].getValue({
                    name: 'custrecord_dsc_ras_per_day_rate'
                });
                const revAmount = results[i].getValue({
                    name: 'custrecord_dsc_ras_rev_amount'
                });
                const invoiceId = results[i].getValue({
                    name: 'custrecord_dsc_ras_invoice_ref'
                });
                const invoiceNumber = results[i].getText({
                    name: 'custrecord_dsc_ras_invoice_ref'
                });
                const status = results[i].getValue({
                    name: 'custrecord_dsc_ras_status'
                });
                const statusTxt = results[i].getText({
                    name: 'custrecord_dsc_ras_status'
                })
                const revRecDate = results[i].getValue({
                    name: 'custrecord_dsc_ras_date'
                })

                if (!revAmortizationScheduleDataMapObj[scheduleId]) {
                    revAmortizationScheduleDataMapObj[scheduleId] = {
                        status,
                        statusTxt,
                        invoiceNumber,
                        invoiceId,
                        revAmount,
                        perDayRate,
                        monthName,
                        numberOfDays,
                        scheduleName,
                        revRecDate: format.format({
                            type: format.Type.DATE,
                            value: revRecDate
                        })
                    }
                }
            }

            return revAmortizationScheduleDataMapObj;
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    const getScriptParams = () => {
        const title = 'getScriptParams :: ';
        try {
            const scriptObj = runtime.getCurrentScript();
            const unearnedRevAccountId = scriptObj.getParameter({
                name: 'custscript_dsc_unearned_rev_account_id'
            });
            const revenueAccountId = scriptObj.getParameter({
                name: 'custscript_dsc_rev_account_id'
            });

            return {
                unearnedRevAccountId,
                revenueAccountId
            }
        } catch (error) {
            log.error({ title: title + 'error', details: error });
        }
    }

    return {
        getInputData,
        reduce
    }
})