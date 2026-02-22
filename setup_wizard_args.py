import frappe
from erpnext.setup.setup_wizard.setup_wizard import setup_complete

def execute():
    args = {
        'language': 'English',
        'country': 'India',
        'timezone': 'Asia/Kolkata',
        'currency': 'INR',
        'company_name': 'Shakti Enterprises',
        'company_abbr': 'SE',
        'industry': 'Manufacturing',
        'fy_start_date': '2025-04-01',
        'fy_end_date': '2026-03-31',
        'first_name': 'Shakti',
        'last_name': 'Owner',
        'email': 'admin@erpnext.local',
        'password': 'admin',
        'chart_of_accounts': 'Standard with GST',
        'bank_account': 'Cash',
        'domains': ['Manufacturing']
    }
    setup_complete(args)
    frappe.db.commit()
    print('Setup Wizard Completed Successfully')
