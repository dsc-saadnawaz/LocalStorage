/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(["N/record", "N/search"], (record, search) => {


  
 

  const updateStorageUnit = () => {
    const title = "updateStorageUnit ::";
    try {
      log.debug({ title: title, details: "Executed!" });

      // * INITIALIZE AN ARRAY TO SAVE THE INTERNAL IDs.
      let internalIds = [];

      // * INITIALIZE THE PARAMETERS FOR HEIGHT & WIDTH.  
      const constantNumber = 15
      let width = 3.300 * constantNumber;
      let height = 3.700 * constantNumber; 
      let gapValue = 22.5;
      let xIncreamentValue = 204.47;
      let yIncreamentValue = -447.865;
    

      // * CREATE A SAVE SEARCH
      const leaveEncashmentDaysSearch = search.create({
        type: "customrecord_dsc_storage_unit",
        filters: [
          ['custrecord_dsc_suf_location_floor', 'anyof', '1'],
          'AND',
          ['custrecord_dsc_suf_y_coordinate', 'is', '-544.09'],
          // 'AND',
          // ['name', 'doesnotcontain', 'F1-206'],
          // 'AND',
          // ['name', 'doesnotcontain', 'F1-502'],
          // 'AND',
          // ['name', 'doesnotcontain', 'F1-504'],
          // 'AND',
          // ['name', 'doesnotcontain', 'F1-506'],
          // 'AND',
          // ['name', 'doesnotcontain', 'F1-508'],
          // 'AND',
          // ['name', 'doesnotcontain', 'F1-510'],
        ],
        columns: [search.createColumn({ name: "internalid" , sort: search.Sort.ASC})]
      });


      // * SAVE INTO AN ARRAY
      const myResultSet = leaveEncashmentDaysSearch.run().getRange({
        start: 0,
        end: 99,
      });


      // * GET ALL THE INTERNAL IDs.
      myResultSet.forEach(element => {
          let internalId = element.getValue({name:"internalid"})
          internalIds.push(internalId)

      });

      log.debug({
        title: title + "internalIds:: ",
        details: internalIds,
      });

      // * UPDATE ALL THE RECORDS BASED ON INTERNAL_ID.
      for(let i=0;  i < internalIds.length ; i++){

          
          // * INITIALIZE AN IDs FOR NEXT & PREVIOUS SOTRAGE UNIT.
          const objRecord = record.load({
            type: 'customrecord_dsc_storage_unit',
            id: parseInt(internalIds[i]),
            isDynamic: true
          });

          //   objRecord.setValue({
          //     fieldId: 'custrecord_dsc_suf_height',
          //     value: height,
          //     ignoreFieldChange: true

          // })

          //   objRecord.setValue({
          //       fieldId: 'custrecord_dsc_suf_width',
          //       value: width,
          //       ignoreFieldChange: true

          //   })


           // * CHANGE THE X_CORDINATES:

          //  let xCordinateVal = objRecord.getValue({
          //    fieldId : 'custrecord_dsc_suf_x_coordinate'
          // })

          // xIncreamentValue += (width + 1) * 3

        //   objRecord.setValue({
        //     fieldId: 'custrecord_dsc_suf_x_coordinate',
        //     value: parent(xCordinateVal) + 1,
        //     ignoreFieldChange: true

        // })
          
          // * CHANGE THE Y_CORDINATES:

          // let yCordinateVal = objRecord.getValue({
          //    fieldId : 'custrecord_dsc_suf_y_coordinate'
          // })

          //  objRecord.setValue({
          //     fieldId: 'custrecord_dsc_suf_y_coordinate',
          //     value: yIncreamentValue,
          //     ignoreFieldChange: true

          // })

          // * SET DOOR FIELD VALUE:
          objRecord.setValue({
            fieldId: 'custrecord_dsc_storage_unit_door_positio',
            value: 2,
            ignoreFieldChange: true
          })
         

          objRecord.save();

      } 

      return true;

    } catch (error) {
      log.error({ title: title + "error", details: error });
    }
  };

  const execute = (scriptContext) => {
    const title = "execute ::";

    try {
  

      log.debug({
        title: title,
        details: "Executed!",
      });

      const recordStatus = updateStorageUnit();
      log.debug({
        title: title + "updateStorageUnit:: ",
        details: recordStatus,
      });
    } catch (error) {
      log.error({ title: title + "error", details: error });
    }
  };

  return { execute };
});
