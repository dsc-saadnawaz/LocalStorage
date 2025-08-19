/**
 * @NApiVersion 2.1
 */

define([], () => {
    return {
        //sandbox
        // NETWORK_PAYMENT: {
        //     OUTLET_ID: "ca864e35-0852-434d-b750-2faa99d376ad",
        //     API_KEY: `Basic YWU5NzZiMzMtY2VjYi00YjRmLTgxY2QtOTk4MTI3ZTZmODBjOjMyYTJmOWZmLTY1MWYtNGI2ZS05ZGI0LWRiYTc2ZDBlNjI5Mg==`,
        //     CONTENT_TYPE: `application/vnd.ni-identity.v1+json`,
        //     ACCEPT: `application/vnd.ni-identity.v1+json`,
        //     API_ACCESS_TOKEN: `https://api-gateway.sandbox.ngenius-payments.com/identity/auth/access-token`,
        //     API_INVOICE_LINK: `https://api-gateway.sandbox.ngenius-payments.com/invoices/outlets/ca864e35-0852-434d-b750-2faa99d376ad/invoice`,
        //     API_PAYMENT_NOTIFICATION: `https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/ca864e35-0852-434d-b750-2faa99d376ad/orders/`
        // },
        NETWORK_PAYMENT: {
            OUTLET_ID: "a035ea01-7650-4a40-bc33-5644d23fa834",
            API_KEY: `Basic N2MwMTAwYTEtMGY1OS00MTIxLWJmZWYtNTA1Yjk4YTQ0NTFiOmFiOWY2ZWZjLTlkZDAtNDQwYy04MjE5LTg3N2IzZDYxMzAzMw==`,
            CONTENT_TYPE: `application/vnd.ni-identity.v1+json`,
            ACCEPT: `application/vnd.ni-identity.v1+json`,
            API_ACCESS_TOKEN: `https://api-gateway.ngenius-payments.com/identity/auth/access-token`,
            API_INVOICE_LINK: `https://api-gateway.ngenius-payments.com/invoices/outlets/a035ea01-7650-4a40-bc33-5644d23fa834/invoice`,
            API_PAYMENT_NOTIFICATION: `https://api-gateway.ngenius-payments.com/transactions/outlets/a035ea01-7650-4a40-bc33-5644d23fa834/orders/`
        },
        NETWORK_PAYMENT_INVOICE_STATUS: {
            SYNECD: "1",
            ERRORED: "2",
            EXPIRED: "3",
        },
        CONTRACT_RENEWAL_HTML_FORM : "1821",
        SALES_ORDER_LINK : "https://8977849.app.netsuite.com/app/accounting/transactions/salesord.nl",
        FIELD_VALUES: {
            PAYMENT_TYPE_PARTIAL_PAYMENT: "1",
            PAYMENT_TYPE_FULL_PAYMENT: "2",
            APPROVAL_STATUS_PENDING_APPROVAL: "1",
            APPROVAL_STATUS_APPROVED: "2",
            APPROVAL_STATUS_REJECTED: "3",
            CONTRACT_STATUS_OPEN: "1",
            CONTRACT_STATUS_PENDING_SIGNATURE: "2",
            CONTRACT_STATUS_CLOSED: "5",
            CONTRACT_LINE_STATUS_OPEN: "1",
            CONTRACT_LINE_STATUS_CLOSED: "2",
            CONTRACT_LINE_STATUS_INPROGRESS: "1",
            CONTRACT_TYPE_STANDARD: "1",
            CONTRACT_TYPE_RENEWAL: "2",
            CHECKOUT_STATUS_INSPECTION: "1",
            CHECKOUT_STATUS_CLOSED: "3",
            CHECKOUT_STATUS_REFUND_PROCESSED: "5",
            CHECKOUT_STATUS_REFUND_PENDING: "4",
            CONTRACT_STATUS_CHECKOUT_IN_PROGRESS: "4",
            CONTRACT_STATUS_SIGNED: "3",
            STORAGE_UNIT_STATUS_OCCUPIED: "2",
            STORAGE_UNIT_STATUS_AVAILABLE: "1",
            LOCATION_PRODUCTION_CITY: "1",
            AVAILABILITY_STATUS_AVAILABLE: "1",
            AVAILABILITY_STATUS_OCCUPIED: "2",
            PAYMENT_METHOD_ONLINE: "7",
            SALES_ORDER_STATUS_PENDING_APPROVAL: "Pending Approval"
        },
        MAP_REDUCE_SCRIPTS: {
            RECURRING_INVOICES_SCRIPT: "customscript_dsc_mr_create_recurring_inv"
        },
        PAYMENT_BILLING_SCHEDULE: {
            INVOICE_STATUS_PENDING: "1",
            INVOICE_STATUS_COMPLETE: "2",
        },
        PAYMENT_METHOD : {
            "creditcardPayment" : 10,
            "onlinePayment" : 7,
            "checkPayment" : 2,
            "cashPayment" : 1
        },
        DURATION_VALUES: {
            "1": 1,
            "2": 2,
            "3": 3,
            "4": 4,
            "5": 5,
            "6": 6,
            "7": 7,
            "8": 8,
            "9": 9,
            "10": 10,
            "11": 11,
            "12": 12,
            "25": 14
        },
        LIST_TYPES: {
            CONTRACT_LINE_DURATION: "customlist_dsc_cl_duration",
        },
        RECORD_TYPES: {
            CONTRACT: "customrecord_dsc_contract",
            CONTRACT_LINE: "customrecord_dsc_contract_line",
            STORAGE_UNIT: "customrecord_dsc_storage_unit",
            STORAGE_UNIT_PRICING: "customrecord_dsc_storage_unit_pricing",
            CHECKOUT: "customrecord_dsc_checkout",
            BILLING_SCHEDULE: "customrecord_dsc_payment_billing_sch"
        },
        RECORDS_LINKS: {
            CONTRACT_LINE: "https://8977849-sb1.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=174",
            CHECKOUT: "https://8977849-sb1.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=172"
        },
        FILE_PATHS: {
            CLIENT_SCRIPTS: {
                CONTRACT_UI_AUTOMATIONS: "SuiteScripts/local_storage_customizations/scripts/client/dsc_cs_contract_ui_automations.js",
                CONTRACT_LINE_UI_AUTOMATIONS: "SuiteScripts/local_storage_customizations/scripts/client/dsc_cs_contract_line_ui_automations.js",
                CHECKOUT_UI_AUTOMATIONS: "SuiteScripts/local_storage_customizations/scripts/client/dsc_cs_checkout_ui_automations.js"
            },
            PDF_TEMPLATES: {
                CONTRACT_PDF_TEMPLATE: "SuiteScripts/local_storage_customizations/pdf_templates/contract_pdf_template.xml",
                GENERATE_INSPECTION_CHECKLIST_TEMPLATE: "SuiteScripts/local_storage_customizations/pdf_templates/generate_inspection_checklist_template.xml",
                CHECKOUT_PDF_TEMPALTE: "SuiteScripts/local_storage_customizations/pdf_templates/checkout_pdf_template.xml"
            }
        },
        SUITELET_SCRIPTS: {
            GENERATE_CONTRACT_PDF: {
                SCRIPT_ID: "customscript_dsc_sl_gnrt_contract_pdf",
                DEPLOY_ID: "customdeploy_dsc_sl_gnrt_contract_pdf"
            },
            CREATE_SALES_ORDER: {
                SCRIPT_ID: "customscript_dsc_sl_contract_num_cr_so",
                DEPLOY_ID: "customdeploy_dsc_sl_contract_num_cr_so"
            },
            CONTRACT_RENEWAL_PROCESS: {
                SCRIPT_ID: "customscript_dsc_sl_contract_renewal_for",
                DEPLOY_ID: "customdeploy_dsc_sl_contract_renewal_for"
            },
            GENERATE_INSPECTION_CHECKLIST: {
                SCRIPT_ID: "customscript_dsc_sl_generate_checklist",
                DEPLOY_ID: "customdeploy_dsc_sl_generate_checklist"
            },
            GENERATE_CHECKOUT_PDF: {
                SCRIPT_ID: "customscript_dsc_sl_generate_checkout",
                DEPLOY_ID: "customdeploy_dsc_sl_generate_checkout"
            }
        },
        EMAIL_TEMPLATES: {
            RENEWAL_ALERT_EMAIL_TEMPLATE_ID: "2"
        },
        EMAIL_AUTHOR_ID: "1321",//"-5",
        PADLOCK_ITEM_ID: "11",
        LATE_CHARGE_ITEM_ID : "8",
        DAMAGE_ITEM_ID: "7",
        PACKING_CHARGES_ITEM_ID: "10",
        LOCAL_STORAGE_UNIT_ITEM_ID: "9",
        SECURITY_DEPOSIT_ID: "12",
        NETWORK_LATE_CHARGES_ITEM: "8",
        OTHER_CHRAGES_ITEM: "15",
        VAT_PERCENTAGE: "0.05",
        CONTACT_EXPIRATION_DATES: {
            "1": 3,
            "2": 7,
            "3": 10
        },
        STORAGE_UNIT_GROUP_NAME_SEQUENCE: [{
            fieldId: "custrecord_dsc_sugf_length",
            method: "getValue"
        }, {
            fieldId: "custrecord_dsc_sugf_width",
            method: "getValue"
        }, {
            fieldId: "custrecord_dsc_sugf_height",
            method: "getValue"
        }],
        STORAGE_UNIT_ITEM_DISABLED_COLUMNS: [
            {
                fieldId: "rate"
            },
            {
                fieldId: "amount"
            },
            {
                fieldId: "tax1amt"
            },
            {
                fieldId: "grossamt"
            }
        ],
        NON_STORAGE_UNIT_ITEM_DISABLED_COLUMNS: [
            // {
            //     fieldId: "location"
            // },
            {
                fieldId: "custcol_dsc_location_floor"
            },
            {
                fieldId: "custcol_dsc_storage_content_info"
            },
            {
                fieldId: "custcol_dsc_storage_unit"
            },
        ],
        MONTH_NUM_OF_DAYS: 30,
        RevenueAmortizationScheduleStatus: {
            PENDING: 1,
            RECOGNIZED: 2,
            ERRORED: 3
        },
        PRICE_LEVEL_CUSTOM: -1, //"Custom" Price Level 
        SUMMER_DISCOUNT_ITEM_ID: "16", //Summer Promo Discount
        ONE_MONTH_DISCOUNT_ITEM: "13", //ONE_MONTH_DISCOUNT_ITEM
        TWO_MONTH_DISCOUNT_ITEM: "14", //TWO_MONTH_DISCOUNT_ITEM
        SUMMER_DISCOUNT_APPLICABLE_STORAGE_GROUPS: [
            "SUG-11-100 SFT",
            "SUG-14-150 SFT"
        ],
        LOCAL_STORAGE_DISCOUNT_ITEMS_IDS: [
            "-6", //Partner Discount
            "16", //Summer Promo Discount
            "13", //ONE_MONTH_DISCOUNT_ITEM
            "14" //TWO_MONTH_DISCOUNT_ITEM
        ]
    }
});