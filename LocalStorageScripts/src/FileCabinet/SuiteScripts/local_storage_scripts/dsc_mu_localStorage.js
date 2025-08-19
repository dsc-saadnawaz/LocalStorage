/**
 /**
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 */
define(['N/record'],
    
    (record) => {
        /**
         * Defines the Mass Update trigger point.
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed
         * @param {number} params.id - ID of the record being processed
         * @since 2016.1
         */
        const each = (params) => {
            // CREATE A RECORD
            const objRecord = record.create({
                type: 'customrecord_dsc_storage_unit', 
                isDynamic: true
            });

            objRecord.setValue({
                fieldId: 'name',
                value: 'S7',
            })

            objRecord.setValue({
                fieldId: 'custrecord_dsc_suf_storage_unit_group',
                value: 1,
            })

            objRecord.setValue({
                fieldId: 'custrecord_dsc_suf_location',
                value: 1,
            })

            objRecord.setValue({
                fieldId: 'custrecord_dsc_suf_location_floor',
                value: 6,
            })
            
            objRecord.setValue({
                fieldId: 'custrecord_dsc_suf_location_floor',
                value: 6,
            })  

            objRecord.setValue({
                fieldId: 'custrecord_dsc_suf_availability_status',
                value: 1,
            })  

            // objRecord.save();

        }

        return {each}

    });
